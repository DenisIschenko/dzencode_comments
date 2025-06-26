import asyncio

event_queue = asyncio.Queue()


# Function to put an event to Queue for processing later
async def enqueue_event(func, *args, **kwargs):
    await event_queue.put((func, args, kwargs))


# Worker to process events from the Queue
async def event_worker():
    while True:
        func, args, kwargs = await event_queue.get()
        try:
            await asyncio.sleep(5)  # Simulate some processing delay
            await func(*args, **kwargs)
        except Exception as e:
            print(f"Event handler error: {e}")
        event_queue.task_done()
