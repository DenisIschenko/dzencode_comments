import bleach

ALLOWED_TAGS = ['a', 'code', 'i', 'strong']
ALLOWED_ATTRIBUTES = {'a': ['href', 'title']}

def clean_html(text: str) -> str:
    return bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)