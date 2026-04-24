// migrate-products.js - Add product catalog support
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('./offerto.db');

console.log('🚀 Starting product catalog migration...\n');

// Step 1: Create product_categories table
console.log('📁 Step 1: Creating product_categories table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ product_categories table created\n');

// Step 2: Create products table
console.log('📦 Step 2: Creating products table...');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    price REAL NOT NULL DEFAULT 0,
    cost_price REAL DEFAULT 0,
    tax_rate REAL DEFAULT 21.0,
    unit TEXT DEFAULT 'stuk',
    stock_quantity INTEGER DEFAULT 0,
    track_stock INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
  )
`);
console.log('✅ products table created\n');

// Step 3: Create indices for performance
console.log('🔍 Step 3: Creating indices...');
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
  CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
  CREATE INDEX IF NOT EXISTS idx_product_categories_user_id ON product_categories(user_id);
`);
console.log('✅ Indices created\n');

// Step 4: Add some default categories for existing users
console.log('📂 Step 4: Adding default categories for existing users...');
const users = db.prepare('SELECT id FROM users').all();
let categoriesAdded = 0;

const defaultCategories = [
  { name: 'Diensten', description: 'Dienstverlening en uren', color: '#3b82f6' },
  { name: 'Materialen', description: 'Materialen en grondstoffen', color: '#10b981' },
  { name: 'Producten', description: 'Verkoop producten', color: '#f59e0b' },
];

const insertCategory = db.prepare(`
  INSERT INTO product_categories (id, user_id, name, description, color)
  VALUES (?, ?, ?, ?, ?)
`);

for (const user of users) {
  for (const cat of defaultCategories) {
    insertCategory.run(randomUUID(), user.id, cat.name, cat.description, cat.color);
    categoriesAdded++;
  }
}
console.log(`✅ Added ${categoriesAdded} default categories for ${users.length} user(s)\n`);

// Step 5: Add some example products for existing users
console.log('🛠️ Step 5: Adding example products...');
const insertProduct = db.prepare(`
  INSERT INTO products (id, user_id, category_id, name, description, price, cost_price, unit, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

let productsAdded = 0;

for (const user of users) {
  // Get user's categories
  const userCategories = db.prepare(
    'SELECT id, name FROM product_categories WHERE user_id = ?'
  ).all(user.id);

  const diensten = userCategories.find(c => c.name === 'Diensten');
  const materialen = userCategories.find(c => c.name === 'Materialen');

  if (diensten) {
    insertProduct.run(
      randomUUID(), user.id, diensten.id,
      'Consult (per uur)', 
      'Advies en consultancy',
      75.00, 0, 'uur'
    );
    insertProduct.run(
      randomUUID(), user.id, diensten.id,
      'Installatie',
      'Installatie werkzaamheden',
      125.00, 0, 'uur'
    );
    productsAdded += 2;
  }

  if (materialen) {
    insertProduct.run(
      randomUUID(), user.id, materialen.id,
      'Standaard materiaal',
      'Algemene materialen',
      25.00, 15.00, 'stuk'
    );
    productsAdded += 1;
  }
}
console.log(`✅ Added ${productsAdded} example products\n`);

// Step 6: Verify migration
console.log('🔍 Step 6: Verifying migration...');
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM product_categories').get();
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();

console.log(`   Categories: ${categoryCount.count}`);
console.log(`   Products: ${productCount.count}`);

db.close();

console.log('\n✨ Product catalog migration completed successfully!');
console.log('\n📝 Summary:');
console.log(`   - Created 2 tables (product_categories, products)`);
console.log(`   - Added 5 indices for performance`);
console.log(`   - Created ${categoriesAdded} default categories`);
console.log(`   - Added ${productsAdded} example products`);
