"""
ASGI config for comments project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django

django.setup()

from django.urls import path
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from comments.consumers import CommentConsumer

import asyncio
from core.event_queue import event_worker

main_loop = asyncio.get_event_loop()
main_loop.create_task(event_worker())

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path('ws/comments/', CommentConsumer.as_asgi()),
        ]
        )
    ),
})
