// userManager.js - Farmer/buyer profile management for Mkulima Connect

class UserManager {
    constructor() {
        this.currentUser = null;
        this.userTypes = ['farmer', 'buyer', 'cooperative', 'extension_officer'];
        this.init();
    }

    init() {
        this.loadUser();
        this.setupEventListeners();
        this.setupProfileForms();
    }

    loadUser() {
        const userData = localStorage.getItem('mkulima_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserUI();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Profile update form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    setupProfileForms() {
        // Show/hide fields based on user type
        const userTypeSelect = document.getElementById('userType');
        if (userTypeSelect) {
            userTypeSelect.addEventListener('change', (e) => {
                this.toggleUserTypeFields(e.target.value);
            });
            // Initialize on load
            this.toggleUserTypeFields(userTypeSelect.value);
        }
    }

    toggleUserTypeFields(userType) {
        // Hide all type-specific fields
        document.querySelectorAll('[data-user-type]').forEach(field => {
            field.style.display = 'none';
        });

        // Show fields for this user type
        document.querySelectorAll(`[data-user-type*="${userType}"]`).forEach(field => {
            field.style.display = 'block';
        });

        // Also show common fields
        document.querySelectorAll('[data-user-type="all"]').forEach(field => {
            field.style.display = 'block';
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await this.authenticateUser(phone, password);
            this.showNotification('Login successful!', 'success');
            window.location.href = 'index.html';
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleRegistration(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData);

        try {
            await this.registerUser(userData);
            this.showNotification('Registration successful!', 'success');
            window.location.href = 'profile.html';
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData);

        try {
            await this.updateUserProfile(updates);
            this.showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async authenticateUser(phone, password) {
        // Mock authentication - in production, this would call your backend
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check localStorage for users (mock database)
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const user = users.find(u => u.phone === phone && u.password === password);

        if (!user) {
            throw new Error('Invalid phone number or password');
        }

        // Remove password before storing in current user
        const { password: _, ...userWithoutPassword } = user;
        this.currentUser = userWithoutPassword;
        localStorage.setItem('mkulima_user', JSON.stringify(userWithoutPassword));

        return userWithoutPassword;
    }

    async registerUser(userData) {
        // Validation
        if (!userData.phone || !userData.password) {
            throw new Error('Phone number and password are required');
        }

        if (userData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const existingUser = users.find(u => u.phone === userData.phone);

        if (existingUser) {
            throw new Error('User with this phone number already exists');
        }

        // Create new user
        const newUser = {
            id: this.generateUserId(),
            ...userData,
            createdAt: new Date().toISOString(),
            isVerified: false,
            rating: 0,
            transactionCount: 0
        };

        // Save to "database"
        users.push(newUser);
        localStorage.setItem('mkulima_users', JSON.stringify(users));

        // Log user in
        const { password, ...userWithoutPassword } = newUser;
        this.currentUser = userWithoutPassword;
        localStorage.setItem('mkulima_user', JSON.stringify(userWithoutPassword));

        return userWithoutPassword;
    }

    async updateUserProfile(updates) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        // Update current user
        this.currentUser = { ...this.currentUser, ...updates };
        localStorage.setItem('mkulima_user', JSON.stringify(this.currentUser));

        // Update in users database
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);

        if (userIndex !== -1) {
            // Keep password if not changing
            if (!updates.password) {
                updates.password = users[userIndex].password;
            }
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('mkulima_users', JSON.stringify(users));
        }

        this.updateUserUI();
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('mkulima_user');
        this.showNotification('Logged out successfully', 'success');
        window.location.href = 'index.html';
    }

    updateUserUI() {
        if (!this.currentUser) return;

        // Update user info in UI
        const elements = {
            'userName': this.currentUser.name,
            'userPhone': this.currentUser.phone,
            'userLocation': this.currentUser.location,
            'userType': this.currentUser.userType
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;
            }
        });

        // Update profile form values
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            Object.keys(this.currentUser).forEach(key => {
                const input = profileForm.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = this.currentUser[key];
                }
            });
        }

        // Show/hide login/logout buttons
        document.querySelectorAll('.login-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.style.display = 'block';
        });
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async verifyUser(verificationCode) {
        // Mock verification - in production, this would verify SMS code
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (verificationCode === '123456') { // Mock code
            this.currentUser.isVerified = true;
            localStorage.setItem('mkulima_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }

    updateUserRating(userId, rating, review) {
        // Update user rating in the system
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            const user = users[userIndex];
            user.ratings = user.ratings || [];
            user.ratings.push({
                rating,
                review,
                date: new Date().toISOString()
            });

            // Calculate new average
            const total = user.ratings.reduce((sum, r) => sum + r.rating, 0);
            user.rating = total / user.ratings.length;

            localStorage.setItem('mkulima_users', JSON.stringify(users));

            // Update current user if it's them
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser.rating = user.rating;
                localStorage.setItem('mkulima_user', JSON.stringify(this.currentUser));
            }
        }
    }

    getUserStats(userId) {
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const user = users.find(u => u.id === userId);

        if (!user) return null;

        return {
            rating: user.rating || 0,
            transactionCount: user.transactionCount || 0,
            joinDate: user.createdAt,
            isVerified: user.isVerified || false,
            userType: user.userType
        };
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        } else {
            alert(`${type}: ${message}`);
        }
    }

    // Public API
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUserType() {
        return this.currentUser?.userType;
    }

    async requestVerification(phone) {
        // Mock SMS verification request
        console.log(`Sending verification code to ${phone}`);
        // In production, call SMS gateway API
        return { success: true, message: 'Verification code sent' };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}