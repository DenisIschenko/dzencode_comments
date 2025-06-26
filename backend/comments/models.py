import sys
from io import BytesIO

import magic  # python-magic
from PIL import Image
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from core.event_queue import enqueue_event
from .cache_utils import invalidate_comment_cache

MAX_IMAGE_SIZE = (320, 240)
MAX_TEXT_SIZE = 100 * 1024  # 100KB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
ALLOWED_TEXT_TYPES = ['text/plain']


class Comment(models.Model):
    user_name = models.CharField(max_length=150)
    email = models.EmailField()
    home_page = models.URLField(blank=True, null=True)
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )

    def __str__(self):
        return f"{self.user_name} ({self.email}) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


def upload_to(instance, filename):
    return f"attachments/{instance.comment.id}/{filename}"


class Attachment(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=upload_to)
    content_type = models.CharField(max_length=50)  # image/png, text/plain, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.full_clean(exclude=('content_type',))
        return super(Attachment, self).save(*args, **kwargs)

    def clean(self):
        if self.file:
            self.validate_file()

    def validate_file(self):
        mime_type = magic.from_buffer(self.file.read(2048), mime=True)
        self.file.seek(0)
        self.content_type = mime_type

        # Check image
        if mime_type in ALLOWED_IMAGE_TYPES:
            self.validate_image()
        elif mime_type in ALLOWED_TEXT_TYPES:
            self.validate_text_file()
        else:
            raise ValidationError('Invalid file type')

    def validate_image(self):
        try:
            with Image.open(self.file.file) as img:
                width, height = img.size

                if width > MAX_IMAGE_SIZE[0] or height > MAX_IMAGE_SIZE[1]:
                    self.resize_image()
        except Exception as e:
            raise ValidationError(f'Invalid image file: {str(e)}')

    def validate_text_file(self):
        if self.file.size > MAX_TEXT_SIZE:
            raise ValidationError('Text file size must be less than 100KB')

    def resize_image(self):
        output = BytesIO()
        try:
            with Image.open(self.file.file) as img:
                img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                img.save(output, format=self.content_type.split('/')[-1], quality=85, optimize=True)
                output.seek(0)
                self.file = InMemoryUploadedFile(output, 'FileField',
                                                 self.file.name, self.content_type,
                                                 sys.getsizeof(output), None)
        except Exception as e:
            raise ValidationError(f'Error resizing image: {str(e)}')

    def get_file_url(self):
        return self.file.url if self.file else None

    def get_file_size_display(self):
        if self.file.size < 1024:
            return f"{self.file.size} B"
        elif self.file.size < 1024 * 1024:
            return f"{self.file.size / 1024:.1f} KB"
        else:
            return f"{self.file.size / (1024 * 1024):.1f} MB"


@receiver(post_save, sender=Comment)
def comment_created(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)('comments', {
            'type': 'comment.created',
            'id': instance.id,
        })
        async_to_sync(enqueue_event)(invalidate_comment_cache, instance)
