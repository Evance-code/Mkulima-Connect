// marketData.js - Price fetching and processing for Mkulima Connect

class MarketDataManager {
    constructor() {
        this.cachedPrices = JSON.parse(localStorage.getItem('mkulima_prices') || '{}');
        this.cachedTime = localStorage.getItem('mkulima_prices_timestamp');
        this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
        this.worldBankAPI = 'https://api.worldbank.org/v2/datasets';
        this.localMarketAPI = '/api/local-prices'; // Mock endpoint
        this.init();
    }

    init() {
        // Check if cache is expired
        if (this.isCacheExpired()) {
            this.fetchLatestPrices();
        } else {
            this.updateUIWithCachedData();
        }

        // Set up periodic updates (every 5 minutes if online)
        if (navigator.onLine) {
            setInterval(() => {
                this.fetchLatestPrices();
            }, 5 * 60 * 1000);
        }
    }

    isCacheExpired() {
        if (!this.cachedTime) return true;
        const now = Date.now();
        const cacheAge = now - parseInt(this.cachedTime);
        return cacheAge > this.CACHE_DURATION;
    }

    async fetchLatestPrices() {
        if (!navigator.onLine) {
            console.log('Offline - cannot fetch latest prices');
            return;
        }

        try {
            this.showLoading(true);

            // Fetch from World Bank API for global prices
            const globalPrices = await this.fetchWorldBankData();

            // Fetch local market prices (mock data for now)
            const localPrices = await this.fetchLocalMarketData();

            // Combine and process data
            const allPrices = this.processPriceData(globalPrices, localPrices);

            // Update cache
            this.updateCache(allPrices);

            // Update UI
            this.updateUIWithPrices(allPrices);

            this.showNotification('Market prices updated', 'success');

        } catch (error) {
            console.error('Error fetching market data:', error);
            this.showNotification('Failed to update prices. Using cached data.', 'error');
            this.updateUIWithCachedData();
        } finally {
            this.showLoading(false);
        }
    }

    async fetchWorldBankData() {
        // World Bank Commodity Prices API
        // Note: This is a simplified example. Actual API may require different parameters
        const commodities = ['maize', 'wheat', 'rice', 'beans', 'coffee'];
        const requests = commodities.map(commodity =>
            fetch(`${this.worldBankAPI}/commodity-prices?format=json&commodity=${commodity}&per_page=1`)
                .then(response => response.json())
                .then(data => ({
                    commodity,
                    price: data[1]?.[0]?.value || null,
                    date: data[1]?.[0]?.date || null,
                    unit: 'USD/MT'
                }))
                .catch(() => null)
        );

        const results = await Promise.allSettled(requests);
        return results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
    }

    async fetchLocalMarketData() {
        // Mock local market data - in production, this would call your backend
        const mockData = [
            { crop: 'maize', market: 'Arusha', price: 850, unit: 'TSH/kg', change: 2.5 },
            { crop: 'beans', market: 'Nairobi', price: 120, unit: 'KES/kg', change: -1.2 },
            { crop: 'rice', market: 'Kampala', price: 3000, unit: 'UGX/kg', change: 0.5 },
            { crop: 'maize', market: 'Dodoma', price: 800, unit: 'TSH/kg', change: 1.8 },
            { crop: 'coffee', market: 'Kigali', price: 2500, unit: 'RWF/kg', change: 3.2 }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return mockData;
    }

    processPriceData(globalPrices, localPrices) {
        const processed = {
            global: globalPrices,
            local: localPrices,
            summary: this.createPriceSummary(localPrices),
            trends: this.calculateTrends(localPrices)
        };

        return processed;
    }

    createPriceSummary(prices) {
        const summary = {};

        prices.forEach(item => {
            if (!summary[item.crop]) {
                summary[item.crop] = {
                    min: item.price,
                    max: item.price,
                    avg: item.price,
                    markets: [],
                    lastUpdated: new Date().toISOString()
                };
            }

            summary[item.crop].min = Math.min(summary[item.crop].min, item.price);
            summary[item.crop].max = Math.max(summary[item.crop].max, item.price);
            summary[item.crop].markets.push({
                name: item.market,
                price: item.price,
                change: item.change
            });
        });

        // Calculate averages
        Object.keys(summary).forEach(crop => {
            const prices = summary[crop].markets.map(m => m.price);
            summary[crop].avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        });

        return summary;
    }

    calculateTrends(prices) {
        // Simple trend calculation based on price changes
        const trends = {};

        prices.forEach(item => {
            if (!trends[item.crop]) {
                trends[item.crop] = {
                    direction: item.change >= 0 ? 'up' : 'down',
                    magnitude: Math.abs(item.change),
                    confidence: 0.8 // Mock confidence score
                };
            }
        });

        return trends;
    }

    updateCache(prices) {
        this.cachedPrices = prices;
        this.cachedTime = Date.now().toString();

        localStorage.setItem('mkulima_prices', JSON.stringify(prices));
        localStorage.setItem('mkulima_prices_timestamp', this.cachedTime);
    }

    updateUIWithPrices(prices) {
        // Update price table if exists
        const priceTable = document.getElementById('priceData');
        if (priceTable) {
            this.renderPriceTable(prices.local, priceTable);
        }

        // Update price ticker if exists
        const ticker = document.getElementById('priceTicker');
        if (ticker) {
            this.renderPriceTicker(prices.summary, ticker);
        }

        // Update dashboard stats
        this.updateDashboardStats(prices);
    }

    updateUIWithCachedData() {
        if (Object.keys(this.cachedPrices).length > 0) {
            this.updateUIWithPrices(this.cachedPrices);
        }
    }

    renderPriceTable(prices, container) {
        container.innerHTML = '';

        prices.forEach(item => {
            const row = document.createElement('tr');
            const changeClass = item.change >= 0 ? 'trend-up' : 'trend-down';
            const changeSymbol = item.change >= 0 ? '↗' : '↘';

            row.innerHTML = `
                <td>${this.formatCropName(item.crop)}</td>
                <td>${item.market}</td>
                <td>${this.formatPrice(item.price, item.unit)}</td>
                <td class="${changeClass}">${changeSymbol} ${Math.abs(item.change)}%</td>
                <td>${new Date().toLocaleTimeString()}</td>
            `;

            container.appendChild(row);
        });
    }

    renderPriceTicker(summary, container) {
        container.innerHTML = '';

        Object.entries(summary).forEach(([crop, data]) => {
            const tickerItem = document.createElement('span');
            tickerItem.className = 'ticker-item';
            tickerItem.innerHTML = `
                <strong>${this.formatCropName(crop)}:</strong> 
                ${this.formatPrice(data.avg, 'TSH/kg')} 
                <small>(${data.markets.length} markets)</small>
            `;
            container.appendChild(tickerItem);
        });
    }

    updateDashboardStats(prices) {
        // Update any dashboard statistics
        const statElements = {
            'bestPrice': this.findBestPrice(prices.local),
            'averagePrice': this.calculateOverallAverage(prices.local),
            'totalMarkets': new Set(prices.local.map(p => p.market)).size
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    findBestPrice(prices) {
        if (prices.length === 0) return 'N/A';
        const best = prices.reduce((prev, current) =>
            prev.price > current.price ? prev : current
        );
        return `${best.crop}: ${this.formatPrice(best.price, best.unit)}`;
    }

    calculateOverallAverage(prices) {
        if (prices.length === 0) return 'N/A';
        const total = prices.reduce((sum, item) => sum + item.price, 0);
        return this.formatPrice(total / prices.length, 'TSH/kg');
    }

    formatCropName(crop) {
        const names = {
            'maize': 'Maize',
            'beans': 'Beans',
            'rice': 'Rice',
            'coffee': 'Coffee',
            'wheat': 'Wheat'
        };
        return names[crop] || crop.charAt(0).toUpperCase() + crop.slice(1);
    }

    formatPrice(price, unit) {
        // Format based on currency
        if (unit.includes('USD')) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
            }).format(price);
        } else if (unit.includes('TSH')) {
            return `${price.toLocaleString()} TSH`;
        } else if (unit.includes('KES')) {
            return `${price.toLocaleString()} KES`;
        } else if (unit.includes('UGX')) {
            return `${price.toLocaleString()} UGX`;
        } else if (unit.includes('RWF')) {
            return `${price.toLocaleString()} RWF`;
        }
        return `${price} ${unit}`;
    }

    showLoading(show) {
        const loader = document.getElementById('priceLoader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showNotification(message, type) {
        if (window.mkulimaApp && window.mkulimaApp.showNotification) {
            window.mkulimaApp.showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    // Public API for other modules
    getCurrentPrices() {
        return this.cachedPrices;
    }

    getCropPriceHistory(crop, days = 30) {
        // Mock historical data - in production, fetch from API
        const history = [];
        const basePrice = this.cachedPrices.local
            .filter(p => p.crop === crop)
            .reduce((avg, p) => avg + p.price, 0) / 3 || 100;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Add some random variation
            const variation = (Math.random() - 0.5) * 20;
            const price = basePrice + variation;

            history.push({
                date: date.toISOString().split('T')[0],
                price: Math.max(price, 50) // Ensure positive price
            });
        }

        return history;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketDataManager = new MarketDataManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketDataManager;
}