# Automations
- enqueueFollowup(docId, customerId, runAt): place job in queue
- processFollowup(job): check status; if open, send reminder; log event; reschedule or stop
- Use Redis-based queue (BullMQ/bee-queue) in real setup
