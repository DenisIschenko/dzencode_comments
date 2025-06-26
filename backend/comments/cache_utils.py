from asgiref.sync import sync_to_async
from django.core.cache import cache


def check_parent(c, cache_keys):
    if c.parent is not None:
        cache_keys.append(f'replies:{c.parent.id}')
        check_parent(c.parent, cache_keys)


async def invalidate_comment_cache(comment):
    # cache_key = (f'comments:'
    #              f'ordering:{request.query_params.get("ordering")}:'
    #              f'limit:{request.query_params.get("limit")}:'
    #              f'offset:{request.query_params.get("offset")}')

    cache_keys = []
    # collecting cache keys for the comment and its parent replies
    # do this because now used LocMemCache, and it is not have tool to get keys that present
    # this logic can be improved using Redis or other cache backend that supports key patterns
    for field in ['user_name', 'email', 'created_at', '-user_name', '-email', '-created_at']:
        for offset in range(0, 100, 25):
            cache_keys.append(f'comments:ordering:{field}:limit:25:offset:{offset}')

    from comments.models import Comment
    comm = sync_to_async(Comment.objects.prefetch_related('attachments', 'replies').get)(id=comment.id)

    await sync_to_async(check_parent)(await comm, cache_keys)

    print(f"Invalidating cache for comment {comment.id} and its parent replies: {cache_keys}")

    cache.delete_many(cache_keys)
