# 1. React build stage
FROM node:20-alpine as build-frontend

COPY frontend/ ./frontend/

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# 2. Django stage
FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# installing system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# installing Django and other Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copying the backend code
COPY backend/ ./backend/

# Copying the frontend build from the previous stage
COPY --from=build-frontend /app/frontend/ ./backend/frontend/

# Setting up the environment
WORKDIR /app/backend

# Copying the entrypoint script and run migrations collect static and start uvicorn server
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]