FROM python:3.10-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ./app /app/app

# Expose port
EXPOSE 8004

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
