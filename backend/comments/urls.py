from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, CaptchaView

router = DefaultRouter()
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = router.urls

urlpatterns += [
    path('captcha/', CaptchaView.as_view(), name='captcha-api'),
]