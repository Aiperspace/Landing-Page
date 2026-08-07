"""High-level pipelines that prepare PDF context and invoke the DeepAgents orchestrator."""

from __future__ import annotations

import json
from datetime import date
from typing import Any, Callable

from agents.orchestrator import invoke_orchestrator
from agents.page_search import index_pdf_bytes
from agents.router import Intent, route_intent
from agents.store import DocumentStore, reset_store, set_store

ProgressCb = Callable[[str], None] | None


def _with_store(store: DocumentStore, fn):
    token = set_store(store)
    try:
        return fn()
    finally:
        reset_store(token)


def run_feature_extraction(
    *,
    pdf_a: bytes,
    pdf_b: bytes,
    name_a: str = "pdf_a",
    name_b: str = "pdf_b",
    user_notes: str = "",
    parameter_hint: str | None = None,
    progress: ProgressCb = None,
) -> dict[str, Any]:
    """Index two PDFs and run the feature-extraction / compatibility pipeline."""
    store = DocumentStore()
    if progress:
        progress("Indexing PDF pages for feature extraction")
    n_a = index_pdf_bytes(store, "pdf_a", pdf_a)
    n_b = index_pdf_bytes(store, "pdf_b", pdf_b)
    if n_a == 0 or n_b == 0:
        raise ValueError("Could not extract text from one or both PDFs (expected text PDFs, not scanned)")

    hint = parameter_hint or (
        "input_voltage_min, input_voltage_nominal, input_voltage_max, average_power, peak_power, "
        "interface_type, protocol, data_rate, connector, operating_temperature_min, "
        "operating_temperature_max, mass, dimensions"
    )
    task = f"""
Intent: feature_extraction
Compare two aerospace component PDFs for integration compatibility.

Document pdf_a filename: {name_a} ({n_a} text pages indexed)
Document pdf_b filename: {name_b} ({n_b} text pages indexed)

User notes:
{user_notes or "(none)"}

Focus parameter families when present:
{hint}

Plan with write_todos, then delegate to feature-extractor.
Return the final compatibility JSON only.
"""

    def _run():
        return invoke_orchestrator(task, progress=progress)

    return _with_store(store, _run)


def run_document_generation(
    *,
    description: str,
    template_type: str,
    outline: list[str],
    notes: str = "",
    file_names: list[str] | None = None,
    pdf_files: list[tuple[str, bytes]] | None = None,
    extra_context: str = "",
    template_spec: dict[str, Any] | None = None,
    progress: ProgressCb = None,
) -> dict[str, Any]:
    """Index optional PDFs and run the document-generation pipeline."""
    store = DocumentStore()
    pdf_files = pdf_files or []
    indexed = []
    if progress and pdf_files:
        progress("Indexing uploaded PDF pages")
    for i, (name, data) in enumerate(pdf_files):
        doc_id = f"upload_{i}"
        pages = index_pdf_bytes(store, doc_id, data)
        indexed.append({"doc_id": doc_id, "filename": name, "pages": pages})

    today = date.today().strftime("%d/%m/%Y")
    spec_text = json.dumps(template_spec or {}, ensure_ascii=False, indent=2)
    task = f"""
Intent: document_generation
Generate an aerospace technical document.

Date: {today}
Template type: {template_type}
Required outline (exact section titles and order): {json.dumps(outline, ensure_ascii=False)}
Template spec:
{spec_text}

User description:
{description}

Additional notes:
{notes or "(none)"}

Uploaded file names:
{json.dumps(file_names or [n for n, _ in pdf_files], ensure_ascii=False)}

Indexed PDFs:
{json.dumps(indexed, ensure_ascii=False)}

Non-PDF / supplementary extracted evidence:
{extra_context or "(none)"}

Plan with write_todos, then delegate to document-generator.
Return final document JSON only with title + sections matching the outline.
"""

    def _run():
        return invoke_orchestrator(task, progress=progress)

    return _with_store(store, _run)


def run_routed_request(
    *,
    user_text: str,
    pdf_a: bytes | None = None,
    pdf_b: bytes | None = None,
    name_a: str = "pdf_a",
    name_b: str = "pdf_b",
    description: str = "",
    template_type: str = "test_procedure",
    outline: list[str] | None = None,
    notes: str = "",
    pdf_files: list[tuple[str, bytes]] | None = None,
    extra_context: str = "",
    template_spec: dict[str, Any] | None = None,
    forced_intent: Intent | None = None,
    progress: ProgressCb = None,
) -> dict[str, Any]:
    """
    Router entrypoint: classify intent, then run the matching pipeline.
    Returns {"intent": ..., "router": {...}, "result": {...}}.
    """
    text = user_text or description or notes
    if progress:
        progress("Routing request intent")
    decision = route_intent(text, forced=forced_intent, use_llm=True)
    intent = Intent(decision["intent"])

    if intent == Intent.FEATURE_EXTRACTION:
        if not pdf_a or not pdf_b:
            raise ValueError("feature_extraction requires two PDF inputs (pdf_a and pdf_b)")
        result = run_feature_extraction(
            pdf_a=pdf_a,
            pdf_b=pdf_b,
            name_a=name_a,
            name_b=name_b,
            user_notes=text,
            progress=progress,
        )
    else:
        result = run_document_generation(
            description=description or user_text,
            template_type=template_type,
            outline=outline or ["Purpose"],
            notes=notes,
            pdf_files=pdf_files,
            extra_context=extra_context,
            template_spec=template_spec,
            progress=progress,
        )

    return {"intent": intent.value, "router": decision, "result": result}
