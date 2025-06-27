# Use a minimal Python image as base
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy only requirements first to leverage Docker layer caching
COPY backend/requirements.txt ./backend/requirements.txt

# Install system dependencies (if needed for compiled packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && pip install --upgrade pip \
    && pip install -r backend/requirements.txt \
    && apt-get purge -y build-essential \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy full app code
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Set entry point
CMD ["python", "backend/alyssium_oracle.py"]
