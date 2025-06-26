#!/bin/sh

python manage.py migrate

python manage.py collectstatic --noinput

uvicorn core.asgi:application --host 0.0.0.0 --port 8000 --workers 4 --timeout-keep-alive 120