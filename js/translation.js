// translation.js - Swahili/English language support for Mkulima Connect

class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('mkulima_lang') || 'en';
        this.translations = {};
        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.setupLanguageToggle();
        this.applyTranslations();
    }

    async loadTranslations() {
        try {
            // Load from JSON file
            const response = await fetch('data/languages.json');
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback to embedded translations
            this.translations = this.getDefaultTranslations();
        }
    }

    getDefaultTranslations() {
        return {
            en: {
                // Navigation
                'nav.dashboard': 'Dashboard',
                'nav.prices': 'Market Prices',
                'nav.sell': 'Sell Produce',
                'nav.buy': 'Buy Produce',
                'nav.logistics': 'Logistics',
                'nav.learn': 'Learn',
                'nav.messages': 'Messages',
                'nav.profile': 'Profile',
                'nav.cooperative': 'Cooperative',
                'nav.offline': 'Offline Mode',

                // Common
                'common.welcome': 'Welcome',
                'common.loading': 'Loading...',
                'common.error': 'Error',
                'common.success': 'Success',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
                'common.delete': 'Delete',
                'common.edit': 'Edit',
                'common.view': 'View',
                'common.search': 'Search',
                'common.filter': 'Filter',
                'common.clear': 'Clear',

                // Dashboard
                'dashboard.title': 'Market Dashboard',
                'dashboard.active_listings': 'Active Listings',
                'dashboard.unread_messages': 'Unread Messages',
                'dashboard.best_price': 'Today\'s Best Price',
                'dashboard.market_overview': 'Market Overview',
                'dashboard.weather_advisory': 'Weather Advisory',
                'dashboard.quick_actions': 'Quick Actions',

                // Market Prices
                'prices.title': 'Live Market Prices',
                'prices.crop': 'Crop',
                'prices.market': 'Market',
                'prices.price': 'Price',
                'prices.change': 'Change',
                'prices.last_updated': 'Last Updated',
                'prices.set_alert': 'Set Price Alert',
                'prices.alert_crop': 'Crop Name',
                'prices.alert_price': 'Target Price',

                // Listings
                'listings.create': 'Create New Listing',
                'listings.crop_type': 'Crop Type',
                'listings.quantity': 'Quantity',
                'listings.quality': 'Quality Grade',
                'listings.price': 'Price per unit',
                'listings.location': 'Location',
                'listings.description': 'Description',
                'listings.photos': 'Upload Photos',
                'listings.active': 'Your Active Listings',
                'listings.status.available': 'Available',
                'listings.status.sold': 'Sold',
                'listings.status.reserved': 'Reserved',

                // User
                'user.login': 'Login',
                'user.register': 'Register',
                'user.logout': 'Logout',
                'user.profile': 'My Profile',
                'user.settings': 'Settings',
                'user.phone': 'Phone Number',
                'user.password': 'Password',
                'user.name': 'Full Name',
                'user.email': 'Email',
                'user.location': 'Location',
                'user.type': 'User Type',
                'user.type.farmer': 'Farmer',
                'user.type.buyer': 'Buyer',
                'user.type.cooperative': 'Cooperative',
                'user.type.extension': 'Extension Officer',

                // Payments
                'payment.title': 'Make Payment',
                'payment.provider': 'Payment Provider',
                'payment.amount': 'Amount',
                'payment.phone': 'Phone Number',
                'payment.description': 'Description',
                'payment.fees': 'Fees',
                'payment.total': 'Total',
                'payment.receipt': 'Payment Receipt',
                'payment.escrow': 'Use Escrow Service',

                // Messages
                'messages.title': 'Messages',
                'messages.new': 'New Message',
                'messages.type_here': 'Type your message...',
                'messages.send': 'Send',
                'messages.conversations': 'Conversations',
                'messages.no_conversations': 'No conversations yet',

                // Weather
                'weather.title': 'Weather Forecast',
                'weather.temperature': 'Temperature',
                'weather.humidity': 'Humidity',
                'weather.precipitation': 'Precipitation',
                'weather.wind': 'Wind Speed',
                'weather.conditions': 'Conditions',

                // Errors
                'error.required': 'This field is required',
                'error.invalid_phone': 'Invalid phone number',
                'error.invalid_email': 'Invalid email address',
                'error.password_length': 'Password must be at least 6 characters',
                'error.login_failed': 'Invalid phone number or password',
                'error.offline': 'You are offline. Some features may not be available.'
            },
            sw: {
                // Navigation
                'nav.dashboard': 'Dashibodi',
                'nav.prices': 'Bei za Soko',
                'nav.sell': 'Uza Mazao',
                'nav.buy': 'Nunua Mazao',
                'nav.logistics': 'Usafiri',
                'nav.learn': 'Jifunze',
                'nav.messages': 'Ujumbe',
                'nav.profile': 'Wasifu Wangu',
                'nav.cooperative': 'Ushirika',
                'nav.offline': 'Hali ya Nje ya Mtandao',

                // Common
                'common.welcome': 'Karibu',
                'common.loading': 'Inapakia...',
                'common.error': 'Hitilafu',
                'common.success': 'Imefanikiwa',
                'common.save': 'Hifadhi',
                'common.cancel': 'Ghairi',
                'common.delete': 'Futa',
                'common.edit': 'Hariri',
                'common.view': 'Angalia',
                'common.search': 'Tafuta',
                'common.filter': 'Chuja',
                'common.clear': 'Safisha',

                // Dashboard
                'dashboard.title': 'Dashibodi ya Soko',
                'dashboard.active_listings': 'Tangazo Zilizo Wazi',
                'dashboard.unread_messages': 'Ujumbe Usiosomwa',
                'dashboard.best_price': 'Bei Bora ya Leo',
                'dashboard.market_overview': 'Muonekano wa Soko',
                'dashboard.weather_advisory': 'Taarifa ya Hali ya Hewa',
                'dashboard.quick_actions': 'Vitendo vya Haraka',

                // Market Prices
                'prices.title': 'Bei za Soko za Live',
                'prices.crop': 'Mazao',
                'prices.market': 'Soko',
                'prices.price': 'Bei',
                'prices.change': 'Mabadiliko',
                'prices.last_updated': 'Imesasishwa Mwisho',
                'prices.set_alert': 'Weka Tahadhari ya Bei',
                'prices.alert_crop': 'Jina la Mazao',
                'prices.alert_price': 'Bei ya Lengo',

                // Listings
                'listings.create': 'Tengeneza Tangazo Mpya',
                'listings.crop_type': 'Aina ya Mazao',
                'listings.quantity': 'Kiasi',
                'listings.quality': 'Daraja la Ubora',
                'listings.price': 'Bei kwa kitengo',
                'listings.location': 'Mahali',
                'listings.description': 'Maelezo',
                'listings.photos': 'Pakia Picha',
                'listings.active': 'Tangazo Zako Zilizo Wazi',
                'listings.status.available': 'Inapatikana',
                'listings.status.sold': 'Imeuzwa',
                'listings.status.reserved': 'Imehifadhiwa',

                // User
                'user.login': 'Ingia',
                'user.register': 'Jisajili',
                'user.logout': 'Toka',
                'user.profile': 'Wasifu Wangu',
                'user.settings': 'Mipangilio',
                'user.phone': 'Namba ya Simu',
                'user.password': 'Nenosiri',
                'user.name': 'Jina Kamili',
                'user.email': 'Barua Pepe',
                'user.location': 'Mahali',
                'user.type': 'Aina ya Mtumiaji',
                'user.type.farmer': 'Mkulima',
                'user.type.buyer': 'Mnunuzi',
                'user.type.cooperative': 'Ushirika',
                'user.type.extension': 'Afisa Kilimo',

                // Payments
                'payment.title': 'Fanya Malipo',
                'payment.provider': 'Mtoa Huduma ya Malipo',
                'payment.amount': 'Kiasi',
                'payment.phone': 'Namba ya Simu',
                'payment.description': 'Maelezo',
                'payment.fees': 'Ada',
                'payment.total': 'Jumla',
                'payment.receipt': 'Risiti ya Malipo',
                'payment.escrow': 'Tumia Huduma ya Escrow',

                // Messages
                'messages.title': 'Ujumbe',
                'messages.new': 'Ujumbe Mpya',
                'messages.type_here': 'Andika ujumbe wako...',
                'messages.send': 'Tuma',
                'messages.conversations': 'Mazungumzo',
                'messages.no_conversations': 'Hakuna mazungumzo bado',

                // Weather
                'weather.title': 'Utabiri wa Hali ya Hewa',
                'weather.temperature': 'Joto',
                'weather.humidity': 'Unyevu',
                'weather.precipitation': 'Mvua',
                'weather.wind': 'Kasi ya Upepo',
                'weather.conditions': 'Hali ya Hewa',

                // Errors
                'error.required': 'Sehemu hii inahitajika',
                'error.invalid_phone': 'Namba ya simu batili',
                'error.invalid_email': 'Anwani ya barua pepe batili',
                'error.password_length': 'Nenosiri lazima liwe na herufi angalau 6',
                'error.login_failed': 'Namba ya simu au nenosiri batili',
                'error.offline': 'Uko nje ya mtandao. Baadhi ya hudumu hazipatikani.'
            }
        };
    }

    setupLanguageToggle() {
        // Create language toggle if it doesn't exist
        if (!document.getElementById('languageToggle')) {
            const toggle = document.createElement('select');
            toggle.id = 'languageToggle';
            toggle.className = 'language-toggle';
            toggle.innerHTML = `
                <option value="en">English</option>
                <option value="sw">Swahili</option>
            `;
            toggle.value = this.currentLang;

            // Add to page if there's a language toggle container
            const container = document.querySelector('.language-container') || document.querySelector('header');
            if (container) {
                container.appendChild(toggle);
            }
        }

        // Add event listener
        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.switchLanguage(e.target.value);
            });
        }
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('mkulima_lang', lang);
        document.documentElement.lang = lang;

        // Update toggle
        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            toggle.value = lang;
        }

        // Apply translations
        this.applyTranslations();

        // Show notification
        this.showNotification(
            lang === 'en' ? 'Language switched to English' : 'Lugha imebadilishwa kuwa Kiswahili',
            'success'
        );
    }

    applyTranslations() {
        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            const translation = this.translate(key);

            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'IMG') {
                    element.alt = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Translate page title
        const titleKey = document.querySelector('title')?.dataset.i18n;
        if (titleKey) {
            const titleTranslation = this.translate(titleKey);
            if (titleTranslation) {
                document.title = titleTranslation;
            }
        }

        // Update RTL/LTR direction for Swahili
        if (this.currentLang === 'sw') {
            document.body.classList.add('swahili');
            document.body.dir = 'ltr'; // Swahili is LTR
        } else {
            document.body.classList.remove('swahili');
            document.body.dir = 'ltr';
        }
    }

    translate(key, fallback = null) {
        // Get translation for current language
        let translation = this.translations[this.currentLang]?.[key];

        // Fallback to English if not found
        if (!translation && this.currentLang !== 'en') {
            translation = this.translations.en?.[key];
        }

        // Fallback to provided fallback or key itself
        if (!translation) {
            translation = fallback || key;
        }

        return translation;
    }

    translateDynamic(text, context = {}) {
        // Translate dynamic text with placeholders
        let translated = this.translate(text, text);

        // Replace placeholders {key} with context values
        Object.entries(context).forEach(([key, value]) => {
            const placeholder = new RegExp(`{${key}}`, 'g');
            translated = translated.replace(placeholder, value);
        });

        return translated;
    }

    // Format numbers, dates, and currencies based on language
    formatNumber(number) {
        const formatter = new Intl.NumberFormat(this.currentLang === 'sw' ? 'sw-TZ' : 'en-US');
        return formatter.format(number);
    }

    formatDate(date, options = {}) {
        const lang = this.currentLang === 'sw' ? 'sw-TZ' : 'en-US';
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        return new Date(date).toLocaleDateString(lang, { ...defaultOptions, ...options });
    }

    formatCurrency(amount, currency = 'TSH') {
        const lang = this.currentLang === 'sw' ? 'sw-TZ' : 'en-US';

        // Tanzanian Shilling doesn't have a standard currency code in Intl
        if (currency === 'TSH') {
            return `${this.formatNumber(amount)} TSh`;
        }

        // For other currencies
        const formatter = new Intl.NumberFormat(lang, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });

        return formatter.format(amount);
    }

    // RTL support for future languages
    isRTL(lang) {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(lang);
    }

    // Load language-specific assets
    async loadLanguageAssets() {
        // Load language-specific CSS if needed
        if (this.currentLang === 'sw' && !document.querySelector('#swahili-styles')) {
            const link = document.createElement('link');
            link.id = 'swahili-styles';
            link.rel = 'stylesheet';
            link.href = 'css/swahili.css';
            document.head.appendChild(link);
        }

        // Remove if switching from Swahili
        if (this.currentLang !== 'sw') {
            const swahiliStyles = document.querySelector('#swahili-styles');
            if (swahiliStyles) {
                swahiliStyles.remove();
            }
        }
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        }
    }

    // Public API
    getCurrentLanguage() {
        return this.currentLang;
    }

    t(key, fallback = null) {
        return this.translate(key, fallback);
    }

    tDynamic(text, context = {}) {
        return this.translateDynamic(text, context);
    }

    // Initialize with URL parameter
    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');

        if (langParam && (langParam === 'en' || langParam === 'sw')) {
            this.switchLanguage(langParam);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.translationManager = new TranslationManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationManager;
}