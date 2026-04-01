
        // PWA Installation
        let deferredPrompt;
        const SCENARIO_STORAGE_KEY = 'veecasa-deal-analyzer-scenarios';
        let lastAnalysisSnapshot = null;

        function initLeadFormTimer() {
            const startedAt = document.getElementById('formStartedAt');
            if (startedAt) {
                startedAt.value = String(Date.now());
            }
        }

        async function submitLeadForm(payload) {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body.error || 'Unable to submit your request right now.');
            }

            return body;
        }

        async function handleLeadSubmit(event) {
            event.preventDefault();

            const statusEl = document.getElementById('leadStatus');
            const form = event.currentTarget;
            const formData = new FormData(form);
            statusEl.className = 'lead-status';
            statusEl.textContent = '';

            const payload = {
                name: String(formData.get('name') || '').trim(),
                email: String(formData.get('email') || '').trim(),
                phone: String(formData.get('phone') || '').trim(),
                goal: String(formData.get('goal') || '').trim(),
                notes: String(formData.get('notes') || '').trim(),
                website: String(formData.get('website') || '').trim(),
                startedAt: Number(formData.get('startedAt') || 0)
            };

            if (!payload.name || !payload.email || !payload.goal) {
                statusEl.classList.add('error');
                statusEl.textContent = 'Please complete name, email, and loan goal.';
                return;
            }

            try {
                await submitLeadForm(payload);
                statusEl.classList.add('success');
                statusEl.textContent = 'Thanks. A VeeCasa specialist will follow up shortly.';
                form.reset();
                initLeadFormTimer();
            } catch (error) {
                statusEl.classList.add('error');
                statusEl.textContent = error.message;
            }
        }
        
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('data:text/javascript,' + encodeURIComponent(`
                    const CACHE_NAME = 'veecasa-re-v1';
                    const urlsToCache = [
                        '/',
                        '/index.html'
                    ];

                    self.addEventListener('install', event => {
                        event.waitUntil(
                            caches.open(CACHE_NAME)
                                .then(cache => cache.addAll(urlsToCache))
                        );
                    });

                    self.addEventListener('fetch', event => {
                        event.respondWith(
                            caches.match(event.request)
                                .then(response => response || fetch(event.request))
                        );
                    });
                `));
            });
        }

        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallBanner();
        });

        function showInstallBanner() {
            const banner = document.getElementById('installBanner');
            if (banner && !localStorage.getItem('installDismissed')) {
                setTimeout(() => {
                    banner.classList.add('show');
                }, 2000);
            }
        }

        function installApp() {
            const banner = document.getElementById('installBanner');
            banner.classList.remove('show');
            
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                });
            }
        }

        function dismissInstall() {
            const banner = document.getElementById('installBanner');
            banner.classList.remove('show');
            localStorage.setItem('installDismissed', 'true');
        }

        // Property Search Functionality
        function searchProperties() {
            const location = document.getElementById('searchLocation').value;
            const propertyType = document.getElementById('propertyType').value;
            const priceRange = document.getElementById('priceRange').value;
            const bedrooms = document.getElementById('bedrooms').value;

            if (!location) {
                alert('Please enter a location to search');
                return;
            }

            // Show loading state
            document.getElementById('searchResults').style.display = 'block';
            document.getElementById('searchLoading').classList.add('active');
            document.getElementById('propertyList').innerHTML = '';

            // Simulate API call with sample data
            setTimeout(() => {
                const sampleProperties = generateSampleProperties(location, propertyType, priceRange);
                displaySearchResults(sampleProperties);
                document.getElementById('searchLoading').classList.remove('active');
            }, 1500);
        }

        function generateSampleProperties(location, type, priceRange) {
            // Generate sample properties based on search criteria
            const properties = [
                {
                    address: `${Math.floor(Math.random() * 900) + 100} Oak Street, ${location}`,
                    price: 385000,
                    rent: 2650,
                    capRate: 6.8,
                    beds: 3,
                    baths: 2,
                    sqft: 1850
                },
                {
                    address: `${Math.floor(Math.random() * 900) + 100} Maple Avenue, ${location}`,
                    price: 425000,
                    rent: 2900,
                    capRate: 7.2,
                    beds: 4,
                    baths: 2.5,
                    sqft: 2200
                },
                {
                    address: `${Math.floor(Math.random() * 900) + 100} Pine Court, ${location}`,
                    price: 320000,
                    rent: 2400,
                    capRate: 7.5,
                    beds: 3,
                    baths: 2,
                    sqft: 1650
                },
                {
                    address: `${Math.floor(Math.random() * 900) + 100} Cedar Lane, ${location}`,
                    price: 475000,
                    rent: 3200,
                    capRate: 6.5,
                    beds: 4,
                    baths: 3,
                    sqft: 2500
                },
                {
                    address: `${Math.floor(Math.random() * 900) + 100} Elm Street, ${location}`,
                    price: 355000,
                    rent: 2550,
                    capRate: 7.0,
                    beds: 3,
                    baths: 2,
                    sqft: 1750
                }
            ];

            return properties;
        }

        function displaySearchResults(properties) {
            const propertyList = document.getElementById('propertyList');
            propertyList.innerHTML = '<h3 style="margin-bottom: 15px;">Found ' + properties.length + ' Comparable Properties</h3>';

            properties.forEach(property => {
                const card = document.createElement('div');
                card.className = 'property-card';
                card.innerHTML = `
                    <div class="property-info">
                        <h4>${property.address}</h4>
                        <p>${property.beds} beds • ${property.baths} baths • ${property.sqft} sq ft</p>
                        <div class="property-metrics">
                            <div class="metric">
                                <div class="metric-label">Price</div>
                                <div class="metric-value">${formatCurrency(property.price)}</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Est. Rent</div>
                                <div class="metric-value">${formatCurrency(property.rent)}/mo</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Cap Rate</div>
                                <div class="metric-value">${property.capRate}%</div>
                            </div>
                        </div>
                    </div>
                    <button class="use-btn" onclick="useProperty(${property.price}, ${property.rent})">
                        Use This Data
                    </button>
                `;
                propertyList.appendChild(card);
            });
        }

        function useProperty(price, rent) {
            document.getElementById('purchasePrice').value = price;
            document.getElementById('monthlyRent').value = rent;
            calculateAll();
            
            // Scroll to analysis section
            document.getElementById('analyze').scrollIntoView({ behavior: 'smooth' });
        }

        // Tab functionality - Fixed
        function showTab(event, tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            if (event && event.target) {
                event.target.classList.add('active');
            }
        }

        // Calculation functions
        function calculateMortgagePayment(principal, rate, years) {
            const monthlyRate = rate / 100 / 12;
            const numPayments = years * 12;
            
            if (monthlyRate === 0) {
                return principal / numPayments;
            }
            
            const payment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                (Math.pow(1 + monthlyRate, numPayments) - 1);
            
            return payment;
        }

        function formatCurrency(value) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }

        function formatPercent(value) {
            return value.toFixed(2) + '%';
        }

        function getInputSnapshot() {
            return {
                purchasePrice: parseFloat(document.getElementById('purchasePrice').value) || 0,
                downPaymentPercent: parseFloat(document.getElementById('downPaymentPercent').value) || 20,
                interestRate: parseFloat(document.getElementById('interestRate').value) || 7,
                loanTerm: parseInt(document.getElementById('loanTerm').value, 10) || 30,
                appreciationRate: parseFloat(document.getElementById('appreciationRate').value) || 3,
                closingCosts: parseFloat(document.getElementById('closingCosts').value) || 0,
                monthlyRent: parseFloat(document.getElementById('monthlyRent').value) || 0,
                rentIncrease: parseFloat(document.getElementById('rentIncrease').value) || 3,
                vacancyRate: parseFloat(document.getElementById('vacancyRate').value) || 5,
                managementFee: parseFloat(document.getElementById('managementFee').value) || 8,
                propertyTax: parseFloat(document.getElementById('propertyTax').value) || 0,
                insurance: parseFloat(document.getElementById('insurance').value) || 0,
                hoaFees: parseFloat(document.getElementById('hoaFees').value) || 0,
                maintenance: parseFloat(document.getElementById('maintenance').value) || 0,
                utilities: parseFloat(document.getElementById('utilities').value) || 0,
                otherExpenses: parseFloat(document.getElementById('otherExpenses').value) || 0
            };
        }

        function applyInputSnapshot(snapshot) {
            Object.entries(snapshot).forEach(([key, value]) => {
                const el = document.getElementById(key);
                if (el) {
                    el.value = value;
                }
            });
        }

        function getSavedScenarios() {
            try {
                const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch (_error) {
                return [];
            }
        }

        function setSavedScenarios(scenarios) {
            localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenarios));
        }

        function refreshScenarioList() {
            const list = document.getElementById('scenarioList');
            if (!list) return;

            const scenarios = getSavedScenarios();
            list.innerHTML = '<option value="">Select a saved scenario</option>';

            scenarios.forEach((scenario) => {
                const option = document.createElement('option');
                option.value = scenario.id;
                option.textContent = `${scenario.name} (${new Date(scenario.updatedAt).toLocaleDateString()})`;
                list.appendChild(option);
            });
        }

        function saveScenario() {
            const nameInput = document.getElementById('scenarioName');
            const name = (nameInput.value || '').trim();
            if (!name) {
                alert('Enter a scenario name before saving.');
                return;
            }

            const scenarios = getSavedScenarios();
            const snapshot = getInputSnapshot();
            const existingIndex = scenarios.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
            const payload = {
                id: existingIndex >= 0 ? scenarios[existingIndex].id : `scenario-${Date.now()}`,
                name,
                updatedAt: new Date().toISOString(),
                inputs: snapshot
            };

            if (existingIndex >= 0) {
                scenarios[existingIndex] = payload;
            } else {
                scenarios.push(payload);
            }

            setSavedScenarios(scenarios);
            refreshScenarioList();
            document.getElementById('scenarioList').value = payload.id;
            alert('Scenario saved.');
        }

        function loadSelectedScenario() {
            const selectedId = document.getElementById('scenarioList').value;
            if (!selectedId) {
                alert('Choose a scenario to load.');
                return;
            }

            const scenarios = getSavedScenarios();
            const selected = scenarios.find((item) => item.id === selectedId);
            if (!selected) {
                alert('Scenario not found.');
                return;
            }

            applyInputSnapshot(selected.inputs);
            document.getElementById('scenarioName').value = selected.name;
            calculateAll();
        }

        function deleteScenario() {
            const selectedId = document.getElementById('scenarioList').value;
            if (!selectedId) {
                alert('Choose a scenario to delete.');
                return;
            }

            const scenarios = getSavedScenarios();
            const selected = scenarios.find((item) => item.id === selectedId);
            if (!selected) {
                return;
            }

            if (!confirm(`Delete scenario "${selected.name}"?`)) {
                return;
            }

            const remaining = scenarios.filter((item) => item.id !== selectedId);
            setSavedScenarios(remaining);
            refreshScenarioList();
            document.getElementById('scenarioName').value = '';
        }

        function renderStressTest(base) {
            const stressRent = base.monthlyRent * 0.9;
            const stressVacancyRate = Math.min(base.vacancyRate + 5, 99);
            const stressRate = base.interestRate + 1;

            const stressVacancyLoss = stressRent * (stressVacancyRate / 100);
            const stressEffectiveRent = stressRent - stressVacancyLoss;
            const stressMgmtFees = stressEffectiveRent * (base.managementFee / 100);
            const stressNetIncome = stressEffectiveRent - stressMgmtFees;

            const stressPayment = base.loanAmount > 0
                ? calculateMortgagePayment(base.loanAmount, stressRate, base.loanTerm)
                : 0;

            const stressTotalMonthlyExpenses = stressPayment +
                base.monthlyPropertyTax +
                base.monthlyInsurance +
                base.hoaFees +
                base.monthlyMaintenance +
                base.utilities +
                base.monthlyOther;

            const stressMonthlyCashFlow = stressNetIncome - stressTotalMonthlyExpenses;
            const stressAnnualNOI = (stressRent * 12 * (1 - stressVacancyRate / 100)) - base.annualOperatingExpenses;
            const stressCapRate = base.purchasePrice > 0 ? (stressAnnualNOI / base.purchasePrice) * 100 : 0;
            const stressDebtService = stressPayment * 12;
            const stressDscr = stressDebtService > 0 ? (stressAnnualNOI / stressDebtService) : 0;

            document.getElementById('stressCashFlow').textContent = formatCurrency(stressMonthlyCashFlow);
            document.getElementById('stressCashFlow').className = stressMonthlyCashFlow >= 0 ? 'result-value positive' : 'result-value negative';
            document.getElementById('stressDSCR').textContent = stressDscr.toFixed(2);
            document.getElementById('stressDSCR').className = stressDscr >= 1.1 ? 'result-value positive' : 'result-value negative';
            document.getElementById('stressCapRate').textContent = formatPercent(stressCapRate);

            let note = 'Deal appears resilient under this stress case.';
            if (stressMonthlyCashFlow < 0 || stressDscr < 1.0) {
                note = 'Deal is vulnerable in a mild downturn. Consider lower entry price or better rent assumptions.';
            }
            document.getElementById('stressNotes').textContent = note;
        }

        function calculateAll() {
            try {
                // Get all input values with validation
                const {
                    purchasePrice,
                    downPaymentPercent,
                    interestRate,
                    loanTerm,
                    appreciationRate,
                    closingCosts,
                    monthlyRent,
                    rentIncrease,
                    vacancyRate,
                    managementFee,
                    propertyTax,
                    insurance,
                    hoaFees,
                    maintenance,
                    utilities,
                    otherExpenses
                } = getInputSnapshot();

                // Validate inputs
                if (purchasePrice <= 0) {
                    alert('Please enter a valid purchase price');
                    return;
                }

                // Calculate loan details
                const downPayment = purchasePrice * (downPaymentPercent / 100);
                const loanAmount = purchasePrice - downPayment;
                const monthlyPayment = loanAmount > 0 ? calculateMortgagePayment(loanAmount, interestRate, loanTerm) : 0;
                const totalInvestment = downPayment + closingCosts;

                // Calculate monthly income
                const vacancyLoss = monthlyRent * (vacancyRate / 100);
                const effectiveRent = monthlyRent - vacancyLoss;
                const mgmtFees = effectiveRent * (managementFee / 100);
                const netRentalIncome = effectiveRent - mgmtFees;

                // Calculate monthly expenses
                const monthlyPropertyTax = propertyTax / 12;
                const monthlyInsurance = insurance / 12;
                const monthlyMaintenance = maintenance / 12;
                const monthlyOther = otherExpenses / 12;
                
                const totalMonthlyExpenses = monthlyPayment + monthlyPropertyTax + 
                    monthlyInsurance + hoaFees + monthlyMaintenance + utilities + monthlyOther;

                // Calculate cash flow
                const monthlyCashFlow = netRentalIncome - totalMonthlyExpenses;
                const annualCashFlow = monthlyCashFlow * 12;

                // Calculate NOI (Net Operating Income)
                const annualOperatingExpenses = propertyTax + insurance + (hoaFees * 12) + 
                    maintenance + (utilities * 12) + otherExpenses + (mgmtFees * 12);
                const annualNOI = (monthlyRent * 12 * (1 - vacancyRate / 100)) - annualOperatingExpenses;

                // Calculate ROI metrics
                const capRate = purchasePrice > 0 ? (annualNOI / purchasePrice) * 100 : 0;
                const cashOnCash = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;
                const grm = (monthlyRent * 12) > 0 ? purchasePrice / (monthlyRent * 12) : 0;
                const dscr = (monthlyPayment * 12) > 0 ? annualNOI / (monthlyPayment * 12) : 0;
                const onePercentRule = monthlyRent >= (purchasePrice * 0.01);
                const breakEvenRatio = (monthlyRent * 12) > 0 ? 
                    ((annualOperatingExpenses + (monthlyPayment * 12)) / (monthlyRent * 12)) * 100 : 0;
                const expenseRatio = (monthlyRent * 12) > 0 ? (annualOperatingExpenses / (monthlyRent * 12)) * 100 : 0;
                const noiMargin = (monthlyRent * 12) > 0 ? (annualNOI / (monthlyRent * 12)) * 100 : 0;
                const breakEvenRent = vacancyRate < 100 ? totalMonthlyExpenses / (1 - vacancyRate / 100) : 0;
                
                // First year total return including appreciation
                const firstYearAppreciation = purchasePrice * (appreciationRate / 100);
                const firstYearEquityPaydown = loanAmount > 0 ? calculateEquityPaydown(loanAmount, interestRate, 1) : 0;
                const totalFirstYearReturn = annualCashFlow + firstYearAppreciation + firstYearEquityPaydown;
                const totalROI = totalInvestment > 0 ? (totalFirstYearReturn / totalInvestment) * 100 : 0;

                // Update Summary
                document.getElementById('summaryResults').style.display = 'block';
                document.getElementById('totalInvestment').textContent = formatCurrency(totalInvestment);
                document.getElementById('monthlyPayment').textContent = formatCurrency(monthlyPayment);
                document.getElementById('monthlyCashFlow').textContent = formatCurrency(monthlyCashFlow);
                document.getElementById('monthlyCashFlow').className = monthlyCashFlow >= 0 ? 'metric-value positive' : 'metric-value negative';
                document.getElementById('capRate').textContent = formatPercent(capRate);
                document.getElementById('expenseRatio').textContent = formatPercent(expenseRatio);
                document.getElementById('noiMargin').textContent = formatPercent(noiMargin);
                document.getElementById('breakEvenRent').textContent = formatCurrency(breakEvenRent);

                // Update Cash Flow
                document.getElementById('grossIncome').textContent = formatCurrency(monthlyRent);
                document.getElementById('vacancyLoss').textContent = '-' + formatCurrency(vacancyLoss);
                document.getElementById('mgmtFees').textContent = '-' + formatCurrency(mgmtFees);
                document.getElementById('effectiveIncome').textContent = formatCurrency(netRentalIncome);
                document.getElementById('mortgagePayment').textContent = '-' + formatCurrency(monthlyPayment);
                document.getElementById('monthlyTax').textContent = '-' + formatCurrency(monthlyPropertyTax);
                document.getElementById('monthlyInsurance').textContent = '-' + formatCurrency(monthlyInsurance);
                document.getElementById('monthlyHOA').textContent = '-' + formatCurrency(hoaFees);
                document.getElementById('monthlyMaintenance').textContent = '-' + formatCurrency(monthlyMaintenance);
                document.getElementById('monthlyUtilities').textContent = '-' + formatCurrency(utilities);
                document.getElementById('monthlyOther').textContent = '-' + formatCurrency(monthlyOther);
                document.getElementById('netCashFlow').textContent = formatCurrency(monthlyCashFlow);
                document.getElementById('netCashFlow').className = monthlyCashFlow >= 0 ? 'result-value positive' : 'result-value negative';

                // Update ROI Metrics
                document.getElementById('cashOnCash').textContent = formatPercent(cashOnCash);
                document.getElementById('cashOnCash').className = cashOnCash >= 8 ? 'result-value positive' : 'result-value';
                document.getElementById('capRateROI').textContent = formatPercent(capRate);
                document.getElementById('capRateROI').className = capRate >= 6 ? 'result-value positive' : 'result-value';
                document.getElementById('grm').textContent = grm.toFixed(2);
                document.getElementById('dscr').textContent = dscr.toFixed(2);
                document.getElementById('dscr').className = dscr >= 1.25 ? 'result-value positive' : 'result-value';
                document.getElementById('onePercentRule').textContent = onePercentRule ? 'Yes ✓' : 'No ✗';
                document.getElementById('onePercentRule').className = onePercentRule ? 'result-value positive' : 'result-value negative';
                document.getElementById('breakEvenRatio').textContent = formatPercent(breakEvenRatio);
                document.getElementById('annualNOI').textContent = formatCurrency(annualNOI);
                document.getElementById('totalROI').textContent = formatPercent(totalROI);
                document.getElementById('totalROI').className = totalROI >= 15 ? 'result-value positive' : 'result-value';

                // Calculate 5-year projection
                calculate5YearProjection(purchasePrice, loanAmount, interestRate, monthlyRent, 
                    rentIncrease, appreciationRate, monthlyCashFlow, totalInvestment);

                // Calculate Investment Score
                calculateInvestmentScore(capRate, cashOnCash, dscr, onePercentRule, monthlyCashFlow, totalROI);

                renderStressTest({
                    purchasePrice,
                    monthlyRent,
                    vacancyRate,
                    managementFee,
                    interestRate,
                    loanAmount,
                    loanTerm,
                    monthlyPropertyTax,
                    monthlyInsurance,
                    hoaFees,
                    monthlyMaintenance,
                    utilities,
                    monthlyOther,
                    annualOperatingExpenses
                });

                lastAnalysisSnapshot = {
                    timestamp: new Date().toISOString(),
                    inputs: getInputSnapshot(),
                    results: {
                        totalInvestment,
                        monthlyPayment,
                        monthlyCashFlow,
                        capRate,
                        cashOnCash,
                        dscr,
                        breakEvenRatio,
                        expenseRatio,
                        noiMargin,
                        breakEvenRent,
                        totalROI,
                        investmentScore: document.getElementById('scoreValue').textContent
                    }
                };
                
            } catch (error) {
                console.error('Calculation error:', error);
                alert('An error occurred during calculation. Please check your inputs.');
            }
        }

        function calculateEquityPaydown(loanAmount, interestRate, year) {
            if (loanAmount <= 0 || year <= 0) return 0;
            
            const monthlyRate = interestRate / 100 / 12;
            let balance = loanAmount;
            let totalPrincipal = 0;
            
            for (let month = 1; month <= year * 12; month++) {
                const interest = balance * monthlyRate;
                const payment = calculateMortgagePayment(loanAmount, interestRate, 30);
                const principal = payment - interest;
                totalPrincipal += principal;
                balance -= principal;
                
                if (balance <= 0) break;
            }
            
            return totalPrincipal;
        }

        function calculate5YearProjection(purchasePrice, loanAmount, interestRate, monthlyRent, 
            rentIncrease, appreciationRate, monthlyCashFlow, totalInvestment) {
            
            const tbody = document.getElementById('projectionTable');
            tbody.innerHTML = '';
            
            let currentValue = purchasePrice;
            let currentRent = monthlyRent;
            let currentCashFlow = monthlyCashFlow;
            let balance = loanAmount;
            let cumulativeReturn = 0;
            let previousEquityPaydown = 0;
            
            for (let year = 1; year <= 5; year++) {
                // Property appreciation
                currentValue = currentValue * (1 + appreciationRate / 100);
                
                // Rent increase
                if (year > 1) {
                    currentRent = currentRent * (1 + rentIncrease / 100);
                    currentCashFlow = currentCashFlow * (1 + rentIncrease / 100); // Simplified
                }
                
                // Calculate equity
                const currentEquityPaydown = calculateEquityPaydown(loanAmount, interestRate, year);
                const yearlyEquityPaydown = currentEquityPaydown - previousEquityPaydown;
                previousEquityPaydown = currentEquityPaydown;
                
                balance = loanAmount - currentEquityPaydown;
                const equity = currentValue - balance;
                
                // Calculate total return
                const annualCashFlow = currentCashFlow * 12;
                const yearlyAppreciation = currentValue - (year === 1 ? purchasePrice : 
                    purchasePrice * Math.pow(1 + appreciationRate / 100, year - 1));
                cumulativeReturn += annualCashFlow + yearlyEquityPaydown;
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>Year ${year}</td>
                    <td>${formatCurrency(currentValue)}</td>
                    <td>${formatCurrency(currentRent)}/mo</td>
                    <td>${formatCurrency(annualCashFlow)}</td>
                    <td>${formatCurrency(equity)}</td>
                    <td>${formatCurrency(cumulativeReturn)}</td>
                `;
            }
        }

        function calculateInvestmentScore(capRate, cashOnCash, dscr, onePercentRule, monthlyCashFlow, totalROI) {
            let score = 0;
            
            // Cap Rate (0-20 points)
            if (capRate >= 10) score += 20;
            else if (capRate >= 8) score += 15;
            else if (capRate >= 6) score += 10;
            else if (capRate >= 4) score += 5;
            
            // Cash on Cash Return (0-20 points)
            if (cashOnCash >= 12) score += 20;
            else if (cashOnCash >= 10) score += 15;
            else if (cashOnCash >= 8) score += 10;
            else if (cashOnCash >= 6) score += 5;
            
            // DSCR (0-20 points)
            if (dscr >= 1.5) score += 20;
            else if (dscr >= 1.25) score += 15;
            else if (dscr >= 1.0) score += 10;
            else if (dscr >= 0.9) score += 5;
            
            // 1% Rule (0-15 points)
            if (onePercentRule) score += 15;
            else score += 5;
            
            // Positive Cash Flow (0-15 points)
            if (monthlyCashFlow >= 500) score += 15;
            else if (monthlyCashFlow >= 250) score += 10;
            else if (monthlyCashFlow >= 0) score += 5;
            
            // Total ROI (0-10 points)
            if (totalROI >= 20) score += 10;
            else if (totalROI >= 15) score += 7;
            else if (totalROI >= 10) score += 5;
            else if (totalROI >= 5) score += 2;
            
            // Update display
            document.getElementById('scoreValue').textContent = Math.round(score);
            
            // Animate score circle
            const circle = document.getElementById('scoreCircle');
            const circumference = 408;
            const offset = circumference - (score / 100) * circumference;
            
            setTimeout(() => {
                circle.style.strokeDashoffset = offset;
                circle.style.transition = 'stroke-dashoffset 1s ease';
            }, 100);
            
            let label = '';
            let color = '';
            if (score >= 90) {
                label = 'Excellent Investment';
                color = '#10b981';
            } else if (score >= 75) {
                label = 'Good Investment';
                color = '#3b82f6';
            } else if (score >= 60) {
                label = 'Fair Investment';
                color = '#f59e0b';
            } else {
                label = 'Poor Investment';
                color = '#ef4444';
            }
            
            document.getElementById('scoreValue').style.color = color;
            circle.style.stroke = color;
            document.getElementById('scoreLabel').textContent = label;
        }

        function saveAnalysis() {
            if (!lastAnalysisSnapshot) {
                calculateAll();
            }

            const data = {
                timestamp: new Date().toISOString(),
                brand: 'VeeCasa',
                propertyDetails: {
                    purchasePrice: document.getElementById('purchasePrice').value,
                    downPaymentPercent: document.getElementById('downPaymentPercent').value,
                    interestRate: document.getElementById('interestRate').value,
                    loanTerm: document.getElementById('loanTerm').value,
                    appreciationRate: document.getElementById('appreciationRate').value,
                    closingCosts: document.getElementById('closingCosts').value
                },
                rentalIncome: {
                    monthlyRent: document.getElementById('monthlyRent').value,
                    rentIncrease: document.getElementById('rentIncrease').value,
                    vacancyRate: document.getElementById('vacancyRate').value,
                    managementFee: document.getElementById('managementFee').value
                },
                expenses: {
                    propertyTax: document.getElementById('propertyTax').value,
                    insurance: document.getElementById('insurance').value,
                    hoaFees: document.getElementById('hoaFees').value,
                    maintenance: document.getElementById('maintenance').value,
                    utilities: document.getElementById('utilities').value,
                    otherExpenses: document.getElementById('otherExpenses').value
                },
                results: {
                    monthlyCashFlow: document.getElementById('monthlyCashFlow').textContent,
                    capRate: document.getElementById('capRate').textContent,
                    totalROI: document.getElementById('totalROI').textContent,
                    investmentScore: document.getElementById('scoreValue').textContent
                },
                stressTest: {
                    stressCashFlow: document.getElementById('stressCashFlow').textContent,
                    stressDSCR: document.getElementById('stressDSCR').textContent,
                    stressCapRate: document.getElementById('stressCapRate').textContent
                },
                snapshot: lastAnalysisSnapshot
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'veecasa-analysis-' + new Date().getTime() + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function exportReportCSV() {
            if (!lastAnalysisSnapshot) {
                calculateAll();
            }

            const snapshot = lastAnalysisSnapshot || { inputs: {}, results: {} };
            const rows = [
                ['Brand', 'VeeCasa'],
                ['Generated At', new Date().toISOString()],
                ['Purchase Price', snapshot.inputs.purchasePrice || 0],
                ['Monthly Rent', snapshot.inputs.monthlyRent || 0],
                ['Down Payment %', snapshot.inputs.downPaymentPercent || 0],
                ['Interest Rate %', snapshot.inputs.interestRate || 0],
                ['Monthly Cash Flow', (snapshot.results.monthlyCashFlow || 0).toFixed ? snapshot.results.monthlyCashFlow.toFixed(2) : snapshot.results.monthlyCashFlow],
                ['Cap Rate %', (snapshot.results.capRate || 0).toFixed ? snapshot.results.capRate.toFixed(2) : snapshot.results.capRate],
                ['Cash-on-Cash %', (snapshot.results.cashOnCash || 0).toFixed ? snapshot.results.cashOnCash.toFixed(2) : snapshot.results.cashOnCash],
                ['DSCR', (snapshot.results.dscr || 0).toFixed ? snapshot.results.dscr.toFixed(2) : snapshot.results.dscr],
                ['Total ROI %', (snapshot.results.totalROI || 0).toFixed ? snapshot.results.totalROI.toFixed(2) : snapshot.results.totalROI],
                ['Investment Score', snapshot.results.investmentScore || '--'],
                ['Stress Cash Flow', document.getElementById('stressCashFlow').textContent],
                ['Stress DSCR', document.getElementById('stressDSCR').textContent],
                ['Stress Cap Rate', document.getElementById('stressCapRate').textContent]
            ];

            const csv = rows
                .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `veecasa-deal-report-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function resetForm() {
            if (confirm('Are you sure you want to reset all values to defaults?')) {
                document.getElementById('purchasePrice').value = 350000;
                document.getElementById('downPaymentPercent').value = 20;
                document.getElementById('interestRate').value = 7.0;
                document.getElementById('loanTerm').value = 30;
                document.getElementById('appreciationRate').value = 3;
                document.getElementById('closingCosts').value = 5000;
                document.getElementById('monthlyRent').value = 2500;
                document.getElementById('rentIncrease').value = 3;
                document.getElementById('vacancyRate').value = 5;
                document.getElementById('managementFee').value = 8;
                document.getElementById('propertyTax').value = 4200;
                document.getElementById('insurance').value = 1200;
                document.getElementById('hoaFees').value = 0;
                document.getElementById('maintenance').value = 3500;
                document.getElementById('utilities').value = 0;
                document.getElementById('otherExpenses').value = 500;
                calculateAll();
            }
        }

        // Auto-calculate on input change with debouncing
        let calculateTimeout;
        function debounceCalculate() {
            clearTimeout(calculateTimeout);
            calculateTimeout = setTimeout(calculateAll, 500);
        }

        // Add event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Add listeners to all calculation inputs
            const inputs = document.querySelectorAll('input[type="number"], select');
            inputs.forEach(input => {
                if (input.id && !input.id.includes('search')) {
                    input.addEventListener('input', debounceCalculate);
                    input.addEventListener('change', calculateAll);
                }
            });

            // Initial calculation
            refreshScenarioList();
            calculateAll();
            initLeadFormTimer();

            const leadForm = document.getElementById('leadForm');
            if (leadForm) {
                leadForm.addEventListener('submit', handleLeadSubmit);
            }

            // Handle iOS standalone mode
            if (window.navigator.standalone) {
                document.body.classList.add('standalone');
            }

            // Smooth scrolling for navigation
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        });

        // Prevent zoom on input focus for iOS
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        });

        // Handle offline mode
        window.addEventListener('online', () => {
            console.log('Back online');
        });

        window.addEventListener('offline', () => {
            console.log('Offline mode - app will continue to work');
        });
    