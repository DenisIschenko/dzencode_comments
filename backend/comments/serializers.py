from rest_framework import serializers

from .models import Comment, Attachment
from .utils import clean_html


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['file', 'content_type']


class CommentSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    replies = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'user_name', 'email', 'home_page',
            'text', 'created_at', 'parent',
            'attachments', 'replies'
        ]
        read_only_fields = ('id', 'created_at')

    def get_replies(self, obj):
        return CommentSerializer(obj.replies.all(), many=True).data

    def validate_text(self, value):
        return clean_html(value)
