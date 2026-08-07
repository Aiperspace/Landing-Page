"""Intent router: document generation vs feature extraction."""

from __future__ import annotations

import json
import re
from enum import Enum
from typing import Any

from agents.llm import get_chat_model


class Intent(str, Enum):
    DOCUMENT_GENERATION = "document_generation"
    FEATURE_EXTRACTION = "feature_extraction"


_DOC_HINTS = re.compile(
    r"\b(generat|draft|writ|document|procedure|test\s*log|test\s*report|icd|"
    r"verification|outline|section|template|ecss)\w*\b",
    re.I,
)
_EXTRACT_HINTS = re.compile(
    r"\b(compar|compatib|extract|parameter|feature|spec\s*sheet|datasheet|"
    r"voltage|interface|whitelist|llm-compare|side.?by.?side)\w*\b",
    re.I,
)


def _heuristic_intent(text: str, hint: Intent | None = None) -> Intent | None:
    if hint is not None:
        return hint
    doc_score = len(_DOC_HINTS.findall(text))
    extract_score = len(_EXTRACT_HINTS.findall(text))
    if doc_score == 0 and extract_score == 0:
        return None
    if extract_score > doc_score:
        return Intent.FEATURE_EXTRACTION
    if doc_score > extract_score:
        return Intent.DOCUMENT_GENERATION
    return None


def route_intent(
    user_text: str,
    *,
    forced: Intent | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    """
    Decide which pipeline to run.

    Returns:
        {"intent": Intent value, "confidence": float, "reason": str}
    """
    text = (user_text or "").strip()
    if forced is not None:
        return {
            "intent": forced.value,
            "confidence": 1.0,
            "reason": "forced_by_caller",
        }

    heuristic = _heuristic_intent(text)
    if heuristic is not None and not use_llm:
        return {
            "intent": heuristic.value,
            "confidence": 0.7,
            "reason": "heuristic",
        }

    if not text:
        # Empty prompt with two PDFs is almost always compatibility / extraction.
        return {
            "intent": Intent.FEATURE_EXTRACTION.value,
            "confidence": 0.55,
            "reason": "empty_prompt_default_extraction",
        }

    try:
        model = get_chat_model(temperature=0)
        prompt = (
            "Classify the user request into exactly one intent.\n"
            "Intents:\n"
            "- document_generation: write/draft/generate an engineering document from notes/files\n"
            "- feature_extraction: extract specs or compare two component PDFs for compatibility\n\n"
            "Return JSON only: {\"intent\": \"document_generation\"|\"feature_extraction\", "
            "\"confidence\": 0-1, \"reason\": \"short\"}\n\n"
            f"User request:\n{text[:4000]}"
        )
        response = model.invoke(
            [
                {"role": "system", "content": "You are a strict intent router. JSON only."},
                {"role": "user", "content": prompt},
            ]
        )
        content = getattr(response, "content", "") or ""
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part) for part in content
            )
        # Strip optional markdown fences
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.I | re.S)
        parsed = json.loads(cleaned)
        intent_raw = str(parsed.get("intent", "")).strip()
        if intent_raw not in {Intent.DOCUMENT_GENERATION.value, Intent.FEATURE_EXTRACTION.value}:
            raise ValueError(f"Unknown intent: {intent_raw}")
        confidence = float(parsed.get("confidence", 0.8))
        return {
            "intent": intent_raw,
            "confidence": max(0.0, min(confidence, 1.0)),
            "reason": str(parsed.get("reason", "llm_router")),
        }
    except Exception as exc:
        fallback = heuristic or Intent.DOCUMENT_GENERATION
        return {
            "intent": fallback.value,
            "confidence": 0.5,
            "reason": f"router_fallback:{exc}",
        }
