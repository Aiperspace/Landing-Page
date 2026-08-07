"""Request-scoped in-memory store for PDF page corpora used by agent tools."""

from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PageRecord:
    doc_id: str
    page_num: int
    text: str


@dataclass
class DocumentStore:
    """Holds per-request PDF page text and optional metadata for tools."""

    pages: list[PageRecord] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)

    def clear(self) -> None:
        self.pages.clear()
        self.meta.clear()

    def add_page(self, doc_id: str, page_num: int, text: str) -> None:
        cleaned = (text or "").strip()
        if not cleaned:
            return
        self.pages.append(PageRecord(doc_id=doc_id, page_num=page_num, text=cleaned))

    def pages_for(self, doc_id: str | None = None) -> list[PageRecord]:
        if doc_id is None:
            return list(self.pages)
        return [p for p in self.pages if p.doc_id == doc_id]

    def full_text(self, doc_id: str, max_chars: int | None = None) -> str:
        """Concatenate full pages for a doc. Pages are never truncated individually."""
        parts = [f"[page {p.page_num}]\n{p.text}" for p in self.pages_for(doc_id)]
        joined = "\n\n".join(parts)
        if max_chars is None or max_chars <= 0:
            return joined
        return joined[:max_chars]


_STORE: ContextVar[DocumentStore | None] = ContextVar("agent_document_store", default=None)


def get_store() -> DocumentStore:
    store = _STORE.get()
    if store is None:
        store = DocumentStore()
        _STORE.set(store)
    return store


def set_store(store: DocumentStore):
    return _STORE.set(store)


def reset_store(token) -> None:
    _STORE.reset(token)
