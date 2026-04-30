FROM python:3.10

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy service requirements
COPY ./backend/parkinsons-voice/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Verify parselmouth installation
RUN python -c "import parselmouth; print('Parselmouth version:', parselmouth.__version__)"

# Copy application
COPY ./backend/parkinsons-voice/ .

# Set Python path
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8004

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
