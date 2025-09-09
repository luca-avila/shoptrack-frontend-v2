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
        // Set initial section to products
        this.currentSection = 'products';
        this.searchTerm = '';
        
        // Don't load data here - let the auth manager handle it
        // when authentication is confirmed
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

        // Search input
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
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
            el.style.display = 'none'; // Ensure all sections are hidden
        });
        
        // Show the active section
        const activeSection = document.getElementById(`${section}-section`);
        activeSection.classList.add('active');
        activeSection.style.display = 'block'; // Force display

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

        // Filter products based on search term
        const filteredProducts = this.products.filter(product => {
            if (!this.searchTerm) return true;
            
            const name = product.name.toLowerCase();
            const description = (product.description || '').toLowerCase();
            
            return name.includes(this.searchTerm) || description.includes(this.searchTerm);
        });

        if (filteredProducts.length === 0) {
            container.innerHTML = '<p class="no-data">No products match your search.</p>';
            return;
        }

        container.innerHTML = filteredProducts.map(product => this.createProductCard(product)).join('');
        
        // Add event listeners to product cards
        this.attachProductEventListeners();
    }

    createProductCard(product) {
        const isLowStock = product.stock <= 10;
        const stockClass = isLowStock ? 'stock-low' : '';
        
        return `
            <div class="product-card clickable-product" data-product-id="${product.id}">
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
        // Product card click (for history view)
        document.querySelectorAll('.clickable-product').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or inputs
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                    return;
                }
                const productId = parseInt(e.currentTarget.dataset.productId);
                this.viewProductHistory(productId);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const productId = parseInt(e.target.dataset.productId);
                this.editProduct(productId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const productId = parseInt(e.target.dataset.productId);
                this.deleteProduct(productId);
            });
        });

        // Stock management buttons
        document.querySelectorAll('.add-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const productId = parseInt(e.target.dataset.productId);
                this.manageStock(productId, 'add');
            });
        });

        document.querySelectorAll('.remove-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const productId = parseInt(e.target.dataset.productId);
                this.manageStock(productId, 'remove');
            });
        });

        document.querySelectorAll('.set-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
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

    handleSearch(e) {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.renderProducts();
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
            
            // Also reload history to see if transaction was created
            this.loadHistory();
        } catch (error) {
            console.error('Stock management error:', error);
            APIUtils.showMessage(error.message || `Failed to ${action} stock`, 'error');
        }
    }

    async viewProductHistory(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) {
                APIUtils.showMessage('Product not found', 'error');
                return;
            }

            // Load product history
            const response = await api.getTransactionsByProduct(productId);
            const productHistory = response.data || [];
            
            // Sort by date (recent first)
            productHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Show product history modal
            this.showProductHistoryModal(product, productHistory);
        } catch (error) {
            console.error('Failed to load product history:', error);
            APIUtils.showMessage('Failed to load product history', 'error');
        }
    }

    showProductHistoryModal(product, history) {
        // Create modal HTML
        const modalHTML = `
            <div id="product-history-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Transaction History: ${this.escapeHtml(product.name)}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="product-info">
                            <p><strong>Price:</strong> ${APIUtils.formatCurrency(product.price)}</p>
                            <p><strong>Current Stock:</strong> ${product.stock}</p>
                            ${product.description ? `<p><strong>Description:</strong> ${this.escapeHtml(product.description)}</p>` : ''}
                        </div>
                        <div class="history-section">
                            <h4>Transaction History</h4>
                            <div id="product-history-list" class="history-list">
                                ${history.length === 0 ? '<p class="no-data">No transactions found for this product.</p>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Render history if there are transactions
        if (history.length > 0) {
            const historyContainer = document.getElementById('product-history-list');
            historyContainer.innerHTML = history.map(transaction => this.createHistoryItem(transaction)).join('');
        }
        
        // Add click outside to close
        document.getElementById('product-history-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-history-modal') {
                e.target.remove();
            }
        });
    }

    // History Management
    async loadHistory() {
        try {
            const response = await api.getHistory();
            this.history = response.data || [];
            
            // Sort history by created_at date (recent first)
            this.history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
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
        // Always load both products and history to ensure data is fresh
        this.loadProducts();
        this.loadHistory();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShopTrackApp();
});

// Export for global access
window.ShopTrackApp = ShopTrackApp;
