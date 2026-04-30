FROM python:3.10-slim

WORKDIR /app

# Install system-level audio dependencies (crucial for ffmpeg webm conversion)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip "setuptools<70" wheel
RUN pip install --no-cache-dir --no-build-isolation -r requirements.txt

# Copy application layers
COPY ./app /app/app

# Start highly-concurrent ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
