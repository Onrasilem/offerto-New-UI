/**
 * Offerto Backend API Client
 * 
 * Handles all communication with the Node.js backend API.
 * Includes authentication, token refresh, and automatic retry logic.
 */

// Backend API URL
// For Android Emulator: use 10.0.2.2 (emulator's special alias for host machine)
// For iOS Simulator: use localhost
// For Physical Device: use your local IP (e.g., 192.168.0.221)
const API_URL = 'http://192.168.0.221:4000';

// Token storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'offerto.api.access_token',
  REFRESH_TOKEN: 'offerto.api.refresh_token',
  USER: 'offerto.api.user',
};

/**
 * API Client with automatic token refresh and retry logic
 */
class OffertoAPI {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
  }

  /**
   * Initialize - load tokens from AsyncStorage
   */
  async init() {
    if (typeof window === 'undefined') return; // Skip in Node.js
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    try {
      const [access, refresh, user] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);
      
      this.accessToken = access;
      this.refreshToken = refresh;
      this.user = user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('API init error:', e);
    }
  }

  /**
   * Save tokens to AsyncStorage
   */
  async saveTokens(access, refresh, user) {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.user = user;
    
    if (typeof window === 'undefined') return;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access || ''),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh || ''),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user || null)),
      ]);
    } catch (e) {
      console.error('Save tokens error:', e);
    }
  }

  /**
   * Clear tokens (logout)
   */
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    
    if (typeof window === 'undefined') return;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
    } catch (e) {
      console.error('Clear tokens error:', e);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: this.refreshToken }),
    });

    if (!response.ok) {
      await this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    await this.saveTokens(data.access, data.refresh || this.refreshToken, this.user);
    return data.access;
  }

  /**
   * Make authenticated API request with auto-retry on 401
   */
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken && !options.skipAuth) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 and we have refresh token, try to refresh and retry
    if (response.status === 401 && this.refreshToken && !options.skipAuth) {
      try {
        await this.refreshAccessToken();
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (e) {
        console.error('Token refresh failed:', e);
        throw e;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // === Auth Methods ===

  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      skipAuth: true,
    });

    await this.saveTokens(data.access, data.refresh, data.user);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    await this.saveTokens(data.access, data.refresh, data.user);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      await this.clearTokens();
    }
  }

  // === Customer Methods ===

  async createCustomer(customer) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async getCustomers() {
    const data = await this.request('/customers');
    return data.customers;
  }

  async getCustomer(id) {
    const data = await this.request(`/customers/${id}`);
    return data.customer;
  }

  async updateCustomer(id, customer) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  // === Document Methods ===

  async createDocument(document) {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async getDocuments() {
    const data = await this.request('/documents');
    return data.documents;
  }

  async getDocument(id) {
    const data = await this.request(`/documents/${id}`);
    return data.document;
  }

  async updateDocument(id, data) {
    return this.request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async sendDocument(id) {
    return this.request(`/documents/${id}/send`, {
      method: 'POST',
    });
  }

  async convertDocument(id) {
    const data = await this.request(`/documents/${id}/convert`, {
      method: 'POST',
    });
    return data.invoice;
  }

  // =====================
  // PEPPOL METHODS
  // =====================

  async exportUBL(documentId) {
    // Returns raw XML
    const response = await fetch(`${API_URL}/peppol/document/${documentId}/ubl`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export UBL');
    }
    
    return await response.text();
  }

  async sendViaPeppol(documentId, recipientId, recipientScheme) {
    return await this.request(`/peppol/document/${documentId}/send`, {
      method: 'POST',
      body: JSON.stringify({ recipientId, recipientScheme }),
    });
  }

  async getPeppolStatus(documentId) {
    return await this.request(`/peppol/document/${documentId}/status`);
  }

  async retryPeppolSend(documentId) {
    return await this.request(`/peppol/document/${documentId}/retry`, {
      method: 'POST',
    });
  }

  // ===== CREDIT MANAGEMENT / PAYMENTS =====

  /**
   * Registreer een betaling
   */
  async registerPayment(data) {
    return await this.request('/payments/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Zoek mogelijke document matches voor een betaling
   */
  async findPaymentMatches(data) {
    return await this.request('/payments/find-matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Haal payment overview op
   */
  async getPaymentOverview() {
    return await this.request('/payments/overview');
  }

  /**
   * Haal alle betalingen voor een document
   */
  async getDocumentPayments(documentId) {
    return await this.request(`/payments/document/${documentId}`);
  }

  /**
   * Verzend betalingsherinnering
   */
  async sendPaymentReminder(documentId) {
    return await this.request(`/payments/reminder/${documentId}`, {
      method: 'POST',
    });
  }

  // ========== PRODUCTS ==========

  /**
   * Haal alle producten op
   */
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/products${query ? '?' + query : ''}`);
  }

  /**
   * Haal product statistieken
   */
  async getProductStats() {
    return await this.request('/products/stats');
  }

  /**
   * Haal een enkel product
   */
  async getProduct(productId) {
    return await this.request(`/products/${productId}`);
  }

  /**
   * Maak nieuw product
   */
  async createProduct(data) {
    return await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update product
   */
  async updateProduct(productId, data) {
    return await this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verwijder product
   */
  async deleteProduct(productId) {
    return await this.request(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update voorraad
   */
  async updateStock(productId, quantity, operation = 'set') {
    return await this.request(`/products/${productId}/stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity, operation }),
    });
  }

  /**
   * Haal alle categorieën
   */
  async getProductCategories() {
    return await this.request('/products/categories/list');
  }

  /**
   * Maak nieuwe categorie
   */
  async createProductCategory(data) {
    return await this.request('/products/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update categorie
   */
  async updateProductCategory(categoryId, data) {
    return await this.request(`/products/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verwijder categorie
   */
  async deleteProductCategory(categoryId) {
    return await this.request(`/products/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // ========== MOLLIE PAYMENTS ==========

  /**
   * Create Mollie payment link for document
   */
  async createMolliePayment(documentId) {
    return await this.request('/payments/mollie/create', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    return await this.request(`/payments/${paymentId}/status`);
  }

  /**
   * Get all Mollie payments for a document
   */
  async getDocumentMolliePayments(documentId) {
    return await this.request(`/payments/document/${documentId}`);
  }
}

// Singleton instance
export const api = new OffertoAPI();

// Initialize on module load
if (typeof window !== 'undefined') {
  api.init();
}

export default api;
