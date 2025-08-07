class CurrencyConverter {
    constructor() {
        this.apiKey = 'MY_API';
        this.apiUrl = 'https://v6.exchangerate-api.com/v6';
        this.ratesCache = {};
        this.currencyList = {};
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadCurrencies();
    }
    
    initializeElements() {
        this.amountInput = document.getElementById('amount');
        this.fromCurrencySelect = document.getElementById('fromCurrency');
        this.toCurrencySelect = document.getElementById('toCurrency');
        this.convertBtn = document.getElementById('convertBtn');
        this.swapBtn = document.getElementById('swapBtn');
        this.resultDiv = document.getElementById('result');
        this.conversionResult = document.getElementById('conversionResult');
        this.exchangeRate = document.getElementById('exchangeRate');
        this.lastUpdated = document.getElementById('lastUpdated');
        this.errorDiv = document.getElementById('error');
        this.loadingDiv = document.getElementById('loading');
    }
    
    initializeEventListeners() {
        this.convertBtn.addEventListener('click', () => this.convertCurrency());
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        
        // Auto-convert when inputs change
        this.amountInput.addEventListener('input', () => this.debounceConvert());
        this.fromCurrencySelect.addEventListener('change', () => this.convertCurrency());
        this.toCurrencySelect.addEventListener('change', () => this.convertCurrency());
        
        // Enter key support
        this.amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertCurrency();
        });
    }
    
    debounceConvert() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.convertCurrency(), 500);
    }
    
    async loadCurrencies() {
        try {
            this.showLoading(true);
            
            // For demonstration, we'll use a free API without key requirement
            // You can replace this with ExchangeRate-API if you have a key
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.rates) {
                this.populateCurrencySelects(Object.keys(data.rates));
                this.setDefaultCurrencies();
            } else {
                throw new Error('Failed to fetch currency codes');
            }
        } catch (error) {
            this.showError('Failed to load currencies. Please refresh the page.');
            console.error('Error loading currencies:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    populateCurrencySelects(currencies) {
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
        
        // Add USD to the list if not present
        if (!currencies.includes('USD')) {
            currencies.unshift('USD');
        }
        
        // Sort currencies: popular first, then alphabetical
        const sortedCurrencies = currencies.sort((a, b) => {
            const aPopular = popularCurrencies.includes(a);
            const bPopular = popularCurrencies.includes(b);
            
            if (aPopular && !bPopular) return -1;
            if (!aPopular && bPopular) return 1;
            if (aPopular && bPopular) {
                return popularCurrencies.indexOf(a) - popularCurrencies.indexOf(b);
            }
            return a.localeCompare(b);
        });
        
        sortedCurrencies.forEach(code => {
            const option1 = new Option(code, code);
            const option2 = new Option(code, code);
            
            this.fromCurrencySelect.appendChild(option1);
            this.toCurrencySelect.appendChild(option2);
        });
    }
    
    setDefaultCurrencies() {
        this.fromCurrencySelect.value = 'EUR';
        this.toCurrencySelect.value = 'USD';
        this.amountInput.value = '1';
    }
    
    async convertCurrency() {
        const amount = parseFloat(this.amountInput.value);
        const fromCurrency = this.fromCurrencySelect.value;
        const toCurrency = this.toCurrencySelect.value;
        
        // Validation
        if (!amount || amount <= 0) {
            this.hideResult();
            return;
        }
        
        if (!fromCurrency || !toCurrency) {
            this.showError('Please select both currencies');
            return;
        }
        
        if (fromCurrency === toCurrency) {
            this.displayResult(amount, amount, fromCurrency, toCurrency, 1);
            return;
        }
        
        try {
            this.showLoading(true);
            this.hideError();
            
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            const convertedAmount = amount * rate;
            
            this.displayResult(amount, convertedAmount, fromCurrency, toCurrency, rate);
        } catch (error) {
            this.showError('Conversion failed. Please try again.');
            console.error('Conversion error:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    async getExchangeRate(from, to) {
        const cacheKey = `${from}-${to}`;
        const cached = this.ratesCache[cacheKey];
        
        // Use cached rate if less than 5 minutes old
        if (cached && (Date.now() - cached.timestamp) < 300000) {
            return cached.rate;
        }
        
        // Using free API for demonstration
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.rates || !data.rates[to]) {
            throw new Error('Exchange rate not found');
        }
        
        const rate = data.rates[to];
        
        // Cache the rate
        this.ratesCache[cacheKey] = {
            rate: rate,
            timestamp: Date.now()
        };
        
        return rate;
    }
    
    displayResult(amount, convertedAmount, fromCurrency, toCurrency, rate) {
        this.conversionResult.textContent = 
            `${this.formatCurrency(amount, fromCurrency)} = ${this.formatCurrency(convertedAmount, toCurrency)}`;
        
        this.exchangeRate.textContent = 
            `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`;
        
        this.lastUpdated.textContent = 
            `Last updated: ${new Date().toLocaleTimeString()}`;
        
        this.showResult();
    }
    
    formatCurrency(amount, currency) {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            }).format(amount);
        } catch (error) {
            // Fallback if currency formatting fails
            return `${currency} ${amount.toFixed(2)}`;
        }
    }
    
    swapCurrencies() {
        const fromValue = this.fromCurrencySelect.value;
        const toValue = this.toCurrencySelect.value;
        
        this.fromCurrencySelect.value = toValue;
        this.toCurrencySelect.value = fromValue;
        
        if (this.amountInput.value && fromValue && toValue) {
            this.convertCurrency();
        }
    }
    
    showResult() {
        this.resultDiv.style.display = 'block';
        this.hideError();
    }
    
    hideResult() {
        this.resultDiv.style.display = 'none';
    }
    
    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.style.display = 'block';
        this.hideResult();
    }
    
    hideError() {
        this.errorDiv.style.display = 'none';
    }
    
    showLoading(show) {
        this.loadingDiv.style.display = show ? 'block' : 'none';
        this.convertBtn.disabled = show;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});
