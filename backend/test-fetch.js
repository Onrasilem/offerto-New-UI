const res = await fetch('http://localhost:4002/health');
console.log('Status:', res.status);
console.log('Body:', await res.json());
