# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt && pip install gunicorn

# Copy code
COPY . .

# Spaces will set PORT (usually 7860)
ENV PORT=7860
EXPOSE 7860

# Run with gunicorn on the injected PORT
CMD ["bash", "-lc", "gunicorn -b 0.0.0.0:${PORT} db_app:app --workers 2 --threads 4 --timeout 120"]