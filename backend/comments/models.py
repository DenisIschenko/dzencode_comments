from django.db import models
from django.utils import timezone


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
