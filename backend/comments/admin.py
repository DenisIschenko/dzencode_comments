from django.contrib import admin

from comments.models import Comment, Attachment


class CommentAdmin(admin.ModelAdmin):
    list_display = ('pk', 'user_name', 'email', 'short_txt', 'created_at')

    def short_txt(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text

    short_txt.short_description = 'Short Content'


class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('pk', 'comment', 'content_type', 'created_at')


admin.site.register(Comment, CommentAdmin)
admin.site.register(Attachment, AttachmentAdmin)
