// listingManager.js - Produce listings CRUD operations for Mkulima Connect

class ListingManager {
    constructor() {
        this.listings = JSON.parse(localStorage.getItem('mkulima_listings') || '[]');
        this.categories = JSON.parse(localStorage.getItem('mkulima_categories') || '[]');
        this.init();
    }

    init() {
        this.loadCategories();
        this.setupEventListeners();
        this.renderListings();
    }

    loadCategories() {
        // Load crop categories from JSON or create defaults
        if (this.categories.length === 0) {
            this.categories = [
                { id: 'maize', name: 'Maize', unit: 'bags', grades: ['A', 'B', 'C'] },
                { id: 'beans', name: 'Beans', unit: 'kg', grades: ['A', 'B', 'C'] },
                { id: 'rice', name: 'Rice', unit: 'kg', grades: ['A', 'B', 'C'] },
                { id: 'coffee', name: 'Coffee', unit: 'kg', grades: ['AA', 'A', 'B'] },
                { id: 'vegetables', name: 'Vegetables', unit: 'kg', grades: ['Fresh', 'Grade A', 'Grade B'] }
            ];
            localStorage.setItem('mkulima_categories', JSON.stringify(this.categories));
        }
    }

    setupEventListeners() {
        // Listing form submission
        const listingForm = document.getElementById('listingForm');
        if (listingForm) {
            listingForm.addEventListener('submit', (e) => this.handleCreateListing(e));
        }

        // Search functionality
        const searchInput = document.getElementById('searchListings');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Filter controls
        const filterControls = document.querySelectorAll('.filter-control');
        filterControls.forEach(control => {
            control.addEventListener('change', () => this.applyFilters());
        });
    }

    async handleCreateListing(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const listingData = Object.fromEntries(formData);

        try {
            // Validate listing data
            this.validateListing(listingData);

            // Create listing
            const listing = await this.createListing(listingData);

            // Clear form
            e.target.reset();

            // Show success message
            this.showNotification('Listing created successfully!', 'success');

            // Refresh listings display
            this.renderListings();

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    validateListing(data) {
        const errors = [];

        if (!data.cropType) errors.push('Crop type is required');
        if (!data.quantity || data.quantity <= 0) errors.push('Valid quantity is required');
        if (!data.price || data.price <= 0) errors.push('Valid price is required');
        if (!data.location) errors.push('Location is required');

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    async createListing(listingData) {
        // Get current user
        const user = window.userManager?.getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to create a listing');
        }

        // Create listing object
        const listing = {
            id: this.generateListingId(),
            farmerId: user.id,
            farmerName: user.name,
            farmerLocation: user.location,
            ...listingData,
            status: 'available',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: 0,
            inquiries: 0,
            isNegotiable: listingData.isNegotiable === 'on'
        };

        // Add to listings
        this.listings.unshift(listing); // Add to beginning
        localStorage.setItem('mkulima_listings', JSON.stringify(this.listings));

        // Update user's listing count
        this.updateUserListingCount(user.id);

        return listing;
    }

    async updateListing(listingId, updates) {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);

        if (listingIndex === -1) {
            throw new Error('Listing not found');
        }

        // Check if user owns the listing
        const user = window.userManager?.getCurrentUser();
        if (this.listings[listingIndex].farmerId !== user.id) {
            throw new Error('You can only edit your own listings');
        }

        // Update listing
        this.listings[listingIndex] = {
            ...this.listings[listingIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('mkulima_listings', JSON.stringify(this.listings));

        this.showNotification('Listing updated successfully', 'success');
        this.renderListings();
    }

    async deleteListing(listingId) {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);

        if (listingIndex === -1) {
            throw new Error('Listing not found');
        }

        // Check if user owns the listing
        const user = window.userManager?.getCurrentUser();
        if (this.listings[listingIndex].farmerId !== user.id) {
            throw new Error('You can only delete your own listings');
        }

        // Remove listing
        this.listings.splice(listingIndex, 1);
        localStorage.setItem('mkulima_listings', JSON.stringify(this.listings));

        // Update user's listing count
        this.updateUserListingCount(user.id, -1);

        this.showNotification('Listing deleted successfully', 'success');
        this.renderListings();
    }

    updateUserListingCount(userId, delta = 1) {
        const users = JSON.parse(localStorage.getItem('mkulima_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            users[userIndex].listingCount = (users[userIndex].listingCount || 0) + delta;
            localStorage.setItem('mkulima_users', JSON.stringify(users));
        }
    }

    handleSearch(searchTerm) {
        const filtered = this.listings.filter(listing =>
            listing.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderListings(filtered);
    }

    applyFilters() {
        const cropFilter = document.getElementById('filterCrop')?.value;
        const regionFilter = document.getElementById('filterRegion')?.value;
        const priceFilter = document.getElementById('filterPrice')?.value;
        const qualityFilter = document.getElementById('filterQuality')?.value;

        let filtered = this.listings;

        if (cropFilter) {
            filtered = filtered.filter(l => l.cropType === cropFilter);
        }

        if (regionFilter) {
            filtered = filtered.filter(l => l.location.includes(regionFilter));
        }

        if (priceFilter) {
            const maxPrice = parseInt(priceFilter);
            filtered = filtered.filter(l => parseInt(l.price) <= maxPrice);
        }

        if (qualityFilter) {
            filtered = filtered.filter(l => l.quality === qualityFilter);
        }

        this.renderListings(filtered);
    }

    renderListings(listingsToRender = null) {
        const container = document.getElementById('listingGrid');
        const activeListings = document.getElementById('activeListings');

        const listings = listingsToRender || this.listings;

        // Render in main grid
        if (container) {
            container.innerHTML = '';

            if (listings.length === 0) {
                container.innerHTML = '<div class="no-listings">No listings found</div>';
                return;
            }

            listings.forEach(listing => {
                const listingCard = this.createListingCard(listing);
                container.appendChild(listingCard);
            });
        }

        // Render in user's active listings
        if (activeListings) {
            const user = window.userManager?.getCurrentUser();
            if (user) {
                const userListings = listings.filter(l => l.farmerId === user.id);
                activeListings.innerHTML = '';

                userListings.forEach(listing => {
                    const listingItem = this.createListingItem(listing);
                    activeListings.appendChild(listingItem);
                });
            }
        }
    }

    createListingCard(listing) {
        const card = document.createElement('div');
        card.className = 'listing-card';
        card.dataset.id = listing.id;

        const cropName = this.categories.find(c => c.id === listing.cropType)?.name || listing.cropType;
        const priceFormatted = window.mkulimaApp?.formatCurrency(listing.price, 'TSH') || `${listing.price} TSH`;
        const date = new Date(listing.createdAt).toLocaleDateString();

        card.innerHTML = `
            <div class="listing-image">
                <img src="${listing.imageUrl || 'images/default-crop.jpg'}" alt="${cropName}" onerror="this.src='images/default-crop.jpg'">
            </div>
            <div class="listing-details">
                <div class="listing-header">
                    <h3>${cropName}</h3>
                    <span class="listing-status ${listing.status}">${listing.status}</span>
                </div>
                <p><strong>Quantity:</strong> ${listing.quantity} ${listing.unit || 'kg'}</p>
                <p><strong>Price:</strong> ${priceFormatted} per ${listing.unit || 'kg'}</p>
                <p><strong>Location:</strong> ${listing.location}</p>
                <p><strong>Quality:</strong> ${listing.quality || 'Not specified'}</p>
                <p><strong>Listed:</strong> ${date}</p>
                <div class="listing-actions">
                    <button class="btn btn-sm btn-primary" onclick="listingManager.viewListing('${listing.id}')">
                        View Details
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="listingManager.contactFarmer('${listing.id}')">
                        Contact Farmer
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    createListingItem(listing) {
        const item = document.createElement('div');
        item.className = 'listing-item';
        item.dataset.id = listing.id;

        const cropName = this.categories.find(c => c.id === listing.cropType)?.name || listing.cropType;
        const priceFormatted = window.mkulimaApp?.formatCurrency(listing.price, 'TSH') || `${listing.price} TSH`;

        item.innerHTML = `
            <div class="item-info">
                <h4>${cropName} - ${listing.quantity} ${listing.unit || 'kg'}</h4>
                <p>${priceFormatted} • ${listing.location}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-sm" onclick="listingManager.editListing('${listing.id}')">Edit</button>
                <button class="btn btn-sm btn-outline" onclick="listingManager.deleteListing('${listing.id}')">Delete</button>
            </div>
        `;

        return item;
    }

    viewListing(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) return;

        // Create modal with listing details
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const cropName = this.categories.find(c => c.id === listing.cropType)?.name || listing.cropType;
        const priceFormatted = window.mkulimaApp?.formatCurrency(listing.price, 'TSH') || `${listing.price} TSH`;
        const date = new Date(listing.createdAt).toLocaleDateString();

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${cropName} Listing</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="listing-detail">
                        <img src="${listing.imageUrl || 'images/default-crop.jpg'}" alt="${cropName}">
                        <div class="detail-info">
                            <p><strong>Farmer:</strong> ${listing.farmerName}</p>
                            <p><strong>Location:</strong> ${listing.location}</p>
                            <p><strong>Quantity:</strong> ${listing.quantity} ${listing.unit || 'kg'}</p>
                            <p><strong>Price:</strong> ${priceFormatted} per ${listing.unit || 'kg'}</p>
                            <p><strong>Quality Grade:</strong> ${listing.quality || 'Not specified'}</p>
                            <p><strong>Description:</strong> ${listing.description || 'No description'}</p>
                            <p><strong>Harvest Date:</strong> ${listing.harvestDate || 'Not specified'}</p>
                            <p><strong>Listed on:</strong> ${date}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="listingManager.contactFarmer('${listing.id}')">
                        Contact Farmer
                    </button>
                    <button class="btn btn-secondary" onclick="window.mkulimaApp.closeAllModals()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add close functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Track view
        this.trackListingView(listingId);
    }

    trackListingView(listingId) {
        const listingIndex = this.listings.findIndex(l => l.id === listingId);
        if (listingIndex !== -1) {
            this.listings[listingIndex].views = (this.listings[listingIndex].views || 0) + 1;
            localStorage.setItem('mkulima_listings', JSON.stringify(this.listings));
        }
    }

    contactFarmer(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) return;

        // Navigate to messages page or open chat
        if (window.location.pathname.includes('messages.html')) {
            // Start new conversation
            if (window.messagingManager) {
                window.messagingManager.startConversation(listing.farmerId, `Regarding your ${listing.cropType} listing`);
            }
        } else {
            window.location.href = `messages.html?contact=${listing.farmerId}`;
        }
    }

    editListing(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) return;

        // Populate form with listing data
        Object.keys(listing).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = listing[key];
                } else {
                    input.value = listing[key];
                }
            }
        });

        // Change form to update mode
        const form = document.getElementById('listingForm');
        if (form) {
            form.dataset.mode = 'update';
            form.dataset.listingId = listingId;

            // Change submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Update Listing';
            }
        }
    }

    generateListingId() {
        return 'lst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        } else {
            alert(`${type}: ${message}`);
        }
    }

    // Public API
    getListings(filters = {}) {
        let filtered = this.listings;

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                filtered = filtered.filter(listing => {
                    if (key === 'maxPrice') {
                        return listing.price <= value;
                    }
                    if (key === 'minPrice') {
                        return listing.price >= value;
                    }
                    return listing[key] === value;
                });
            }
        });

        return filtered;
    }

    getListingById(id) {
        return this.listings.find(l => l.id === id);
    }

    getUserListings(userId) {
        return this.listings.filter(l => l.farmerId === userId);
    }

    getCategories() {
        return this.categories;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.listingManager = new ListingManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ListingManager;
}