from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CommentViewSet, CaptchaView, AttachmentCreateView, AttachmentDeleteView, GetUserView

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = router.urls

urlpatterns += [
    path('attachments/', include([
        path("", AttachmentCreateView.as_view(), name='attachment-add'),
        path('<pk>/', AttachmentDeleteView.as_view(), name='attachment-delete'),
    ])),
    path('captcha/', CaptchaView.as_view(), name='captcha-api'),
    path('me/', GetUserView.as_view(), name='get-user'),
]
