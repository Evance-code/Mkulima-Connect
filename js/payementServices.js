// paymentService.js - Mobile money integration simulation for Mkulima Connect

class PaymentService {
    constructor() {
        this.supportedProviders = ['mpesa', 'tigopesa', 'airtelmoney', 'vodacom'];
        this.transactions = JSON.parse(localStorage.getItem('mkulima_transactions') || '[]');
        this.escrowEnabled = true;
        this.init();
    }

    init() {
        this.loadPaymentProviders();
        this.setupEventListeners();
        this.setupPaymentForms();
    }

    loadPaymentProviders() {
        // Load provider configurations
        this.providers = {
            mpesa: {
                name: 'M-Pesa',
                countries: ['KE', 'TZ'],
                currency: 'KES',
                fees: { percentage: 1.5, fixed: 0 },
                limits: { min: 10, max: 50000 }
            },
            tigopesa: {
                name: 'Tigo Pesa',
                countries: ['TZ'],
                currency: 'TSH',
                fees: { percentage: 1, fixed: 100 },
                limits: { min: 1000, max: 1000000 }
            },
            airtelmoney: {
                name: 'Airtel Money',
                countries: ['TZ', 'UG', 'RW'],
                currency: 'TSH',
                fees: { percentage: 1.2, fixed: 0 },
                limits: { min: 500, max: 500000 }
            },
            vodacom: {
                name: 'Vodacom M-Pesa',
                countries: ['TZ'],
                currency: 'TSH',
                fees: { percentage: 1.5, fixed: 0 },
                limits: { min: 1000, max: 3000000 }
            }
        };
    }

    setupEventListeners() {
        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePayment(e));
        }

        // Provider selection
        const providerSelect = document.getElementById('paymentProvider');
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => this.updateProviderDetails(e.target.value));
        }

        // Amount input
        const amountInput = document.getElementById('paymentAmount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => this.calculateFees(e.target.value));
        }
    }

    setupPaymentForms() {
        // Initialize provider select options
        const providerSelect = document.getElementById('paymentProvider');
        if (providerSelect) {
            providerSelect.innerHTML = '';
            Object.entries(this.providers).forEach(([id, provider]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = provider.name;
                providerSelect.appendChild(option);
            });

            // Trigger initial update
            this.updateProviderDetails(providerSelect.value);
        }
    }

    updateProviderDetails(providerId) {
        const provider = this.providers[providerId];
        if (!provider) return;

        // Update UI with provider details
        const detailsElement = document.getElementById('providerDetails');
        if (detailsElement) {
            detailsElement.innerHTML = `
                <p><strong>Fees:</strong> ${provider.fees.percentage}% ${provider.fees.fixed > 0 ? `+ ${provider.fees.fixed} ${provider.currency}` : ''}</p>
                <p><strong>Limits:</strong> ${provider.limits.min} - ${provider.limits.max} ${provider.currency}</p>
                <p><strong>Countries:</strong> ${provider.countries.join(', ')}</p>
            `;
        }

        // Update currency display
        document.querySelectorAll('.currency-display').forEach(el => {
            el.textContent = provider.currency;
        });
    }

    calculateFees(amount) {
        const providerSelect = document.getElementById('paymentProvider');
        if (!providerSelect) return;

        const provider = this.providers[providerSelect.value];
        if (!provider || !amount) return;

        const amountNum = parseFloat(amount);
        const fee = (amountNum * provider.fees.percentage / 100) + provider.fees.fixed;
        const total = amountNum + fee;

        // Update UI
        const feeElement = document.getElementById('feeAmount');
        const totalElement = document.getElementById('totalAmount');

        if (feeElement) {
            feeElement.textContent = this.formatCurrency(fee, provider.currency);
        }
        if (totalElement) {
            totalElement.textContent = this.formatCurrency(total, provider.currency);
        }
    }

    async handlePayment(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const paymentData = Object.fromEntries(formData);

        try {
            // Validate payment
            this.validatePayment(paymentData);

            // Process payment
            const result = await this.processPayment(paymentData);

            // Show success
            this.showPaymentReceipt(result);

            // Reset form
            e.target.reset();

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    validatePayment(paymentData) {
        const errors = [];
        const provider = this.providers[paymentData.provider];

        if (!provider) {
            errors.push('Invalid payment provider');
        }

        const amount = parseFloat(paymentData.amount);
        if (!amount || amount <= 0) {
            errors.push('Invalid amount');
        }

        if (amount < provider.limits.min) {
            errors.push(`Minimum amount is ${provider.limits.min} ${provider.currency}`);
        }

        if (amount > provider.limits.max) {
            errors.push(`Maximum amount is ${provider.limits.max} ${provider.currency}`);
        }

        if (!paymentData.phone || paymentData.phone.length < 9) {
            errors.push('Valid phone number is required');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    async processPayment(paymentData) {
        const user = window.userManager?.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to make payments');
        }

        const provider = this.providers[paymentData.provider];
        const amount = parseFloat(paymentData.amount);
        const fee = (amount * provider.fees.percentage / 100) + provider.fees.fixed;
        const total = amount + fee;

        // Generate transaction ID
        const transactionId = this.generateTransactionId();

        // Create transaction record
        const transaction = {
            id: transactionId,
            userId: user.id,
            userName: user.name,
            provider: paymentData.provider,
            providerName: provider.name,
            amount: amount,
            fee: fee,
            total: total,
            currency: provider.currency,
            phone: paymentData.phone,
            description: paymentData.description || 'Payment',
            status: 'pending',
            createdAt: new Date().toISOString(),
            escrowEnabled: this.escrowEnabled && paymentData.useEscrow === 'on',
            escrowStatus: this.escrowEnabled && paymentData.useEscrow === 'on' ? 'held' : 'none'
        };

        // Simulate payment processing
        this.showNotification('Processing payment...', 'info');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate PIN entry (in real app, this would integrate with mobile money API)
        const pinValid = await this.simulatePinEntry();

        if (!pinValid) {
            transaction.status = 'failed';
            transaction.failureReason = 'Invalid PIN';
            this.saveTransaction(transaction);
            throw new Error('Payment failed: Invalid PIN');
        }

        // Update transaction status
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString();

        // Save transaction
        this.saveTransaction(transaction);

        // If escrow is enabled, hold the funds
        if (transaction.escrowEnabled) {
            this.holdInEscrow(transaction);
        }

        return transaction;
    }

    async simulatePinEntry() {
        // In a real app, this would integrate with mobile money SDK
        // For simulation, we'll use a simple prompt
        return new Promise((resolve) => {
            // Check if we're in a testing environment
            if (window.isTestEnvironment) {
                resolve(true);
                return;
            }

            // For demo purposes, simulate successful PIN entry 80% of the time
            setTimeout(() => {
                resolve(Math.random() > 0.2);
            }, 1000);
        });
    }

    saveTransaction(transaction) {
        this.transactions.unshift(transaction);
        localStorage.setItem('mkulima_transactions', JSON.stringify(this.transactions));

        // Update user's transaction count
        this.updateUserTransactionCount(transaction.userId);
    }

    updateUserTransactionCount(userId) {
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            users[userIndex].transactionCount = (users[userIndex].transactionCount || 0) + 1;
            localStorage.setItem('mkulima_users', JSON.stringify(users));
        }
    }

    holdInEscrow(transaction) {
        // Create escrow record
        const escrowRecord = {
            transactionId: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            buyerId: transaction.userId,
            buyerName: transaction.userName,
            status: 'held',
            heldAt: new Date().toISOString(),
            releaseConditions: ['delivery_confirmed', 'no_dispute_7days']
        };

        // Save to localStorage
        const escrowRecords = JSON.parse(localStorage.getItem('mkulima_escrow') || '[]');
        escrowRecords.push(escrowRecord);
        localStorage.setItem('mkulima_escrow', JSON.stringify(escrowRecords));

        // Send notification to seller
        this.showNotification('Funds held in escrow. Will be released upon delivery confirmation.', 'info');
    }

    async releaseEscrow(transactionId, reason = 'delivery_confirmed') {
        const escrowRecords = JSON.parse(localStorage.getItem('mkulima_escrow') || '[]');
        const escrowIndex = escrowRecords.findIndex(e => e.transactionId === transactionId);

        if (escrowIndex === -1) {
            throw new Error('Escrow record not found');
        }

        // Update escrow status
        escrowRecords[escrowIndex].status = 'released';
        escrowRecords[escrowIndex].releasedAt = new Date().toISOString();
        escrowRecords[escrowIndex].releaseReason = reason;

        localStorage.setItem('mkulima_escrow', JSON.stringify(escrowRecords));

        // Update transaction
        const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex !== -1) {
            this.transactions[transactionIndex].escrowStatus = 'released';
            localStorage.setItem('mkulima_transactions', JSON.stringify(this.transactions));
        }

        this.showNotification('Escrow funds released to seller', 'success');
    }

    showPaymentReceipt(transaction) {
        // Create receipt modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        modal.innerHTML = `
            <div class="modal receipt-modal">
                <div class="modal-header">
                    <h2>Payment Receipt</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="receipt">
                        <div class="receipt-header">
                            <h3>MKULIMA CONNECT</h3>
                            <p>Payment Receipt</p>
                        </div>
                        <div class="receipt-details">
                            <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                            <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
                            <p><strong>Provider:</strong> ${transaction.providerName}</p>
                            <p><strong>Phone:</strong> ${transaction.phone}</p>
                            <hr>
                            <p><strong>Amount:</strong> ${this.formatCurrency(transaction.amount, transaction.currency)}</p>
                            <p><strong>Fee:</strong> ${this.formatCurrency(transaction.fee, transaction.currency)}</p>
                            <p><strong>Total:</strong> ${this.formatCurrency(transaction.total, transaction.currency)}</p>
                            <hr>
                            <p><strong>Description:</strong> ${transaction.description}</p>
                            <p><strong>Status:</strong> <span class="status-${transaction.status}">${transaction.status.toUpperCase()}</span></p>
                            ${transaction.escrowEnabled ?
                `<p><strong>Escrow:</strong> ${transaction.escrowStatus.toUpperCase()}</p>` : ''}
                        </div>
                        <div class="receipt-footer">
                            <p>Thank you for using Mkulima Connect</p>
                            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.print();">
                                Print Receipt
                            </button>
                            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove();">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add close functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
    }

    generateTransactionId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `TX${timestamp}${random}`;
    }

    formatCurrency(amount, currency) {
        // Simple currency formatting
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const symbol = {
            'USD': '$',
            'TSH': 'TSh ',
            'KES': 'KSh ',
            'UGX': 'USh ',
            'RWF': 'RF '
        }[currency] || '';

        return `${symbol}${formatter.format(amount)}`;
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        }
    }

    // Public API
    getTransactions(userId = null) {
        if (userId) {
            return this.transactions.filter(t => t.userId === userId);
        }
        return this.transactions;
    }

    getTransactionById(id) {
        return this.transactions.find(t => t.id === id);
    }

    getEscrowTransactions() {
        return this.transactions.filter(t => t.escrowEnabled);
    }

    simulateMobileMoneyCallback(transactionId, status) {
        // Simulate a callback from mobile money provider
        const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex === -1) return;

        this.transactions[transactionIndex].status = status;
        localStorage.setItem('mkulima_transactions', JSON.stringify(this.transactions));

        // Show notification
        this.showNotification(`Transaction ${transactionId} status updated to ${status}`, 'info');

        return this.transactions[transactionIndex];
    }

    // SMS payment notification simulation
    async sendSMSNotification(phone, message) {
        // In production, this would call an SMS gateway API
        console.log(`SMS to ${phone}: ${message}`);

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, messageId: 'sms_' + Date.now() };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paymentService = new PaymentService();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentService;
}