#!/bin/sh

python manage.py migrate

python manage.py collectstatic --noinput

python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="${DJANGO_SUPERUSER_USERNAME}").exists():
    User.objects.create_superuser(
        username="${DJANGO_SUPERUSER_USERNAME}",
        email="${DJANGO_SUPERUSER_EMAIL}",
        password="${DJANGO_SUPERUSER_PASSWORD}"
    )
END

uvicorn core.asgi:application --host 0.0.0.0 --port 8000 --workers 4 --timeout-keep-alive 120