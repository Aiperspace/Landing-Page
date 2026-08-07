"""PDF page indexing and BM25 / sentence-transformer search tools for DeepAgents."""

from __future__ import annotations

import io
import json
import os
import re
from functools import lru_cache
from typing import Literal

from pypdf import PdfReader

from agents.store import DocumentStore, get_store

SearchBackend = Literal["bm25", "embeddings", "hybrid"]


def page_search_backend() -> SearchBackend:
    raw = os.getenv("PAGE_SEARCH_BACKEND", "bm25").lower().strip()
    if raw in ("bm25", "embeddings", "hybrid"):
        return raw  # type: ignore[return-value]
    return "bm25"


def embedding_model_name() -> str:
    return os.getenv("PAGE_SEARCH_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


def index_pdf_bytes(store: DocumentStore, doc_id: str, pdf_bytes: bytes) -> int:
    """
    Split a text-based (non-scanned) PDF into pages and store them.
    Returns number of pages with extractable text.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    count = 0
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            store.add_page(doc_id, i + 1, text)
            count += 1
    return count


def _tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if t]


@lru_cache(maxsize=1)
def _embedding_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(embedding_model_name())


def _bm25_search(
    query: str,
    pages: list,
    top_k: int,
) -> list[tuple[float, object]]:
    from rank_bm25 import BM25Okapi

    if not pages:
        return []
    corpus = [_tokenize(p.text) for p in pages]
    # Empty docs break BM25; keep a placeholder token.
    corpus = [tokens or ["_empty_"] for tokens in corpus]
    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(_tokenize(query) or ["_empty_"])
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
    return [(float(score), pages[idx]) for idx, score in ranked if score > 0]


def _embedding_search(
    query: str,
    pages: list,
    top_k: int,
) -> list[tuple[float, object]]:
    if not pages:
        return []
    model = _embedding_model()
    page_texts = [p.text for p in pages]
    page_emb = model.encode(page_texts, normalize_embeddings=True)
    query_emb = model.encode([query], normalize_embeddings=True)[0]
    # Cosine similarity with normalized vectors == dot product
    scores = page_emb @ query_emb
    ranked = sorted(enumerate(scores), key=lambda x: float(x[1]), reverse=True)[:top_k]
    return [(float(score), pages[idx]) for idx, score in ranked if float(score) > 0]


def search_page_corpus(
    store: DocumentStore,
    query: str,
    top_k: int = 5,
    doc_id: str | None = None,
    backend: SearchBackend | None = None,
) -> list[dict]:
    pages = store.pages_for(doc_id)
    mode = backend or page_search_backend()
    top_k = max(1, min(int(top_k), 20))

    if mode == "embeddings":
        hits = _embedding_search(query, pages, top_k)
    elif mode == "hybrid":
        bm25_hits = {id(p): (s, p) for s, p in _bm25_search(query, pages, top_k * 2)}
        emb_hits = {id(p): (s, p) for s, p in _embedding_search(query, pages, top_k * 2)}
        merged: dict[int, tuple[float, object]] = {}
        for key, (s, p) in bm25_hits.items():
            merged[key] = (s, p)
        for key, (s, p) in emb_hits.items():
            if key in merged:
                merged[key] = (merged[key][0] + s, p)
            else:
                merged[key] = (s, p)
        hits = sorted(merged.values(), key=lambda x: x[0], reverse=True)[:top_k]
    else:
        hits = _bm25_search(query, pages, top_k)

    results = []
    for score, page in hits:
        # Chunk = full extracted page text (never mid-page truncation).
        results.append(
            {
                "doc_id": page.doc_id,
                "page": page.page_num,
                "score": round(float(score), 4),
                "text": page.text,
            }
        )
    return results


# --- LangChain / DeepAgents tools (plain callables) ---


def index_pdf(doc_id: str, pdf_path: str) -> str:
    """
    Index a local PDF file into the request page store (text PDFs only, no OCR).

    Args:
        doc_id: Logical document id used in later searches (e.g. 'pdf_a', 'upload_0').
        pdf_path: Absolute path to the PDF inside the agent workspace.
    """
    store = get_store()
    with open(pdf_path, "rb") as fh:
        data = fh.read()
    n = index_pdf_bytes(store, doc_id, data)
    return json.dumps({"doc_id": doc_id, "pages_indexed": n, "backend": page_search_backend()})


def search_pages(query: str, top_k: int = 5, doc_id: str = "") -> str:
    """
    Search indexed PDF pages with BM25 and/or sentence-transformer embeddings.

    Each hit is one full extracted page (no mid-page truncation). Use this to
    find relevant pages before extracting parameters or drafting sections.
    PDFs must already be indexed for this request.

    Args:
        query: Natural-language or keyword query (e.g. 'supply voltage', 'CAN bus').
        top_k: Max hits to return (1-20).
        doc_id: Optional document filter (empty string = search all indexed docs).
    """
    store = get_store()
    doc_filter = doc_id.strip() or None
    hits = search_page_corpus(store, query=query, top_k=top_k, doc_id=doc_filter)
    return json.dumps(
        {
            "query": query,
            "backend": page_search_backend(),
            "hits": hits,
        },
        ensure_ascii=False,
    )


def get_page_text(doc_id: str, page_num: int) -> str:
    """
    Return full text for one indexed PDF page.

    Args:
        doc_id: Document id used when indexing.
        page_num: 1-based page number.
    """
    store = get_store()
    for page in store.pages_for(doc_id):
        if page.page_num == int(page_num):
            return json.dumps(
                {"doc_id": doc_id, "page": page.page_num, "text": page.text},
                ensure_ascii=False,
            )
    return json.dumps({"error": f"Page {page_num} not found for doc_id={doc_id}"})


def list_indexed_docs() -> str:
    """List indexed document ids and page counts in the current request store."""
    store = get_store()
    counts: dict[str, int] = {}
    for page in store.pages:
        counts[page.doc_id] = counts.get(page.doc_id, 0) + 1
    return json.dumps({"documents": counts, "backend": page_search_backend()})


PAGE_TOOLS = [search_pages, get_page_text, list_indexed_docs]
