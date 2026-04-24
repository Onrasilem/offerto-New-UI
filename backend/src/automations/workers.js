// Placeholder for workers to process follow-ups
export async function processFollowup(job) {
  // job data: { docId, customerId }
  console.log('process follow-up job', job.data);
  // TODO: check status, send email, log event
}
