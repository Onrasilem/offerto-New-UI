// backend/src/products/service.js
import { pool } from '../db.js';
import { randomUUID } from 'crypto';

/**
 * Get all products for a user
 */
export function getProducts(userId, options = {}) {
  const { search, category_id, active, limit, offset } = options;
  
  let query = `
    SELECT 
      p.*,
      pc.name as category_name,
      pc.color as category_color
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.user_id = ?
  `;
  
  const params = [userId];
  
  if (search) {
    query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  if (category_id) {
    query += ` AND p.category_id = ?`;
    params.push(category_id);
  }
  
  if (active !== undefined) {
    query += ` AND p.active = ?`;
    params.push(active ? 1 : 0);
  }
  
  query += ` ORDER BY p.name ASC`;
  
  if (limit) {
    query += ` LIMIT ?`;
    params.push(limit);
  }
  
  if (offset) {
    query += ` OFFSET ?`;
    params.push(offset);
  }
  
  return pool.prepare(query).all(...params);
}

/**
 * Get single product by ID
 */
export function getProduct(productId, userId) {
  return pool.prepare(`
    SELECT 
      p.*,
      pc.name as category_name,
      pc.color as category_color
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.id = ? AND p.user_id = ?
  `).get(productId, userId);
}

/**
 * Create new product
 */
export function createProduct(userId, data) {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  pool.prepare(`
    INSERT INTO products (
      id, user_id, category_id, name, description, sku,
      price, cost_price, tax_rate, unit, stock_quantity, track_stock, active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    data.category_id || null,
    data.name,
    data.description || null,
    data.sku || null,
    data.price || 0,
    data.cost_price || 0,
    data.tax_rate !== undefined ? data.tax_rate : 21.0,
    data.unit || 'stuk',
    data.stock_quantity || 0,
    data.track_stock ? 1 : 0,
    data.active !== undefined ? (data.active ? 1 : 0) : 1,
    now,
    now
  );
  
  return getProduct(id, userId);
}

/**
 * Update product
 */
export function updateProduct(productId, userId, data) {
  const now = new Date().toISOString();
  
  const updates = [];
  const params = [];
  
  if (data.category_id !== undefined) {
    updates.push('category_id = ?');
    params.push(data.category_id);
  }
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.sku !== undefined) {
    updates.push('sku = ?');
    params.push(data.sku);
  }
  if (data.price !== undefined) {
    updates.push('price = ?');
    params.push(data.price);
  }
  if (data.cost_price !== undefined) {
    updates.push('cost_price = ?');
    params.push(data.cost_price);
  }
  if (data.tax_rate !== undefined) {
    updates.push('tax_rate = ?');
    params.push(data.tax_rate);
  }
  if (data.unit !== undefined) {
    updates.push('unit = ?');
    params.push(data.unit);
  }
  if (data.stock_quantity !== undefined) {
    updates.push('stock_quantity = ?');
    params.push(data.stock_quantity);
  }
  if (data.track_stock !== undefined) {
    updates.push('track_stock = ?');
    params.push(data.track_stock ? 1 : 0);
  }
  if (data.active !== undefined) {
    updates.push('active = ?');
    params.push(data.active ? 1 : 0);
  }
  
  updates.push('updated_at = ?');
  params.push(now);
  
  params.push(productId, userId);
  
  pool.prepare(`
    UPDATE products 
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `).run(...params);
  
  return getProduct(productId, userId);
}

/**
 * Delete product
 */
export function deleteProduct(productId, userId) {
  const result = pool.prepare(`
    DELETE FROM products WHERE id = ? AND user_id = ?
  `).run(productId, userId);
  
  return result.changes > 0;
}

/**
 * Update stock quantity
 */
export function updateStock(productId, userId, quantity, operation = 'set') {
  const product = getProduct(productId, userId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  let newQuantity;
  if (operation === 'add') {
    newQuantity = product.stock_quantity + quantity;
  } else if (operation === 'subtract') {
    newQuantity = product.stock_quantity - quantity;
  } else {
    newQuantity = quantity;
  }
  
  return updateProduct(productId, userId, { stock_quantity: newQuantity });
}

/**
 * Get all categories for a user
 */
export function getCategories(userId) {
  return pool.prepare(`
    SELECT 
      pc.*,
      COUNT(p.id) as product_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category_id = pc.id AND p.user_id = pc.user_id
    WHERE pc.user_id = ?
    GROUP BY pc.id
    ORDER BY pc.name ASC
  `).all(userId);
}

/**
 * Get single category
 */
export function getCategory(categoryId, userId) {
  return pool.prepare(`
    SELECT * FROM product_categories WHERE id = ? AND user_id = ?
  `).get(categoryId, userId);
}

/**
 * Create category
 */
export function createCategory(userId, data) {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  pool.prepare(`
    INSERT INTO product_categories (id, user_id, name, description, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    data.name,
    data.description || null,
    data.color || '#3b82f6',
    now,
    now
  );
  
  return getCategory(id, userId);
}

/**
 * Update category
 */
export function updateCategory(categoryId, userId, data) {
  const now = new Date().toISOString();
  
  const updates = [];
  const params = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    params.push(data.color);
  }
  
  updates.push('updated_at = ?');
  params.push(now);
  
  params.push(categoryId, userId);
  
  pool.prepare(`
    UPDATE product_categories 
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `).run(...params);
  
  return getCategory(categoryId, userId);
}

/**
 * Delete category
 */
export function deleteCategory(categoryId, userId) {
  // First, set all products in this category to NULL
  pool.prepare(`
    UPDATE products SET category_id = NULL WHERE category_id = ? AND user_id = ?
  `).run(categoryId, userId);
  
  // Then delete the category
  const result = pool.prepare(`
    DELETE FROM product_categories WHERE id = ? AND user_id = ?
  `).run(categoryId, userId);
  
  return result.changes > 0;
}

/**
 * Get product statistics
 */
export function getProductStats(userId) {
  const stats = pool.prepare(`
    SELECT 
      COUNT(*) as total_products,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_products,
      SUM(CASE WHEN track_stock = 1 AND stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN track_stock = 1 AND stock_quantity > 0 AND stock_quantity <= 5 THEN 1 ELSE 0 END) as low_stock,
      SUM(price * stock_quantity) as total_inventory_value
    FROM products
    WHERE user_id = ?
  `).get(userId);
  
  return {
    total_products: stats.total_products || 0,
    active_products: stats.active_products || 0,
    out_of_stock: stats.out_of_stock || 0,
    low_stock: stats.low_stock || 0,
    total_inventory_value: stats.total_inventory_value || 0,
  };
}
