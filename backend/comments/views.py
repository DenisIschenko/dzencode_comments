from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from .models import Comment
from .serializers import CommentSerializer


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.filter(parent__isnull=True).order_by('-created_at')
    serializer_class = CommentSerializer
    filter_backends = [OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['user_name', 'email', 'created_at']
