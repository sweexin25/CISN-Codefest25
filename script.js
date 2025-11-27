/**
 * XENBER ENTERPRISE OPS LOGIC
 * UPDATED: Persistent Weather & Risk Logic
 */

// ==========================================
// PART 1: CSV DATA (EXTENDED TO NOV 30)
// ==========================================
const csvRawData = `Date,Daily_Revenue,New_Leads,Active_Users,Avg_Employee_Mood_Score,Overtime_Hours_Logged,Code_Commits,System_Error_Rate,Cloud_Cost,Risk_Flag
2025-11-01,15400,45,1250,8.5,12,85,0.02%,450,Low
2025-11-02,16200,52,1310,8.4,15,92,0.02%,465,Low
2025-11-03,15800,48,1290,8.2,18,88,0.05%,460,Low
2025-11-04,14500,41,1200,7.9,25,110,0.12%,510,Medium
2025-11-05,13200,35,1150,7.1,42,145,2.50%,850,High
2025-11-06,12800,30,1100,6.5,55,160,3.20%,920,Critical
2025-11-07,13500,38,1180,6.8,48,130,1.80%,780,High
2025-11-08,14900,44,1240,7.2,30,105,0.50%,600,Medium
2025-11-09,15600,50,1295,7.8,20,95,0.15%,490,Low
2025-11-10,16500,55,1350,8.1,14,90,0.05%,470,Low
2025-11-11,17100,58,1380,8.3,12,88,0.04%,475,Low
2025-11-12,16800,56,1370,8.2,16,92,0.08%,480,Low
2025-11-13,17500,62,1420,8.0,22,100,0.10%,520,Medium
2025-11-14,18200,65,1450,7.6,35,125,0.45%,610,Medium
2025-11-15,19000,70,1500,7.4,40,135,0.90%,700,High
2025-11-16,19500,72,1550,7.3,38,140,0.85%,720,Medium
2025-11-17,19800,75,1600,7.1,42,145,1.10%,750,High
2025-11-18,20500,80,1650,7.0,45,150,1.50%,800,High
2025-11-19,21200,85,1700,6.9,50,155,2.10%,880,Critical
2025-11-20,18500,60,1600,7.5,30,120,0.50%,600,Medium
2025-11-21,19000,65,1620,7.8,25,110,0.20%,550,Low
2025-11-22,19500,68,1650,8.0,20,105,0.10%,530,Low
2025-11-23,20000,70,1680,8.1,18,100,0.08%,520,Low
2025-11-24,20800,75,1720,7.9,22,115,0.15%,540,Low
2025-11-25,21500,78,1750,7.7,28,125,0.30%,580,Medium
2025-11-26,22100,82,1800,7.5,35,135,0.60%,650,Medium
2025-11-27,22800,85,1850,7.3,40,145,0.95%,710,High
2025-11-28,23500,88,1900,7.1,45,155,1.20%,780,High
2025-11-29,24200,90,1950,6.8,55,165,2.80%,900,Critical
2025-11-30,25000,95,2000,6.5,60,180,3.50%,980,Critical`;

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].trim().split(',');
    return lines.slice(1).map(line => {
        const values = line.trim().split(',');
        let obj = {};
        headers.forEach((header, i) => {
            let val = values[i];
            if (!isNaN(val)) val = Number(val);
            obj[header.trim()] = val;
        });
        return obj;
    });
}

function mapRiskToNumber(risk) {
    switch(risk) {
        case 'Low': return 0;
        case 'Medium': return 1;
        case 'High': return 2;
        case 'Critical': return 3;
        default: return 0;
    }
}

function calculateTrendAndForecast(dataArray, daysToPredict) {
    const n = dataArray.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i; sumY += dataArray[i]; sumXY += i * dataArray[i]; sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    let predictions = [];
    for (let i = 1; i <= daysToPredict; i++) {
        let val = (slope * (n - 1 + i)) + intercept;
        let randomVariance = (Math.random() * val * 0.1) - (val * 0.05);
        let result = val + randomVariance;
        if (result < 0) result = 0; 
        predictions.push(result);
    }
    return predictions;
}

const historicalData = parseCSV(csvRawData);
const pastRevenue = historicalData.map(d => d.Daily_Revenue);
const pastLeads = historicalData.map(d => d.New_Leads * 300); 
const pastDates = historicalData.map(d => d.Date.slice(5)); 
const pastRisks = historicalData.map(d => mapRiskToNumber(d.Risk_Flag));
const futureRisks = calculateTrendAndForecast(pastRisks, 7).map(v => Math.min(Math.max(Math.round(v), 0), 3));
const futureRevenue = calculateTrendAndForecast(pastRevenue, 7);
const futureLeads = calculateTrendAndForecast(pastLeads, 7);

let lastDate = new Date("2025-11-30"); 
let futureDates = [];
for(let i=1; i<=7; i++) {
    let d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    futureDates.push((d.getMonth()+1) + "-" + d.getDate());
}

// ==========================================
// PART 2: THE DATABASE (STATE)
// ==========================================
const database = {
    currentCloud: 'Google BigQuery',
    companySavings: 450000,
    timeLabels: ['09:00', '10:00', '11:00', '12:00', '13:00'], 
    loadHistory: [45, 50, 48, 55, 60],
    nextSimulatedHour: 14, 
    
    employees: [
        { name: "Sarah J.", role: "Engineer", fatigue: 30, score: 135 },
        { name: "Mike R.", role: "Logistics", fatigue: 52, score: 65 }, 
        { name: "Jessica T.", role: "Sales", fatigue: 10, score: 88 },
        { name: "David B.", role: "Manager", fatigue: 75, score: 75 },
        { name: "Alex K.", role: "Intern", fatigue: 20, score: 90 },
        { name: "Priya M.", role: "DevOps", fatigue: 60, score: 77 }
    ],
    machines: [
        { name: "Server A", type: "Hardware", health: 90 },
        { name: "Server B", type: "Hardware", health: 65 }, 
        { name: "Cloud Infrastructure", type: "Cloud", health: 100 },
        { name: "Cooling System", type: "Facility", health: 75 },
        { name: "Router", type: "Internet", health: 85 }
    ],
    weatherForecast: []
};

// ==========================================
// PART 3: SETUP (CHARTS & DISPLAY)
// ==========================================

const allLabels = [...pastDates, ...futureDates];

// --- MAIN CHART: ACTIVE RISK FORECAST ---
const chartDataRiskPast = [...pastRisks, ...Array(7).fill(null)];
const chartDataRiskFuture = [...Array(pastRisks.length).fill(null).map((_, i) => i === pastRisks.length - 1 ? pastRisks[i] : null), ...futureRisks];
chartDataRiskFuture[pastRisks.length - 1] = pastRisks[pastRisks.length - 1];

const chartContext = document.getElementById('mainChart').getContext('2d');
const dashboardChart = new Chart(chartContext, {
    type: 'line',
    data: {
        labels: allLabels,
        datasets: [{ 
            label: 'Historical Risk Level', 
            data: chartDataRiskPast, 
            borderColor: '#64748b', 
            backgroundColor: 'rgba(100, 116, 139, 0.1)', 
            fill: true, 
            tension: 0.2,
            stepped: true
        },
        { 
            label: 'Predicted Risk Trend', 
            data: chartDataRiskFuture, 
            borderColor: '#ef4444', 
            borderDash: [5, 5],
            backgroundColor: 'rgba(239, 68, 68, 0.05)', 
            fill: true, 
            tension: 0.2,
            stepped: true
        }]
    },
    options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: {
            y: {
                min: 0,
                max: 3.5,
                ticks: {
                    callback: function(value) {
                        if(value === 0) return 'Low';
                        if(value === 1) return 'Medium';
                        if(value === 2) return 'High';
                        if(value === 3) return 'CRITICAL';
                        return '';
                    }
                }
            }
        }
    }
});


// --- FORECAST CHART (REVENUE) ---
const chartDataRevPast = [...pastRevenue, ...Array(7).fill(null)];
const chartDataRevFutureFixed = Array(pastRevenue.length - 1).fill(null);
chartDataRevFutureFixed.push(pastRevenue[pastRevenue.length-1]);
futureRevenue.forEach(r => chartDataRevFutureFixed.push(r));

const chartDataLeadsPast = [...pastLeads, ...Array(7).fill(null)];
const chartDataLeadsFuture = [...Array(pastLeads.length-1).fill(null), pastLeads[pastLeads.length-1], ...futureLeads];

const ctxForecast = document.getElementById('forecastChart').getContext('2d');
const forecastChart = new Chart(ctxForecast, {
    type: 'line',
    data: {
        labels: allLabels,
        datasets: [
            { label: 'Revenue (Actual)', data: chartDataRevPast, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 },
            { label: 'Revenue (Forecast)', data: chartDataRevFutureFixed, borderColor: '#10b981', borderDash: [5, 5], pointStyle: 'rectRot', tension: 0.3 },
            { label: 'Leads (Indicator)', data: chartDataLeadsPast, borderColor: '#f59e0b', tension: 0.3 },
            { label: 'Leads (Forecast)', data: chartDataLeadsFuture, borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.3 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
});

function updateScreen() {
    const currentLoad = database.loadHistory[database.loadHistory.length - 1];
    document.getElementById('kpi-load').innerText = currentLoad + "%";
    document.getElementById('kpi-savings').innerText = "$" + database.companySavings.toLocaleString();
    
    let riskCount = 0;
    database.employees.forEach(e => { if(e.fatigue > 80) riskCount++; });
    database.machines.forEach(m => { if(m.health < 40) riskCount++; });
    document.getElementById('kpi-alerts').innerText = riskCount;

    const latest = historicalData[historicalData.length - 1];
    if(document.getElementById('blk-date')) {
        document.getElementById('blk-date').innerText = latest.Date;
        document.getElementById('blk-revenue').innerText = "$" + latest.Daily_Revenue.toLocaleString();
        document.getElementById('blk-leads').innerText = latest.New_Leads;
        document.getElementById('blk-users').innerText = latest.Active_Users.toLocaleString();
        document.getElementById('blk-errors').innerText = latest.System_Error_Rate;
        document.getElementById('blk-risk').innerText = latest.Risk_Flag;

        const riskCard = document.getElementById('blk-risk-card');
        const riskIcon = document.getElementById('blk-risk-icon');
        const riskDetails = document.getElementById('blk-risk-details');
        
        let riskReasons = [];
        if (parseFloat(latest.System_Error_Rate) > 1.0) riskReasons.push("High Error Rate");
        if (latest.Overtime_Hours_Logged > 30) riskReasons.push("High Overtime");
        if (latest.Avg_Employee_Mood_Score < 7.0) riskReasons.push("Low Morale");
        let riskText = riskReasons.length > 0 ? "Causes: " + riskReasons.join(", ") : "System Stable";

        if (latest.Risk_Flag === "Critical") {
            riskCard.style.borderLeftColor = "#ef4444"; 
            riskIcon.className = "fa-solid fa-triangle-exclamation text-red-500 animate-pulse";
            riskDetails.className = "mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100 block";
        } else if (latest.Risk_Flag === "High") {
            riskCard.style.borderLeftColor = "#f97316"; 
            riskIcon.className = "fa-solid fa-circle-exclamation text-orange-500";
            riskDetails.className = "mt-2 text-xs font-bold text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 block";
        } else {
            riskCard.style.borderLeftColor = "#10b981"; 
            riskIcon.className = "fa-solid fa-circle-check text-green-500";
            riskDetails.className = "hidden";
        }
        riskDetails.innerText = riskText;
    }

    const projRev = futureRevenue[6];
    const currRev = pastRevenue[pastRevenue.length-1];
    const diff = projRev - currRev;
    if(document.getElementById('forecast-insight')) {
        document.getElementById('forecast-insight').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="p-4 bg-white rounded border"><div class="text-xs text-slate-400 uppercase">Last Revenue</div><div class="font-black text-2xl text-slate-700">$${currRev.toLocaleString()}</div></div>
            <div class="p-4 bg-white rounded border border-purple-200"><div class="text-xs text-slate-400 uppercase">7-Day Prediction</div><div class="font-black text-2xl text-purple-600">$${Math.round(projRev).toLocaleString()}</div></div>
            <div class="p-4 bg-white rounded border"><div class="text-xs text-slate-400 uppercase">Trend</div><div class="font-black text-2xl ${diff > 0 ? 'text-green-500' : 'text-red-500'}">${diff > 0 ? '▲ UP' : '▼ DOWN'} $${Math.abs(Math.round(diff)).toLocaleString()}</div></div>
        </div>`;
    }

    drawTables();
// ... inside updateScreen function ...
    const advisorBox = document.getElementById('advisor-feed');
    
    let opsContent = "";
    let hrContent = "";
    let envContent = "";
    let finContent = "";
    let totalRiskCount = 0;

    // 1. OPERATIONS (Health < 20)
    const badMachines = database.machines.filter(m => m.health < 10);
    if (badMachines.length > 0) {
        opsContent += `<div class="mb-2"><div class="text-[10px] font-bold text-red-300 border-b border-red-700/50 mb-1">OPERATIONS</div>`;
        badMachines.forEach(m => {
            opsContent += `<div class="pl-2 mb-1">• <b>${m.name} is down</b> <span class="opacity-75 italic text-[10px] block pl-3">↳ Action: Emmergency Repair</span></div>`;
        });
        opsContent += `</div>`;
        totalRiskCount += badMachines.length;
    }

    // 2. HR (Fatigue > 85)
    const tiredStaff = database.employees.filter(e => e.fatigue > 85);
    if (tiredStaff.length > 0) {
        hrContent += `<div class="mb-2"><div class="text-[10px] font-bold text-red-300 border-b border-red-700/50 mb-1">HUMAN RESOURCES</div>`;
        tiredStaff.forEach(e => {
            hrContent += `<div class="pl-2 mb-1">• <b>${e.name} is exhausted</b> <span class="opacity-75 italic text-[10px] block pl-3">↳ Action: Give Rest</span></div>`;
        });
        hrContent += `</div>`;
        totalRiskCount += tiredStaff.length;
    }

    // 3. WEATHER
    if (database.weatherForecast.some(d => d.type === 'Stormy')) {
        envContent = `<div class="mb-2"><div class="text-[10px] font-bold text-red-300 border-b border-red-700/50 mb-1">WEATHER</div>
                        <div class="pl-2">• <b>Storm Alert</b> <span class="opacity-75 italic text-[10px] block pl-3">↳ Action: WFH</span></div>
                      </div>`;
        totalRiskCount++;
    }

    // RENDER LOGIC
    if (totalRiskCount > 0) {
        advisorBox.innerHTML = `
            <div class="bg-red-900/50 p-3 rounded border border-red-500 text-red-200 text-xs shadow-lg">
                <div class="font-bold border-b border-red-500 pb-2 mb-2 flex justify-between items-center">
                    <span><i class="fa-solid fa-triangle-exclamation mr-2"></i>ACTION REQUIRED</span>
                    <span class="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] shadow-sm">${totalRiskCount}</span>
                </div>
                
                <div class="flex flex-col gap-1">
                    ${opsContent}
                    ${hrContent}
                    ${envContent}
                </div>
            </div>`;
    } else {
        advisorBox.innerHTML = `<div class="bg-green-900/30 p-3 rounded border border-green-500 text-green-200 text-xs"><i class="fa-solid fa-check-circle mr-2"></i><b>OPTIMAL:</b> Systems stable. Forecast suggests growth.</div>`;
    }
}

// Generate HTML for buttons
function drawTables() {
    let fullW = "", dashW = "", fullR = "", dashR = "";
    
    database.employees.forEach((e, i) => {
        let badgeClass = "", icon = "", statusText = "";
        
        if (e.fatigue > 90) { badgeClass = "badge-red"; icon = "fa-fire"; statusText = "BURNOUT RISK"; } 
        else if (e.fatigue > 70) { badgeClass = "badge-amber"; icon = "fa-battery-quarter"; statusText = "TIRED"; } 
        else if (e.fatigue > 30) { badgeClass = "badge-blue"; icon = "fa-briefcase"; statusText = "WORKING"; } 
        else { badgeClass = "badge-green"; icon = "fa-bolt"; statusText = "PEAK PERF."; }

        let badge = `<span class="status-badge ${badgeClass}"><i class="fa-solid ${icon} mr-1"></i> ${statusText}</span>`;
        fullW += `<tr class="border-b"><td class="p-4 font-bold">${e.name}</td><td class="p-4">${e.role}</td><td class="p-4">${e.fatigue}%</td><td class="p-4">${e.score}</td><td class="p-4 text-right w-36">${badge}</td></tr>`;
        dashW += `<tr class="border-b"><td class="p-3 font-bold text-xs">${e.name} <span class="text-slate-400 text-[10px] ml-1">(${e.fatigue}%)</span></td><td class="p-3 text-right">${badge}</td></tr>`;
    });

    database.machines.forEach((m, i) => {
        let badgeClass = "", icon = "", statusText = "";
        
        if (m.health < 20) { badgeClass = "badge-red"; icon = "fa-circle-xmark"; statusText = "FAILURE"; } 
        else if (m.health < 60) { badgeClass = "badge-amber"; icon = "fa-triangle-exclamation"; statusText = "DEGRADING"; } 
        else if (m.health < 100) { badgeClass = "badge-blue"; icon = "fa-wrench"; statusText = "OPERATIONAL"; } 
        else { badgeClass = "badge-green"; icon = "fa-check-circle"; statusText = "OPTIMAL"; }
        
        let badge = `<span class="status-badge ${badgeClass}"><i class="fa-solid ${icon} mr-1"></i> ${statusText}</span>`;
        fullR += `<tr class="border-b"><td class="p-4 font-bold">${m.name}</td><td class="p-4">${m.type}</td><td class="p-4">${Math.floor(m.health)}%</td><td class="p-4 text-right w-36">${badge}</td></tr>`;
        dashR += `<tr class="border-b"><td class="p-3 font-bold text-xs">${m.name} <span class="text-slate-400 text-[10px] ml-1">(${m.health}%)</span></td><td class="p-3 text-right">${badge}</td></tr>`;
    });

    if(document.getElementById('full-workforce-table')) document.getElementById('full-workforce-table').innerHTML = fullW;
    if(document.getElementById('dash-workforce-table')) document.getElementById('dash-workforce-table').innerHTML = dashW;
    if(document.getElementById('full-resource-table')) document.getElementById('full-resource-table').innerHTML = fullR;
    if(document.getElementById('dash-resource-table')) document.getElementById('dash-resource-table').innerHTML = dashR;
}

// ==========================================
// PART 4: WEATHER & FLOOD INTELLIGENCE MODULE
// ==========================================

function generateWeatherForecast() {
    // Prevent regeneration if data already exists for this session
    if (database.weatherForecast.length > 0) return;

    // Use a random seed per session to keep it static
    database.weatherForecast = futureDates.slice(0, 5).map(date => {
        const r = Math.random();
        let type;
        if(r < 0.3) type = 'Sunny';
        else if (r < 0.6) type = 'Cloudy';
        else if (r < 0.85) type = 'Rainy';
        else type = 'Stormy';
        
        return { date: date, type: type };
    });
}

function toggleWeather() {
    const modal = document.getElementById('weather-modal');
    const isHidden = modal.classList.contains('modal-hidden');
    
    if (isHidden) {
        // Just render the EXISTING data. Do not regenerate.
        renderWeatherModal();
        modal.classList.remove('modal-hidden');
        modal.classList.add('modal-visible');
    } else {
        modal.classList.remove('modal-visible');
        modal.classList.add('modal-hidden');
    }
}

function renderWeatherModal() {
    const bannerBox = document.getElementById('weather-risk-banner');
    const iconBox = document.getElementById('weather-risk-icon');
    const riskText = document.getElementById('weather-risk-text');
    const wfhText = document.getElementById('weather-wfh-decision');
    const grid = document.getElementById('weather-forecast-grid');
    
    // Analyze 5 days for Flood Risk
    let rainCount = 0;
    let stormCount = 0;
    database.weatherForecast.forEach(d => {
        if(d.type === 'Rainy') rainCount++;
        if(d.type === 'Stormy') stormCount++;
    });

    // Risk Logic
    let riskLevel = "LOW";
    if (stormCount >= 1 || rainCount >= 3) riskLevel = "MEDIUM";
    if (stormCount >= 2 || (rainCount >= 3 && stormCount >= 1)) riskLevel = "HIGH - FLOOD WARNING";

    // UI Updates based on Risk
    if (riskLevel.includes("HIGH")) {
        bannerBox.className = "p-4 rounded-xl border border-red-300 bg-red-50 flex items-center gap-4 animate-pulse";
        iconBox.className = "w-12 h-12 rounded-full flex items-center justify-center bg-red-200 text-red-600 text-2xl";
        iconBox.innerHTML = '<i class="fa-solid fa-house-flood-water"></i>';
        riskText.className = "text-lg font-black text-red-700";
        riskText.innerText = riskLevel;
        wfhText.className = "text-2xl font-black text-red-600 border-2 border-dashed border-red-300 bg-red-50 p-3 rounded-xl";
        wfhText.innerText = "🚨 MANDATORY WFH";
    } else if (riskLevel === "MEDIUM") {
        bannerBox.className = "p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-center gap-4";
        iconBox.className = "w-12 h-12 rounded-full flex items-center justify-center bg-amber-200 text-amber-600 text-2xl";
        iconBox.innerHTML = '<i class="fa-solid fa-cloud-showers-heavy"></i>';
        riskText.className = "text-lg font-black text-amber-700";
        riskText.innerText = riskLevel;
        wfhText.className = "text-2xl font-black text-amber-600 border-2 border-dashed border-amber-300 bg-amber-50 p-3 rounded-xl";
        wfhText.innerText = "⚠️ HYBRID ";
    } else {
        bannerBox.className = "p-4 rounded-xl border border-green-300 bg-green-50 flex items-center gap-4";
        iconBox.className = "w-12 h-12 rounded-full flex items-center justify-center bg-green-200 text-green-600 text-2xl";
        iconBox.innerHTML = '<i class="fa-solid fa-sun"></i>';
        riskText.className = "text-lg font-black text-green-700";
        riskText.innerText = riskLevel;
        wfhText.className = "text-2xl font-black text-green-600 border-2 border-dashed border-green-300 bg-green-50 p-3 rounded-xl";
        wfhText.innerText = "🏢 OFFICE ";
    }

    // Render Grid
    grid.innerHTML = "";
    database.weatherForecast.forEach(day => {
        let icon = "";
        let color = "";
        if (day.type === 'Sunny') { icon = "fa-sun"; color = "text-yellow-500"; }
        if (day.type === 'Cloudy') { icon = "fa-cloud"; color = "text-slate-400"; }
        if (day.type === 'Rainy') { icon = "fa-cloud-rain"; color = "text-blue-400"; }
        if (day.type === 'Stormy') { icon = "fa-bolt"; color = "text-purple-600"; }

        grid.innerHTML += `
            <div class="bg-white border rounded p-2 flex flex-col items-center shadow-sm">
                <div class="text-[10px] text-slate-400 font-bold mb-1">${day.date}</div>
                <i class="fa-solid ${icon} ${color} text-xl mb-1"></i>
                <div class="text-xs font-bold text-slate-700">${day.type}</div>
            </div>
        `;
    });
}

// Make globally accessible
window.toggleWeather = toggleWeather;

// ==========================================
// PART 5: USER ACTIONS
// ==========================================

function switchView(viewName) {
    ['dashboard', 'forecast', 'workforce', 'maintenance'].forEach(v => {
        document.getElementById('view-' + v).classList.add('hidden');
        document.getElementById('btn-' + v).classList.remove('nav-active');
    });
    document.getElementById('view-' + viewName).classList.remove('hidden');
    document.getElementById('btn-' + viewName).classList.add('nav-active');
    
    const titles = { 'dashboard': 'Operational Dashboard', 'forecast': 'AI KPI Forecast', 'workforce': 'Workforce Hub', 'maintenance': 'Maintenance Scheduler' };
    document.getElementById('header-title').innerText = titles[viewName];
}

function toggleCloud() {
    database.currentCloud = (database.currentCloud === 'Google BigQuery') ? 'Azure Synapse' : 'Google BigQuery';
    if(document.getElementById('cloud-name')) document.getElementById('cloud-name').innerText = database.currentCloud;
    alert("System Notification: Data Source switched to " + database.currentCloud);
}

function actionRestAll() {
    let userChoice = confirm(`⚠️ EXECUTIVE ORDER:\n\nSend ENTIRE STAFF on break? \nThis will reset all fatigue to 0% but halt production for 1 hour.`);
    if (userChoice) {
        database.employees.forEach(e => e.fatigue = 0);
        updateScreen();
    }
}

function resetSimulation() { location.reload(); }

window.switchView = switchView;
window.toggleCloud = toggleCloud;
window.resetSimulation = resetSimulation;
window.actionRestAll = actionRestAll;


// ==========================================
// PART 6: SIMULATION LOOP
// ==========================================

setInterval(() => {
    const now = new Date();
    if(document.getElementById('live-clock')) {
        document.getElementById('live-clock').innerText = now.toLocaleTimeString('en-US', { hour12: false });
    }
}, 1000);

setInterval(() => {
    let newLoad = Math.floor(Math.random() * 30) + 50; 
    let nextTime = database.nextSimulatedHour + ":00";
    database.nextSimulatedHour++;
    if (database.nextSimulatedHour > 23) database.nextSimulatedHour = 0;

    database.loadHistory.push(newLoad);
    database.loadHistory.shift(); 
    database.timeLabels.push(nextTime);
    database.timeLabels.shift();

    database.machines.forEach(machine => {
        if(machine.health > 0) machine.health -= 2; 
        if(machine.health < 0) machine.health = 0;
    });
    
    database.employees.forEach(emp => {
        if(emp.fatigue < 100) emp.fatigue ++; 
    });

    updateScreen();
}, 2000);

// ==========================================
// PART 7: INTELLIGENT ADVISOR
// ==========================================

let isChatVisible = false;

function toggleChatVisibility() {
    isChatVisible = !isChatVisible;
    const windowEl = document.getElementById('chat-window');
    if (isChatVisible) {
        windowEl.classList.remove('chat-hidden');
        windowEl.classList.add('chat-visible');
    } else {
        windowEl.classList.remove('chat-visible');
        windowEl.classList.add('chat-hidden');
    }
}

function checkEnterKey(event) { if (event.key === 'Enter') handleUserMessage(); }

function handleUserMessage() {
    const inputField = document.getElementById('chat-input');
    const userText = inputField.value.trim();
    if (!userText) return;

    displayMessage(userText, 'user');
    inputField.value = '';

    setTimeout(() => {
        const aiReply = generateSmartAnswer(userText.toLowerCase());
        displayMessage(aiReply, 'ai');
    }, 800);
}

function displayMessage(text, sender) {
    const chatContainer = document.getElementById('chat-messages');
    const messageWrapper = document.createElement('div');
    if (sender === 'user') {
        messageWrapper.className = "flex justify-end";
        messageWrapper.innerHTML = `<div class="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-md text-sm">${text}</div>`;
    } else {
        messageWrapper.className = "flex justify-start";
        messageWrapper.innerHTML = `<div class="bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-md border border-slate-200 text-sm leading-relaxed">${text}</div>`;
    }
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function generateSmartAnswer(question) {
    const latest = historicalData[historicalData.length-1];
    const brokenMachine = database.machines.find(m => m.health < 50);
    const tiredEmp = database.employees.find(e => e.fatigue > 80);
    
    if (question.includes("hello") || question.includes("hi")) {
        return "Hello. I'm ready to review the Q4 numbers or discuss operational risks. Where should we start?";
    }

    if (question.includes("kpi") || question.includes("performance") || question.includes("numbers")) {
        const growth = ((futureRevenue[6] - latest.Daily_Revenue) / latest.Daily_Revenue * 100).toFixed(1);
        const sentiment = growth > 0 ? "positive" : "concerning";
        return `<b>Executive Summary:</b><br>
                1. <b>Revenue:</b> $${latest.Daily_Revenue.toLocaleString()} (Daily)<br>
                2. <b>Forecast:</b> Tracking for ${growth}% growth over 7 days.<br>
                3. <b>Efficiency:</b> Error rates are at ${latest.System_Error_Rate}.<br>
                <i>Assessment: The trend is ${sentiment}, but watch the error rate closely.</i>`;
    }

    if (question.includes("alert") || question.includes("problem") || question.includes("status")) {
        if (brokenMachine) return `🚨 <b>Priority One:</b> We have a hardware failure in <b>${brokenMachine.name}</b>. This is costing us approx $100/hour in potential downtime. Please deploy the maintenance team immediately via the Dashboard.`;
        if (tiredEmp) return `⚠️ <b>HR Notice:</b> ${tiredEmp.name} is showing fatigue signs (>80%). This is a liability. Recommend immediate rotation or rest.`;
        return "✅ <b>Operational Status:</b> All systems are nominal. No immediate interventions required.";
    }

    if (question.includes("cost") || question.includes("money")) {
        return `I've reviewed the P&L. We have accumulated <b>$${database.companySavings.toLocaleString()}</b> in efficiency savings. <br><br>However, cloud costs are creeping up ($${latest.Cloud_Cost}). I suggest auditing our BigQuery usage patterns to keep margins healthy.`;
    }
    
    if (question.includes("staff") || question.includes("team")) {
        return `The team's average mood score is <b>${latest.Avg_Employee_Mood_Score}/10</b>. <br><br><b>Advice:</b> Keep overtime below 20 hours. Burnout is the #1 killer of productivity in this sector.`;
    }

    if (question.includes("strategy") || question.includes("advice")) {
        return `<b>Strategic Recommendation:</b><br>
                Given the high lead volume (${latest.New_Leads}), we should pivot to <b>Aggressive Scaling</b>. <br>
                1. Fix all machines.<br>
                2. Train staff to handle the load.<br>
                3. Monitor the Forecast chart for revenue dips.`;
    }

    return "I can provide a <b>KPI Breakdown</b>, conduct a <b>Risk Assessment</b>, or review <b>Financials</b>. What do you need?";
}

// Start
generateWeatherForecast(); // GENERATE WEATHER ONCE ON LOAD
updateScreen();