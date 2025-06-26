from captcha.helpers import captcha_image_url
from captcha.models import CaptchaStore
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.filters import OrderingFilter
from rest_framework.generics import DestroyAPIView, CreateAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Comment, Attachment
from .serializers import CommentSerializer, AttachmentSerializer


class CaptchaView(APIView):
    def get(self, request, *args, **kwargs):
        new_captcha = CaptchaStore.generate_key()
        image_url = captcha_image_url(new_captcha)
        return Response({
            "captcha_key": new_captcha,
            "image_url": image_url
        })


class CommentViewSet(ModelViewSet):
    queryset = (Comment.objects
                .prefetch_related('attachments', 'replies')
                .filter(parent__isnull=True)
                .order_by('-created_at'))
    all_queryset = Comment.objects.prefetch_related('attachments', 'replies').select_related('parent').all()
    serializer_class = CommentSerializer
    filter_backends = [OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['user_name', 'email', 'created_at']

    def list(self, request, *args, **kwargs):
        # cache_key = f'comments:{request.query_params.urlencode()}'
        # Using a more structured cache key to avoid issues with long query strings
        # This allows for better cache management and avoids potential issues with long URLs.
        cache_key = (f'comments:'
                     f'ordering:{request.query_params.get("ordering")}:'
                     f'limit:{request.query_params.get("limit")}:'
                     f'offset:{request.query_params.get("offset")}')
        cached_data = cache.get(cache_key)

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            if cached_data is not None:
                return self.get_paginated_response(cached_data)

            serializer = self.get_serializer(page, many=True)
            cache.set(cache_key, serializer.data, timeout=60)

            return self.get_paginated_response(serializer.data)

        if cached_data is not None:
            return Response(self.get_paginated_response(cached_data))

        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, timeout=60)

        return Response(serializer.data)

    def get_object(self):
        """
        Returns the object the view is displaying.

        You may want to override this if you need to provide non-standard
        queryset lookups.  Eg if objects are referenced using multiple
        keyword arguments in the url conf.
        """
        queryset = self.filter_queryset(self.all_queryset)

        # Perform the lookup filtering.
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, (
                'Expected view %s to be called with a URL keyword argument '
                'named "%s". Fix your URL conf, or set the `.lookup_field` '
                'attribute on the view correctly.' %
                (self.__class__.__name__, lookup_url_kwarg)
        )

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj


class AttachmentCreateView(CreateAPIView):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
        except Exception as e:
            return Response(e, status=status.HTTP_400_BAD_REQUEST)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


class AttachmentDeleteView(DestroyAPIView):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
