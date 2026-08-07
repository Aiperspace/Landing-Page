FROM python:3.12-slim

# System deps: Unicode fonts for PDF export + build tools for native wheels
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        fonts-dejavu-core \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Optional: warm sentence-transformer cache at build time (used when PAGE_SEARCH_BACKEND=embeddings|hybrid)
ARG PRELOAD_EMBEDDINGS=0
ENV PAGE_SEARCH_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RUN if [ "$PRELOAD_EMBEDDINGS" = "1" ]; then \
      python -c "from sentence_transformers import SentenceTransformer; import os; SentenceTransformer(os.environ['PAGE_SEARCH_EMBEDDING_MODEL'])"; \
    fi

COPY main.py llm_schema.py pdf_compat.py auth.py db.py ./
COPY agents ./agents
COPY doc_versioning ./doc_versioning

EXPOSE 8000

# Render (and other PaaS) set PORT at runtime; local docker-compose stays on 8000.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
