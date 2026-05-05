FROM python:3.12-slim

# Installare font Unicode (DejaVu) e gli strumenti di base
RUN apt-get update && \
    apt-get install -y fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py llm_schema.py pdf_compat.py ./

EXPOSE 8000

# Render (e altri PaaS) impostano PORT a runtime; in locale Docker-compose resta 8000.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]