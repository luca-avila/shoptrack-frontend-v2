// API Configuration
const API_BASE_URL = 'https://shoptrack-backend.onrender.com/api';

// API Utility Functions
class API {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                console.error('HTTP error response:', response.status, data);
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            // Backend returns {success: true, data: {...}, message: "..."}
            if (data.success === false) {
                console.error('Backend error response:', data);
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication endpoints
    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async validate() {
        return this.get('/auth/validate');
    }

    // Product endpoints
    async getProducts() {
        return this.get('/products/');
    }

    async getProduct(productId) {
        return this.get(`/products/${productId}`);
    }

    async createProduct(productData) {
        return this.post('/products/', productData);
    }

    async updateProduct(productId, productData) {
        return this.put(`/products/${productId}`, productData);
    }

    async deleteProduct(productId) {
        return this.delete(`/products/${productId}`);
    }

    async addStock(productId, quantity) {
        return this.post(`/products/${productId}/stock/add/${quantity}`);
    }

    async removeStock(productId, quantity) {
        return this.post(`/products/${productId}/stock/remove/${quantity}`);
    }

    async setStock(productId, quantity) {
        return this.post(`/products/${productId}/stock/set/${quantity}`);
    }

    async updatePrice(productId, newPrice) {
        return this.put(`/products/${productId}/price/${newPrice}`);
    }

    async searchProducts(query) {
        return this.get(`/products/search/${encodeURIComponent(query)}`);
    }

    async getLowStockProducts(threshold = 10) {
        return this.get(`/products/low-stock?threshold=${threshold}`);
    }

    // History endpoints
    async getHistory(historyId = null) {
        const endpoint = historyId ? `/history/${historyId}` : '/history/';
        return this.get(endpoint);
    }

    async createTransaction(transactionData) {
        return this.post('/history/', transactionData);
    }

    async updateTransaction(historyId, transactionData) {
        return this.put(`/history/${historyId}`, transactionData);
    }

    async deleteTransaction(historyId) {
        return this.delete(`/history/${historyId}`);
    }

    async getTransactionsByAction(action) {
        return this.get(`/history/action/${action}`);
    }

    async getTransactionsByProduct(productId) {
        return this.get(`/history/product/${productId}`);
    }
}

// Create global API instance
const api = new API();

// Utility functions for common operations
const APIUtils = {
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Show loading state
    showLoading(element) {
        element.classList.add('loading');
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        element.appendChild(spinner);
    },

    // Hide loading state
    hideLoading(element) {
        element.classList.remove('loading');
        const spinner = element.querySelector('.spinner');
        if (spinner) {
            spinner.remove();
        }
    },

    // Show message
    showMessage(message, type = 'success', duration = 3000) {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            if (duration > 0) {
                setTimeout(() => {
                    messageEl.style.display = 'none';
                }, duration);
            }
        }
    },

    // Hide message
    hideMessage() {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    },

    // Validate form data
    validateProductData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Product name is required');
        }
        
        if (!data.price || data.price <= 0) {
            errors.push('Price must be greater than 0');
        }
        
        if (data.stock === undefined || data.stock < 0) {
            errors.push('Stock must be 0 or greater');
        }
        
        return errors;
    },

    // Validate auth data
    validateAuthData(data, isRegister = false) {
        const errors = [];
        
        if (!data.username || data.username.trim().length === 0) {
            errors.push('Username is required');
        }
        
        if (!data.password || data.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        
        if (isRegister) {
            if (!data.email || !this.isValidEmail(data.email)) {
                errors.push('Valid email is required');
            }
        }
        
        return errors;
    },

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for use in other files
window.api = api;
window.APIUtils = APIUtils;
