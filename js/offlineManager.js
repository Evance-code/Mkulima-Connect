// offlineManager.js - Offline functionality and sync for Mkulima Connect

class OfflineManager {
    constructor() {
        this.offlineQueue = JSON.parse(localStorage.getItem('mkulima_offline_queue') || '[]');
        this.syncInProgress = false;
        this.init();
    }

    init() {
        this.setupOfflineDetection();
        this.setupServiceWorker();
        this.loadOfflineData();
        this.setupSyncButton();
    }

    setupOfflineDetection() {
        // Update online/offline status
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            document.body.classList.toggle('online', isOnline);
            document.body.classList.toggle('offline', !isOnline);

            if (isOnline && this.offlineQueue.length > 0) {
                this.attemptSync();
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial status
        updateOnlineStatus();
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Register service worker for offline functionality
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registered for offline support');

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showNotification('New version available. Refresh to update.', 'info');
                        }
                    });
                });
            }).catch(error => {
                console.error('ServiceWorker registration failed:', error);
            });
        }
    }

    loadOfflineData() {
        // Load critical data for offline use
        this.loadOfflinePrices();
        this.loadOfflineListings();
        this.loadOfflineMessages();
    }

    loadOfflinePrices() {
        // Load cached prices
        const cachedPrices = localStorage.getItem('mkulima_prices');
        if (cachedPrices) {
            window.offlinePrices = JSON.parse(cachedPrices);
        }
    }

    loadOfflineListings() {
        // Load user's listings and recent listings
        const listings = JSON.parse(localStorage.getItem('mkulima_listings') || '[]');
        window.offlineListings = listings.slice(0, 50); // Cache recent 50 listings
    }

    loadOfflineMessages() {
        // Load recent messages
        const messages = JSON.parse(localStorage.getItem('mkulima_messages') || '[]');
        window.offlineMessages = messages.slice(-100); // Cache last 100 messages
    }

    setupSyncButton() {
        const syncButton = document.getElementById('syncButton');
        if (syncButton) {
            syncButton.addEventListener('click', () => this.attemptSync());

            // Update sync button text based on queue
            this.updateSyncButton();
        }
    }

    updateSyncButton() {
        const syncButton = document.getElementById('syncButton');
        if (!syncButton) return;

        if (this.offlineQueue.length > 0) {
            syncButton.textContent = `Sync (${this.offlineQueue.length} pending)`;
            syncButton.disabled = false;
            syncButton.classList.add('has-pending');
        } else {
            syncButton.textContent = 'Up to date';
            syncButton.disabled = true;
            syncButton.classList.remove('has-pending');
        }
    }

    async attemptSync() {
        if (!navigator.onLine || this.syncInProgress || this.offlineQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        this.showNotification('Syncing offline data...', 'info');

        try {
            // Process queue in order
            const results = [];
            for (const item of this.offlineQueue) {
                try {
                    const result = await this.processQueueItem(item);
                    results.push({ ...item, success: true, result });
                } catch (error) {
                    results.push({ ...item, success: false, error: error.message });
                }
            }

            // Remove successful items from queue
            const failedItems = results.filter(item => !item.success);
            this.offlineQueue = failedItems.map(item => {
                const { success, result, error, ...originalItem } = item;
                return originalItem;
            });

            localStorage.setItem('mkulima_offline_queue', JSON.stringify(this.offlineQueue));

            // Show results
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
                this.showNotification(`Synced ${successCount} items successfully`, 'success');
            }
            if (failCount > 0) {
                this.showNotification(`${failCount} items failed to sync`, 'warning');
            }

        } catch (error) {
            console.error('Sync failed:', error);
            this.showNotification('Sync failed. Will retry later.', 'error');
        } finally {
            this.syncInProgress = false;
            this.updateSyncButton();
        }
    }

    async processQueueItem(item) {
        switch (item.type) {
            case 'listing_create':
                return this.syncListingCreate(item.data);
            case 'listing_update':
                return this.syncListingUpdate(item.data);
            case 'message_send':
                return this.syncMessageSend(item.data);
            case 'payment':
                return this.syncPayment(item.data);
            case 'profile_update':
                return this.syncProfileUpdate(item.data);
            default:
                throw new Error(`Unknown queue item type: ${item.type}`);
        }
    }

    async syncListingCreate(listingData) {
        // In production, this would call your API
        console.log('Syncing listing creation:', listingData);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { id: 'remote_' + listingData.id, ...listingData };
    }

    async syncListingUpdate(listingData) {
        console.log('Syncing listing update:', listingData);
        await new Promise(resolve => setTimeout(resolve, 500));
        return listingData;
    }

    async syncMessageSend(messageData) {
        console.log('Syncing message:', messageData);
        await new Promise(resolve => setTimeout(resolve, 300));
        return { ...messageData, serverId: 'msg_' + Date.now() };
    }

    async syncPayment(paymentData) {
        console.log('Syncing payment:', paymentData);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { ...paymentData, confirmed: true };
    }

    async syncProfileUpdate(profileData) {
        console.log('Syncing profile update:', profileData);
        await new Promise(resolve => setTimeout(resolve, 400));
        return profileData;
    }

    addToQueue(type, data) {
        const queueItem = {
            id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type,
            data,
            timestamp: new Date().toISOString(),
            attempts: 0
        };

        this.offlineQueue.push(queueItem);
        localStorage.setItem('mkulima_offline_queue', JSON.stringify(this.offlineQueue));

        this.updateSyncButton();
        this.showNotification('Action saved for offline sync', 'info');

        return queueItem.id;
    }

    // Offline storage with IndexedDB
    async setupIndexedDB() {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB not supported');
            return null;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MkulimaOfflineDB', 1);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores for different data types
                if (!db.objectStoreNames.contains('listings')) {
                    const listingsStore = db.createObjectStore('listings', { keyPath: 'id' });
                    listingsStore.createIndex('farmerId', 'farmerId', { unique: false });
                    listingsStore.createIndex('cropType', 'cropType', { unique: false });
                }

                if (!db.objectStoreNames.contains('messages')) {
                    const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
                    messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('prices')) {
                    const pricesStore = db.createObjectStore('prices', { keyPath: 'id' });
                    pricesStore.createIndex('crop', 'crop', { unique: false });
                    pricesStore.createIndex('market', 'market', { unique: false });
                }
            };
        });
    }

    async saveToIndexedDB(storeName, data) {
        if (!this.db) {
            await this.setupIndexedDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getFromIndexedDB(storeName, key) {
        if (!this.db) {
            await this.setupIndexedDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAllFromIndexedDB(storeName, indexName = null, query = null) {
        if (!this.db) {
            await this.setupIndexedDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            let request;
            if (indexName && query) {
                const index = store.index(indexName);
                request = index.getAll(query);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // SMS fallback for feature phones
    async sendSMSFallback(phoneNumber, message, type = 'alert') {
        // This would integrate with an SMS gateway API
        console.log(`SMS fallback to ${phoneNumber}: ${message}`);

        // Save SMS to queue for sending when online
        const smsItem = {
            type: 'sms',
            phone: phoneNumber,
            message: message.substring(0, 160), // SMS length limit
            timestamp: new Date().toISOString()
        };

        const smsQueue = JSON.parse(localStorage.getItem('mkulima_sms_queue') || '[]');
        smsQueue.push(smsItem);
        localStorage.setItem('mkulima_sms_queue', JSON.stringify(smsQueue));

        return { queued: true, id: smsItem.timestamp };
    }

    // Progressive Web App features
    setupPWAFeatures() {
        // Add to home screen prompt
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show install button
            this.showInstallPrompt();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            this.showNotification('App installed successfully!', 'success');
        });
    }

    showInstallPrompt() {
        const installButton = document.getElementById('installButton');
        if (!installButton) return;

        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted install');
            }

            deferredPrompt = null;
            installButton.style.display = 'none';
        });
    }

    // Cache management
    async clearOldCache() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                const currentCache = 'mkulima-cache-v1';

                for (const cacheName of cacheNames) {
                    if (cacheName !== currentCache) {
                        await caches.delete(cacheName);
                        console.log('Cleared old cache:', cacheName);
                    }
                }
            } catch (error) {
                console.error('Cache cleanup failed:', error);
            }
        }
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        }
    }

    // Public API
    getOfflineQueue() {
        return this.offlineQueue;
    }

    clearOfflineQueue() {
        this.offlineQueue = [];
        localStorage.setItem('mkulima_offline_queue', JSON.stringify(this.offlineQueue));
        this.updateSyncButton();
    }

    isSyncInProgress() {
        return this.syncInProgress;
    }

    async syncData() {
        return this.attemptSync();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.offlineManager = new OfflineManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
}