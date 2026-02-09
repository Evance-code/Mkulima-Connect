// main.js - App initialization and routing for Mkulima Connect

class MkulimaApp {
    constructor() {
        this.currentUser = null;
        this.currentLanguage = 'en';
        this.isOnline = navigator.onLine;
        this.init();
    }

    async init() {
        console.log('Mkulima Connect Initializing...');

        // Check authentication status
        await this.checkAuth();

        // Set up language
        this.setupLanguage();

        // Set up routing
        this.setupRouting();

        // Set up offline detection
        this.setupOfflineDetection();

        // Set up service worker for PWA
        this.setupServiceWorker();

        // Initialize components
        this.initComponents();

        console.log('Mkulima Connect Initialized');
    }

    async checkAuth() {
        const userData = localStorage.getItem('mkulima_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForUser();
        }
    }

    setupLanguage() {
        // Get saved language or default to English
        const savedLang = localStorage.getItem('mkulima_lang') || 'en';
        this.currentLanguage = savedLang;
        document.documentElement.lang = savedLang;

        // Update language toggle if exists
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.value = savedLang;
            langToggle.addEventListener('change', (e) => {
                this.switchLanguage(e.target.value);
            });
        }
    }

    setupRouting() {
        // Simple client-side routing for SPA-like experience
        if (document.querySelector('[data-route]')) {
            document.addEventListener('click', (e) => {
                if (e.target.matches('[data-route]')) {
                    e.preventDefault();
                    const route = e.target.dataset.route;
                    this.navigateTo(route);
                }
            });
        }

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.loadPage(window.location.pathname);
        });
    }

    navigateTo(route) {
        history.pushState({}, '', route);
        this.loadPage(route);
    }

    async loadPage(route) {
        // For now, just highlight active nav link
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === route) {
                link.classList.add('active');
            }
        });

        // In a full SPA, we would load content dynamically here
        console.log(`Navigating to: ${route}`);
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('Back online. Syncing data...', 'success');
            // Trigger sync
            if (typeof window.offlineManager !== 'undefined') {
                window.offlineManager.syncData();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('You are offline. Working in offline mode.', 'warning');
        });
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered:', registration);
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        }
    }

    initComponents() {
        // Initialize tooltips
        this.initTooltips();

        // Initialize modals
        this.initModals();

        // Initialize notifications
        this.initNotifications();

        // Load initial data
        this.loadInitialData();
    }

    initTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip);
            element.addEventListener('mouseleave', this.hideTooltip);
        });
    }

    showTooltip(e) {
        const tooltipText = e.target.dataset.tooltip;
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-active';
        tooltip.textContent = tooltipText;
        tooltip.style.position = 'absolute';
        tooltip.style.background = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '5px 10px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.zIndex = '1000';

        const rect = e.target.getBoundingClientRect();
        tooltip.style.top = (rect.top - 35) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.transform = 'translateX(-50%)';

        document.body.appendChild(tooltip);
        e.target.tooltipElement = tooltip;
    }

    hideTooltip(e) {
        if (e.target.tooltipElement) {
            e.target.tooltipElement.remove();
        }
    }

    initModals() {
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Close modals on background click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.remove();
        });
    }

    initNotifications() {
        // Create notification container
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Style the notification
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }

        container.appendChild(notification);

        // Add CSS for animations if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    getNotificationColor(type) {
        const colors = {
            success: '#32CD32',
            error: '#DC143C',
            warning: '#FF8C00',
            info: '#228B22'
        };
        return colors[type] || colors.info;
    }

    async loadInitialData() {
        // Load user preferences
        const preferences = JSON.parse(localStorage.getItem('mkulima_preferences') || '{}');

        // Apply theme if set
        if (preferences.theme) {
            document.documentElement.setAttribute('data-theme', preferences.theme);
        }

        // Apply region if set
        if (preferences.region) {
            document.documentElement.setAttribute('data-region', preferences.region);
        }
    }

    updateUIForUser() {
        if (this.currentUser) {
            // Update any user-specific UI elements
            const userElements = document.querySelectorAll('[data-user]');
            userElements.forEach(el => {
                const prop = el.dataset.user;
                if (this.currentUser[prop]) {
                    el.textContent = this.currentUser[prop];
                }
            });

            // Show/hide elements based on user type
            const userType = this.currentUser.type;
            document.querySelectorAll('[data-user-type]').forEach(el => {
                const allowedTypes = el.dataset.userType.split(',');
                if (allowedTypes.includes(userType)) {
                    el.style.display = '';
                } else {
                    el.style.display = 'none';
                }
            });
        }
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('mkulima_lang', lang);
        document.documentElement.lang = lang;

        // Notify translation module
        if (typeof window.translationManager !== 'undefined') {
            window.translationManager.switchLanguage(lang);
        }

        this.showNotification(`Language changed to ${lang === 'en' ? 'English' : 'Swahili'}`, 'success');
    }

    // Helper methods for API calls
    async fetchWithTimeout(resource, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    // Format currency for East Africa
    formatCurrency(amount, currency = 'USD') {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        return formatter.format(amount);
    }

    // Format date for locale
    formatDate(date, includeTime = false) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return new Date(date).toLocaleDateString(this.currentLanguage === 'sw' ? 'sw-KE' : 'en-US', options);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mkulimaApp = new MkulimaApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MkulimaApp;
}