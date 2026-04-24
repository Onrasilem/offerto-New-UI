// Document service stubs
export function markSent(docId) {
  console.log('mark document sent', docId);
}

export function setStatus(docId, status) {
  console.log('set status', { docId, status });
}
