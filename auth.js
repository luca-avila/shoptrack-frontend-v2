// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auth form switching
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.showAuthSection();
            return;
        }

        try {
            const response = await api.validate();
            this.currentUser = response.data.user;
            this.showMainApp();
            this.updateWelcomeMessage();
        } catch (error) {
            console.error('Auth validation failed:', error);
            this.clearAuth();
            this.showAuthSection();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const credentials = { username, password };
        
        // Validate input
        const errors = APIUtils.validateAuthData(credentials);
        if (errors.length > 0) {
            APIUtils.showMessage(errors.join(', '), 'error');
            return;
        }

        try {
            APIUtils.hideMessage();
            const loginBtn = e.target.querySelector('button[type="submit"]');
            APIUtils.showLoading(loginBtn);

            const response = await api.login(credentials);
            
            // Store token and user info
            localStorage.setItem('authToken', response.data.session_id);
            this.currentUser = { id: response.data.user_id };
            
            this.showMainApp();
            this.updateWelcomeMessage();
            this.clearLoginForm();
            
            APIUtils.showMessage('Login successful!', 'success');
        } catch (error) {
            APIUtils.showMessage(error.message || 'Login failed', 'error');
        } finally {
            const loginBtn = e.target.querySelector('button[type="submit"]');
            APIUtils.hideLoading(loginBtn);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        const userData = { username, email, password };
        
        // Validate input
        const errors = APIUtils.validateAuthData(userData, true);
        if (errors.length > 0) {
            APIUtils.showMessage(errors.join(', '), 'error');
            return;
        }

        try {
            APIUtils.hideMessage();
            const registerBtn = e.target.querySelector('button[type="submit"]');
            APIUtils.showLoading(registerBtn);

            const response = await api.register(userData);
            
            // Store token and user info
            localStorage.setItem('authToken', response.data.session_id);
            this.currentUser = { id: response.data.user_id };
            
            this.showMainApp();
            this.updateWelcomeMessage();
            this.clearRegisterForm();
            
            APIUtils.showMessage('Registration successful!', 'success');
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error message:', error.message);
            APIUtils.showMessage(error.message || 'Registration failed', 'error');
        } finally {
            const registerBtn = e.target.querySelector('button[type="submit"]');
            APIUtils.hideLoading(registerBtn);
        }
    }

    async handleLogout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
            this.showAuthSection();
            APIUtils.showMessage('Logged out successfully', 'success');
        }
    }

    showAuthSection() {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        this.showLoginForm();
    }

    showMainApp() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        
        // Load data in main app if it exists
        if (window.app) {
            // Ensure we're on the products section and load data
            window.app.currentSection = 'products';
            
            // Show the products section
            document.querySelectorAll('.content-section').forEach(el => {
                el.classList.remove('active');
                el.style.display = 'none';
            });
            
            const productsSection = document.getElementById('products-section');
            productsSection.classList.add('active');
            productsSection.style.display = 'block';
            
            // Update navigation button
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-section="products"]').classList.add('active');
            
            // Load data with a small delay to ensure DOM is ready
            setTimeout(() => {
                window.app.loadProducts();
                window.app.loadHistory();
            }, 100);
        }
    }

    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        APIUtils.hideMessage();
    }

    showRegisterForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        APIUtils.hideMessage();
    }

    updateWelcomeMessage() {
        const welcomeEl = document.getElementById('welcome-message');
        if (welcomeEl && this.currentUser) {
            const username = this.currentUser.username || 'User';
            welcomeEl.textContent = `Welcome, ${username}!`;
        }
    }

    clearLoginForm() {
        document.getElementById('loginForm').reset();
    }

    clearRegisterForm() {
        document.getElementById('registerForm').reset();
    }

    clearAuth() {
        localStorage.removeItem('authToken');
        this.currentUser = null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    // Get auth token
    getToken() {
        return localStorage.getItem('authToken');
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Export for use in other files
window.authManager = authManager;
