import { hashPassword } from './src/auth/password.js';
import { signAccess, signRefresh } from './src/auth/jwt.js';
import { query } from './src/db-sqlite.js';

console.log('Testing auth flow...\n');

// Test 1: Hash password
console.log('1. Hashing password...');
const hash = await hashPassword('test123');
console.log('✓ Password hashed');

// Test 2: Insert user
console.log('\n2. Inserting user...');
try {
  await query('insert into users(email, password_hash, name) values($1,$2,$3)', 
    ['test@example.com', hash, 'Test User']);
  console.log('✓ User inserted');
} catch (e) {
  console.log('Error:', e.message);
}

// Test 3: Fetch user
console.log('\n3. Fetching user...');
const r = await query('select id,email,name,role from users where email=$1', ['test@example.com']);
const user = r.rows[0];
console.log('✓ User fetched:', user);

// Test 4: Generate tokens
console.log('\n4. Generating tokens...');
const access = signAccess({ sub: user.id, role: user.role });
const refresh = signRefresh({ sub: user.id });
console.log('✓ Access token:', access.substring(0, 50) + '...');
console.log('✓ Refresh token:', refresh.substring(0, 50) + '...');

console.log('\n✅ Auth flow works!');
process.exit(0);
