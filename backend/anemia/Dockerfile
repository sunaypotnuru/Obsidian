FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TF_CPP_MIN_LOG_LEVEL=2

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from project root and install dependencies
COPY ./backend/requirements-ml.txt .
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements-ml.txt

# Copy the rest of the application code
COPY ./backend/anemia/ .

# Expose the port the app runs on
EXPOSE 8001

# Command to run the application
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8001"]
