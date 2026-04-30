FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY ./backend/diabetic-retinopathy/requirements.txt .

# Install numpy first to avoid conflicts
RUN pip install --no-cache-dir "numpy>=1.24.0,<2.0"

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./backend/diabetic-retinopathy/app ./app

# Copy model files
COPY ./backend/diabetic-retinopathy/models ./models

# Expose port
EXPOSE 8002

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
