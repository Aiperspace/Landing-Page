"""DeepAgents orchestrator with plan-todos and specialized subagents."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from typing import Any, Callable

from deepagents import create_deep_agent
from langchain.agents.middleware import TodoListMiddleware

from agents.llm import get_chat_model
from agents.page_search import PAGE_TOOLS

ProgressCb = Callable[[str], None] | None


ORCHESTRATOR_SYSTEM = """You are the aerospace document-intelligence orchestrator.

You MUST:
1. Use write_todos to plan concrete steps before doing work.
2. Delegate specialized work with the task tool to the correct subagent.
3. Never invent engineering values; use tools / subagent results only.
4. Return a single final JSON object as your last message (no markdown fences).

Subagents:
- feature-extractor: PDF scanning, parameter extraction, compatibility comparison.
- document-generator: ECSS-style technical document drafting from evidence.

Routing rules:
- If the user intent is feature extraction / PDF compare → delegate to feature-extractor.
- If the user intent is document generation → delegate to document-generator.
- You may call search_pages yourself only for quick orientation; heavy work belongs in subagents.
"""

FEATURE_EXTRACTOR_PROMPT = """You extract and compare aerospace component specifications from indexed PDFs.

Tools:
- list_indexed_docs, search_pages, get_page_text

Workflow:
1. write_todos with extraction steps.
2. Discover docs via list_indexed_docs.
3. search_pages for each critical parameter (voltage, power, interface, protocol, connector, temp, mass…).
   Each hit already contains the full page text — do not assume truncated snippets.
4. Use get_page_text only if you need a specific page by number.
5. Produce ONE JSON object matching:
{
  "<Parameter_Name>": {"A": "...", "B": "...", "Status": "OK"|"Different"|"Missing"},
  "Summary": "...",
  "DetectedComponents": {
    "component_a_type": "...",
    "component_b_type": "...",
    "component_a_confidence": 0.0,
    "component_b_confidence": 0.0,
    "pair_key": "a__b",
    "pair_supported": true,
    "component_a_evidence": "...",
    "component_b_evidence": "..."
  }
}
Rules:
- Status must be exactly OK, Different, or Missing.
- Prefer parameters relevant to integration compatibility.
- Do not invent missing values; use Missing.
- Final message must be JSON only (no markdown).
"""

DOCUMENT_GENERATOR_PROMPT = """You generate aerospace technical documents from user description, notes, and indexed PDF evidence.

Tools:
- list_indexed_docs, search_pages, get_page_text

Workflow:
1. write_todos with planning + drafting steps.
2. Search evidence pages for each required outline section.
3. Draft grounded content; use exactly "Not provided" when evidence is absent.
4. Final message must be JSON only:
{
  "title": "string",
  "sections": [{"title": "string", "content": "string"}]
}
Rules:
- Keep section titles/order exactly as provided in the task outline.
- Formal engineering tone. No invented measurements, IDs, or dates.
- Do not wrap JSON in markdown fences.
"""


def _subagents() -> list[dict]:
    return [
        {
            "name": "feature-extractor",
            "description": (
                "Extract specs from PDFs and compare two components for compatibility. "
                "Use for feature extraction, datasheet scanning, and PDF comparison."
            ),
            "system_prompt": FEATURE_EXTRACTOR_PROMPT,
            "tools": list(PAGE_TOOLS),
            "middleware": [TodoListMiddleware()],
        },
        {
            "name": "document-generator",
            "description": (
                "Generate ECSS-style aerospace documents (procedures, logs, reports, ICD) "
                "from description, notes, and indexed PDF evidence."
            ),
            "system_prompt": DOCUMENT_GENERATOR_PROMPT,
            "tools": list(PAGE_TOOLS),
            "middleware": [TodoListMiddleware()],
        },
    ]


@lru_cache(maxsize=1)
def build_orchestrator():
    """Create the main DeepAgent orchestrator (plan todos + subagent delegation)."""
    return create_deep_agent(
        model=get_chat_model(temperature=0.2),
        tools=list(PAGE_TOOLS),
        system_prompt=ORCHESTRATOR_SYSTEM,
        middleware=[TodoListMiddleware()],
        subagents=_subagents(),
    )


def _extract_json_object(text: str) -> dict[str, Any]:
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Empty agent response")
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.I | re.S).strip()
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", raw, flags=re.S)
    if not match:
        raise ValueError("Agent response did not contain a JSON object")
    parsed = json.loads(match.group(0))
    if not isinstance(parsed, dict):
        raise ValueError("Parsed JSON is not an object")
    return parsed


def _last_message_text(result: dict[str, Any]) -> str:
    messages = result.get("messages") or []
    if not messages:
        return ""
    last = messages[-1]
    content = getattr(last, "content", None)
    if content is None and isinstance(last, dict):
        content = last.get("content", "")
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and "text" in part:
                parts.append(str(part["text"]))
            else:
                parts.append(str(part))
        return "".join(parts)
    return str(content or "")


def invoke_orchestrator(user_payload: str, *, progress: ProgressCb = None) -> dict[str, Any]:
    """
    Run the orchestrator on a fully-formed user task string.
    Returns the parsed JSON object from the final agent message.
    """
    if progress:
        progress("Orchestrator planning with write_todos")
    agent = build_orchestrator()
    if progress:
        progress("Delegating to specialized subagent")
    result = agent.invoke({"messages": [{"role": "user", "content": user_payload}]})
    if progress:
        progress("Collecting structured agent result")
    text = _last_message_text(result)
    return _extract_json_object(text)
