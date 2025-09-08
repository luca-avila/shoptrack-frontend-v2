// Main Application
class ShopTrackApp {
    constructor() {
        this.products = [];
        this.history = [];
        this.currentSection = 'products';
        this.editingProduct = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Only load data if user is authenticated
        if (authManager.isAuthenticated()) {
            this.loadProducts();
            this.loadHistory();
        }
    }

    setupEventListeners() {
        // Navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
        });

        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
        }

        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showProductForm());
        }

        // Cancel product button
        const cancelProductBtn = document.getElementById('cancel-product');
        if (cancelProductBtn) {
            cancelProductBtn.addEventListener('click', () => this.hideProductForm());
        }

        // History filter
        const actionFilter = document.getElementById('action-filter');
        if (actionFilter) {
            actionFilter.addEventListener('change', (e) => this.filterHistory(e.target.value));
        }
    }

    // Navigation
    switchSection(section) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Show/hide content sections
        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;

        // Load data for the section
        if (section === 'products') {
            this.loadProducts();
        } else if (section === 'history') {
            this.loadHistory();
        }
    }

    // Product Management
    async loadProducts() {
        try {
            const response = await api.getProducts();
            this.products = response.data || [];
            this.renderProducts();
        } catch (error) {
            console.error('Failed to load products:', error);
            APIUtils.showMessage('Failed to load products', 'error');
        }
    }

    renderProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = '<p class="no-data">No products found. Add your first product!</p>';
            return;
        }

        container.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
        
        // Add event listeners to product cards
        this.attachProductEventListeners();
    }

    createProductCard(product) {
        const isLowStock = product.stock <= 10;
        const stockClass = isLowStock ? 'stock-low' : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-header">
                    <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
                    <div class="product-actions">
                        <button class="btn btn-small btn-secondary edit-product" data-product-id="${product.id}">Edit</button>
                        <button class="btn btn-small btn-danger delete-product" data-product-id="${product.id}">Delete</button>
                    </div>
                </div>
                <div class="product-details">
                    <div class="product-price">${APIUtils.formatCurrency(product.price)}</div>
                    <div class="product-stock ${stockClass}">Stock: ${product.stock}</div>
                    ${product.description ? `<div class="product-description">${this.escapeHtml(product.description)}</div>` : ''}
                </div>
                <div class="stock-actions">
                    <input type="number" class="stock-input" placeholder="Qty" min="1" data-product-id="${product.id}">
                    <button class="btn btn-small btn-primary add-stock" data-product-id="${product.id}">Add</button>
                    <button class="btn btn-small btn-secondary remove-stock" data-product-id="${product.id}">Remove</button>
                    <button class="btn btn-small btn-secondary set-stock" data-product-id="${product.id}">Set</button>
                </div>
            </div>
        `;
    }

    attachProductEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                this.editProduct(productId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                this.deleteProduct(productId);
            });
        });

        // Stock management buttons
        document.querySelectorAll('.add-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                this.manageStock(productId, 'add');
            });
        });

        document.querySelectorAll('.remove-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                this.manageStock(productId, 'remove');
            });
        });

        document.querySelectorAll('.set-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                this.manageStock(productId, 'set');
            });
        });
    }

    showProductForm() {
        document.getElementById('product-form').style.display = 'block';
        this.editingProduct = null;
        this.clearProductForm();
    }

    hideProductForm() {
        document.getElementById('product-form').style.display = 'none';
        this.editingProduct = null;
        this.clearProductForm();
    }

    clearProductForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.editingProduct = product;
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description || '';
        
        document.getElementById('product-form').style.display = 'block';
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        // Prevent double submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) {
            return; // Already processing
        }
        
        const formData = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value.trim()
        };

        // Validate data
        const errors = APIUtils.validateProductData(formData);
        if (errors.length > 0) {
            APIUtils.showMessage(errors.join(', '), 'error');
            return;
        }

        try {
            // Disable submit button and show loading
            submitBtn.disabled = true;
            APIUtils.showLoading(submitBtn);

            if (this.editingProduct) {
                const response = await api.updateProduct(this.editingProduct.id, formData);
                APIUtils.showMessage('Product updated successfully!', 'success');
            } else {
                const response = await api.createProduct(formData);
                APIUtils.showMessage('Product created successfully!', 'success');
            }

            this.hideProductForm();
            this.loadProducts();
        } catch (error) {
            APIUtils.showMessage(error.message || 'Failed to save product', 'error');
        } finally {
            // Re-enable submit button and hide loading
            submitBtn.disabled = false;
            APIUtils.hideLoading(submitBtn);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await api.deleteProduct(productId);
            APIUtils.showMessage('Product deleted successfully!', 'success');
            this.loadProducts();
        } catch (error) {
            APIUtils.showMessage(error.message || 'Failed to delete product', 'error');
        }
    }

    async manageStock(productId, action) {
        const input = document.querySelector(`input[data-product-id="${productId}"]`);
        const quantity = parseInt(input.value);
        
        if (!quantity || quantity <= 0) {
            APIUtils.showMessage('Please enter a valid quantity', 'error');
            return;
        }

        try {
            let response;
            switch (action) {
                case 'add':
                    response = await api.addStock(productId, quantity);
                    break;
                case 'remove':
                    response = await api.removeStock(productId, quantity);
                    break;
                case 'set':
                    response = await api.setStock(productId, quantity);
                    break;
            }

            APIUtils.showMessage(`Stock ${action}ed successfully!`, 'success');
            input.value = '';
            this.loadProducts();
        } catch (error) {
            APIUtils.showMessage(error.message || `Failed to ${action} stock`, 'error');
        }
    }

    // History Management
    async loadHistory() {
        try {
            const response = await api.getHistory();
            this.history = response.data || [];
            this.renderHistory();
        } catch (error) {
            console.error('Failed to load history:', error);
            APIUtils.showMessage('Failed to load transaction history', 'error');
        }
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = '<p class="no-data">No transaction history found.</p>';
            return;
        }

        container.innerHTML = this.history.map(transaction => this.createHistoryItem(transaction)).join('');
    }

    createHistoryItem(transaction) {
        const actionClass = transaction.action === 'buy' ? 'action-buy' : 'action-sell';
        const actionText = transaction.action === 'buy' ? 'Bought' : 'Sold';
        
        return `
            <div class="history-item">
                <div class="history-details">
                    <div class="history-product">${this.escapeHtml(transaction.product_name)}</div>
                    <div class="history-meta">
                        ${actionText} • ${APIUtils.formatDate(transaction.created_at)}
                    </div>
                </div>
                <div class="history-amount">
                    <div class="history-price ${actionClass}">${APIUtils.formatCurrency(transaction.price)}</div>
                    <div class="history-quantity">Qty: ${transaction.quantity}</div>
                </div>
            </div>
        `;
    }

    async filterHistory(action) {
        try {
            let response;
            if (action) {
                response = await api.getTransactionsByAction(action);
            } else {
                response = await api.getHistory();
            }
            
            this.history = response.data || [];
            this.renderHistory();
        } catch (error) {
            console.error('Failed to filter history:', error);
            APIUtils.showMessage('Failed to filter history', 'error');
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public methods for external access
    refreshData() {
        if (this.currentSection === 'products') {
            this.loadProducts();
        } else if (this.currentSection === 'history') {
            this.loadHistory();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShopTrackApp();
});

// Export for global access
window.ShopTrackApp = ShopTrackApp;
