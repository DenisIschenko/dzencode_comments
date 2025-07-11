from captcha.models import CaptchaStore
from django.core.cache import cache
from rest_framework import serializers

from .models import Comment, Attachment
from .utils import clean_html


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['comment', 'file', 'content_type', 'created_at']
        read_only_fields = ['content_type', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    replies = serializers.SerializerMethodField(read_only=True)
    captcha_key = serializers.CharField(write_only=True)
    captcha_value = serializers.CharField(write_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'user_name', 'email', 'home_page',
            'text', 'created_at', 'parent',
            'attachments', 'replies',
            'captcha_key', 'captcha_value'
        ]
        read_only_fields = ('id', 'created_at')

    def get_replies(self, obj):
        cache_key = f'replies:{obj.id}'
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return cached_data

        comments = CommentSerializer(obj.replies.prefetch_related('attachments', 'replies').all(), many=True).data
        cache.set(cache_key, comments, timeout=60)

        return comments

    def validate_text(self, value):
        return clean_html(value)

    def validate(self, data):
        key = data.get("captcha_key")
        value = data.get("captcha_value")
        try:
            captcha = CaptchaStore.objects.get(hashkey=key)
            if captcha.response.lower() != value.strip().lower():
                raise serializers.ValidationError("Incorrect CAPTCHA.")
        except CaptchaStore.DoesNotExist:
            raise serializers.ValidationError("Invalid CAPTCHA key.")
        return data

    def create(self, validated_data):
        validated_data.pop("captcha_key")
        validated_data.pop("captcha_value")
        return super().create(validated_data)
