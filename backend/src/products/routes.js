// backend/src/products/routes.js
import express from 'express';
import { authRequired } from '../middleware/authRequired.js';
import * as productService from './service.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

/**
 * GET /products - List all products
 */
router.get('/', (req, res, next) => {
  try {
    const { search, category_id, active, limit, offset } = req.query;
    
    const products = productService.getProducts(req.user.id, {
      search,
      category_id,
      active: active !== undefined ? active === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/stats - Get product statistics
 */
router.get('/stats', (req, res, next) => {
  try {
    const stats = productService.getProductStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/:id - Get single product
 */
router.get('/:id', (req, res, next) => {
  try {
    const product = productService.getProduct(req.params.id, req.user.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /products - Create new product
 */
router.post('/', (req, res, next) => {
  try {
    const { name, description, sku, price, cost_price, tax_rate, unit, 
            stock_quantity, track_stock, category_id, active } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    if (price === undefined || price < 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    
    const product = productService.createProduct(req.user.id, {
      name,
      description,
      sku,
      price,
      cost_price,
      tax_rate,
      unit,
      stock_quantity,
      track_stock,
      category_id,
      active,
    });
    
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /products/:id - Update product
 */
router.put('/:id', (req, res, next) => {
  try {
    const product = productService.getProduct(req.params.id, req.user.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updated = productService.updateProduct(req.params.id, req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /products/:id - Delete product
 */
router.delete('/:id', (req, res, next) => {
  try {
    const success = productService.deleteProduct(req.params.id, req.user.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /products/:id/stock - Update stock quantity
 */
router.post('/:id/stock', (req, res, next) => {
  try {
    const { quantity, operation } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required' });
    }
    
    const updated = productService.updateStock(
      req.params.id, 
      req.user.id, 
      quantity, 
      operation || 'set'
    );
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /products/categories - List all categories
 */
router.get('/categories/list', (req, res, next) => {
  try {
    const categories = productService.getCategories(req.user.id);
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /products/categories - Create category
 */
router.post('/categories', (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const category = productService.createCategory(req.user.id, {
      name,
      description,
      color,
    });
    
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /products/categories/:id - Update category
 */
router.put('/categories/:id', (req, res, next) => {
  try {
    const category = productService.getCategory(req.params.id, req.user.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const updated = productService.updateCategory(req.params.id, req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /products/categories/:id - Delete category
 */
router.delete('/categories/:id', (req, res, next) => {
  try {
    const success = productService.deleteCategory(req.params.id, req.user.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
