FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (updated for newer Debian)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy cataract-specific requirements
COPY ./backend/cataract/requirements.txt .
RUN pip install --no-cache-dir --no-deps numpy && pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ./backend/cataract/ .

# Expose port
EXPOSE 8005

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
