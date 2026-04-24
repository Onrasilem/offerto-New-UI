// Example function to schedule follow-ups
import { enqueueFollowup } from './queue.js';

export function scheduleFollowups(document) {
  const { id, customer_id, status } = document;
  if (status !== 'Sent') return;
  const now = Date.now();
  const days = [5, 10, 15];
  days.forEach((d) => {
    const runAt = new Date(now + d * 24 * 60 * 60 * 1000);
    enqueueFollowup(id, customer_id, runAt);
  });
}
