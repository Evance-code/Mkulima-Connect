// validation.js - Form validation and data integrity for Mkulima Connect

class Validation {
    constructor() {
        this.rules = {};
        this.messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number',
            min: 'Value must be at least {min}',
            max: 'Value must be at most {max}',
            minLength: 'Must be at least {minLength} characters',
            maxLength: 'Must be at most {maxLength} characters',
            pattern: 'Invalid format',
            match: 'Values do not match',
            numeric: 'Must be a number',
            integer: 'Must be a whole number',
            positive: 'Must be a positive number',
            url: 'Please enter a valid URL',
            date: 'Please enter a valid date',
            futureDate: 'Date must be in the future',
            pastDate: 'Date must be in the past'
        };
        this.init();
    }

    init() {
        this.setupDefaultRules();
        this.setupFormValidation();
    }

    setupDefaultRules() {
        this.rules = {
            name: { required: true, minLength: 2, maxLength: 100 },
            phone: { required: true, pattern: /^(\+255|255|0)[67]\d{8}$/ },
            email: { required: false, email: true },
            password: { required: true, minLength: 6 },
            quantity: { required: true, numeric: true, positive: true, min: 1 },
            price: { required: true, numeric: true, positive: true, min: 0 },
            location: { required: true, minLength: 3 },
            description: { required: false, maxLength: 1000 }
        };
    }

    setupFormValidation() {
        // Auto-validate forms with data-validate attribute
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.hasAttribute('data-validate')) {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });

        // Real-time validation on input
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.hasAttribute('data-validate')) {
                this.validateField(input);
            }
        });

        // Validate on blur
        document.addEventListener('blur', (e) => {
            const input = e.target;
            if (input.hasAttribute('data-validate') && input.value) {
                this.validateField(input);
            }
        }, true);
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('[data-validate]');
        let isValid = true;

        // Clear previous errors
        this.clearFormErrors(form);

        // Validate each field
        inputs.forEach(input => {
            const fieldValid = this.validateField(input);
            if (!fieldValid) {
                isValid = false;

                // Focus first invalid field
                if (isValid === false) { // This ensures we only focus once
                    input.focus();
                    isValid = null; // Set to null so we don't focus again
                }
            }
        });

        // Show form-level errors if any
        if (!isValid) {
            this.showFormError(form, 'Please correct the errors below.');
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value;
        const rules = this.getFieldRules(field);
        const errors = [];

        // Check each rule
        Object.entries(rules).forEach(([rule, param]) => {
            const error = this.checkRule(rule, value, param, field);
            if (error) {
                errors.push(error);
            }
        });

        // Update field state
        this.updateFieldState(field, errors);

        return errors.length === 0;
    }

    getFieldRules(field) {
        // Get rules from data attributes or default rules
        const fieldName = field.name || field.id;
        const defaultRules = this.rules[fieldName] || {};
        const dataRules = {};

        // Extract rules from data attributes
        if (field.dataset.validate) {
            const ruleStrings = field.dataset.validate.split(' ');
            ruleStrings.forEach(ruleStr => {
                if (ruleStr.includes(':')) {
                    const [rule, param] = ruleStr.split(':');
                    dataRules[rule] = this.parseRuleParam(param);
                } else {
                    dataRules[ruleStr] = true;
                }
            });
        }

        // Merge rules (data attributes override defaults)
        return { ...defaultRules, ...dataRules };
    }

    parseRuleParam(param) {
        // Parse rule parameters
        if (param === 'true') return true;
        if (param === 'false') return false;
        if (!isNaN(param)) return Number(param);
        if (param.startsWith('/') && param.endsWith('/')) {
            return new RegExp(param.slice(1, -1));
        }
        return param;
    }

    checkRule(rule, value, param, field) {
        // Skip validation for empty fields unless required
        if (!value && rule !== 'required') {
            return null;
        }

        switch (rule) {
            case 'required':
                if (!value || value.trim() === '') {
                    return this.getMessage('required', { field: field.name });
                }
                break;

            case 'email':
                if (!this.isValidEmail(value)) {
                    return this.getMessage('email');
                }
                break;

            case 'phone':
                if (!this.isValidPhone(value)) {
                    return this.getMessage('phone');
                }
                break;

            case 'min':
                if (parseFloat(value) < param) {
                    return this.getMessage('min', { min: param });
                }
                break;

            case 'max':
                if (parseFloat(value) > param) {
                    return this.getMessage('max', { max: param });
                }
                break;

            case 'minLength':
                if (value.length < param) {
                    return this.getMessage('minLength', { minLength: param });
                }
                break;

            case 'maxLength':
                if (value.length > param) {
                    return this.getMessage('maxLength', { maxLength: param });
                }
                break;

            case 'pattern':
                if (!param.test(value)) {
                    return this.getMessage('pattern');
                }
                break;

            case 'match':
                const matchField = document.querySelector(`[name="${param}"]`);
                if (matchField && value !== matchField.value) {
                    return this.getMessage('match');
                }
                break;

            case 'numeric':
                if (isNaN(value)) {
                    return this.getMessage('numeric');
                }
                break;

            case 'integer':
                if (!Number.isInteger(parseFloat(value))) {
                    return this.getMessage('integer');
                }
                break;

            case 'positive':
                if (parseFloat(value) <= 0) {
                    return this.getMessage('positive');
                }
                break;

            case 'url':
                if (!this.isValidUrl(value)) {
                    return this.getMessage('url');
                }
                break;

            case 'date':
                if (!this.isValidDate(value)) {
                    return this.getMessage('date');
                }
                break;

            case 'futureDate':
                const date = new Date(value);
                if (date <= new Date()) {
                    return this.getMessage('futureDate');
                }
                break;

            case 'pastDate':
                const pastDate = new Date(value);
                if (pastDate >= new Date()) {
                    return this.getMessage('pastDate');
                }
                break;
        }

        return null;
    }

    getMessage(key, params = {}) {
        let message = this.messages[key] || key;

        // Replace placeholders
        Object.entries(params).forEach(([param, value]) => {
            message = message.replace(`{${param}}`, value);
        });

        return message;
    }

    updateFieldState(field, errors) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        // Remove existing error messages
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Update classes
        field.classList.remove('is-invalid', 'is-valid');
        formGroup.classList.remove('has-error', 'has-success');

        if (errors.length > 0) {
            field.classList.add('is-invalid');
            formGroup.classList.add('has-error');

            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errors[0];
            formGroup.appendChild(errorDiv);
        } else if (field.value) {
            field.classList.add('is-valid');
            formGroup.classList.add('has-success');
        }
    }

    clearFormErrors(form) {
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('has-error', 'has-success');

            const inputs = group.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });

            const errorMessages = group.querySelectorAll('.error-message');
            errorMessages.forEach(msg => msg.remove());
        });

        const formError = form.querySelector('.form-error');
        if (formError) {
            formError.remove();
        }
    }

    showFormError(form, message) {
        // Remove existing form error
        const existingError = form.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new form error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error alert alert-error';
        errorDiv.textContent = message;
        form.prepend(errorDiv);

        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Validation helper methods
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isValidPhone(phone) {
        // East African phone number validation
        const cleaned = phone.replace(/\s/g, '');
        const re = /^(\+255|255|0)[67]\d{8}$/; // Tanzania
        const reKe = /^(\+254|254|0)[17]\d{8}$/; // Kenya
        const reUg = /^(\+256|256|0)[7]\d{8}$/; // Uganda
        const reRw = /^(\+250|250|0)[7]\d{8}$/; // Rwanda

        return re.test(cleaned) || reKe.test(cleaned) || reUg.test(cleaned) || reRw.test(cleaned);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    // Data integrity checks
    validateListingData(listing) {
        const errors = [];

        if (!listing.cropType) errors.push('Crop type is required');
        if (!listing.quantity || listing.quantity <= 0) errors.push('Valid quantity is required');
        if (!listing.price || listing.price <= 0) errors.push('Valid price is required');
        if (!listing.location) errors.push('Location is required');

        if (listing.quantity > 10000) errors.push('Quantity seems unusually high');
        if (listing.price > 1000000) errors.push('Price seems unusually high');

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    validateUserData(user) {
        const errors = [];

        if (!user.name) errors.push('Name is required');
        if (!user.phone) errors.push('Phone number is required');
        if (!user.password) errors.push('Password is required');
        if (user.password && user.password.length < 6) errors.push('Password must be at least 6 characters');

        if (user.phone && !this.isValidPhone(user.phone)) {
            errors.push('Invalid phone number format');
        }

        if (user.email && !this.isValidEmail(user.email)) {
            errors.push('Invalid email address');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    validatePaymentData(payment) {
        const errors = [];

        if (!payment.amount || payment.amount <= 0) errors.push('Valid amount is required');
        if (!payment.phone) errors.push('Phone number is required');
        if (!payment.provider) errors.push('Payment provider is required');

        if (payment.amount > 10000000) errors.push('Amount exceeds maximum limit');

        if (payment.phone && !this.isValidPhone(payment.phone)) {
            errors.push('Invalid phone number');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Sanitization methods
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: links
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }

    sanitizeObject(obj) {
        const sanitized = {};

        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        });

        return sanitized;
    }

    // Anti-duplication checks
    detectDuplicateListing(newListing, existingListings) {
        const duplicates = existingListings.filter(listing =>
            listing.farmerId === newListing.farmerId &&
            listing.cropType === newListing.cropType &&
            listing.location === newListing.location &&
            Math.abs(listing.price - newListing.price) < (listing.price * 0.1) && // Within 10% price difference
            Math.abs(new Date(listing.createdAt) - new Date()) < 24 * 60 * 60 * 1000 // Created within 24 hours
        );

        return duplicates.length > 0;
    }

    // Rate limiting
    setupRateLimiting(action, limit = 5, timeframe = 60000) { // 5 attempts per minute
        const now = Date.now();
        const key = `rate_limit_${action}`;

        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const recentAttempts = attempts.filter(time => now - time < timeframe);

        if (recentAttempts.length >= limit) {
            return false;
        }

        recentAttempts.push(now);
        localStorage.setItem(key, JSON.stringify(recentAttempts));

        return true;
    }

    // Public API
    validate(data, schema) {
        if (schema === 'listing') {
            return this.validateListingData(data);
        } else if (schema === 'user') {
            return this.validateUserData(data);
        } else if (schema === 'payment') {
            return this.validatePaymentData(data);
        }

        return { valid: true, errors: [] };
    }

    sanitize(data) {
        return this.sanitizeObject(data);
    }

    addRule(fieldName, rule, validator) {
        if (!this.rules[fieldName]) {
            this.rules[fieldName] = {};
        }

        if (typeof validator === 'function') {
            this.rules[fieldName][rule] = validator;
        } else {
            this.rules[fieldName][rule] = validator;
        }
    }

    setMessage(key, message) {
        this.messages[key] = message;
    }

    getValidationSummary(form) {
        const inputs = form.querySelectorAll('[data-validate]');
        const summary = {
            valid: true,
            errors: [],
            fields: {}
        };

        inputs.forEach(input => {
            const isValid = this.validateField(input);
            const fieldName = input.name || input.id;

            summary.fields[fieldName] = {
                valid: isValid,
                value: input.value
            };

            if (!isValid) {
                summary.valid = false;
                const errorElement = input.closest('.form-group')?.querySelector('.error-message');
                if (errorElement) {
                    summary.errors.push({
                        field: fieldName,
                        message: errorElement.textContent
                    });
                }
            }
        });

        return summary;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.validation = new Validation();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
}