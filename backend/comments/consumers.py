import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class CommentConsumer(WebsocketConsumer):
    def connect(self):
        async_to_sync(self.channel_layer.group_add)(
            'comments',
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            'comments',
            self.channel_name
        )

    def comment_created(self, event):
        self.send(text_data=json.dumps({
            'type': 'comment.created',
            'id': event['id'],
        }))
