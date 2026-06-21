FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (adjust as needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first to leverage Docker layer cache
COPY Backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY Backend ./Backend

# Ensure Python can import the Backend package
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

