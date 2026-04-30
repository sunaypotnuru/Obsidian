# syntax=docker/dockerfile:1
FROM python:3.10-slim

WORKDIR /app

# Install explicit system binaries for Whisper
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install dependencies from project root
COPY ./backend/requirements-core.txt .
RUN pip install --no-cache-dir -r requirements-core.txt

# Copy application code
COPY ./backend/core/ .

ENV PYTHONPATH=/app

EXPOSE 8000

# Health check so Docker Desktop shows container health status
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
