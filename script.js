// --- 1. CSV DATA & PARSING ---
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
2025-11-15,19000,70,1500,7.4,40,135,0.90%,700,High`;

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

// --- 2. FORECAST MATH (Linear Regression) ---
function calculateTrendAndForecast(dataArray, daysToPredict) {
    const n = dataArray.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dataArray[i];
        sumXY += i * dataArray[i];
        sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    let predictions = [];
    for (let i = 1; i <= daysToPredict; i++) {
        let val = (slope * (n - 1 + i)) + intercept;
        let randomVariance = (Math.random() * val * 0.05) - (val * 0.025);
        predictions.push(Math.round(val + randomVariance));
    }
    return predictions;
}

// --- 3. STATE & DATA PREP ---
const historicalData = parseCSV(csvRawData);
const pastRevenue = historicalData.map(d => d.Daily_Revenue);
const pastLeads = historicalData.map(d => d.New_Leads * 300);
const pastDates = historicalData.map(d => d.Date.slice(5));

const futureRevenue = calculateTrendAndForecast(pastRevenue, 7);
const futureLeads = calculateTrendAndForecast(pastLeads, 7);

let lastDate = new Date("2025-11-15");
let futureDates = [];
for(let i=1; i<=7; i++) {
    let d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    futureDates.push((d.getMonth()+1) + "-" + d.getDate());
}

const appState = {
    currentView: 'dashboard',
    cloudProvider: 'Google BigQuery',
    history: [45, 50, 48, 55, 60],
    employees: [
        { name: "Sarah J.", role: "Engineer", fatigue: 20, score: 95 },
        { name: "Mike R.", role: "Logistics", fatigue: 85, score: 60 },
        { name: "Jessica T.", role: "Sales", fatigue: 40, score: 88 },
        { name: "David B.", role: "Manager", fatigue: 55, score: 75 }
    ],
    machines: [
        { name: "Server Cluster A", type: "IT", health: 98 },
        { name: "Assembly Line 1", type: "Factory", health: 45 },
        { name: "Delivery Truck 4", type: "Fleet", health: 80 }
    ]
};

// --- 4. CHARTS ---
const ctxMain = document.getElementById('mainChart').getContext('2d');
const mainChart = new Chart(ctxMain, {
    type: 'line',
    data: { labels: ['10:00', '11:00', '12:00', '13:00', '14:00'], datasets: [{ label: 'System Load', data: appState.history, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
});

const allLabels = [...pastDates, ...futureDates];
const chartDataRevPast = [...pastRevenue, ...Array(7).fill(null)];
const chartDataRevFuture = [...Array(14).fill(null), pastRevenue[pastRevenue.length-1], ...futureRevenue];
const chartDataLeadsPast = [...pastLeads, ...Array(7).fill(null)];
const chartDataLeadsFuture = [...Array(14).fill(null), pastLeads[pastLeads.length-1], ...futureLeads];

const ctxForecast = document.getElementById('forecastChart').getContext('2d');
const forecastChart = new Chart(ctxForecast, {
    type: 'line',
    data: {
        labels: allLabels,
        datasets: [
            { label: 'Revenue (Actual)', data: chartDataRevPast, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 },
            { label: 'Revenue (Forecast)', data: chartDataRevFuture, borderColor: '#10b981', borderDash: [5, 5], pointStyle: 'rectRot', tension: 0.3 },
            { label: 'Leads (Indicator)', data: chartDataLeadsPast, borderColor: '#f59e0b', tension: 0.3 },
            { label: 'Leads (Forecast)', data: chartDataLeadsFuture, borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.3 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
});

// --- 5. LOGIC & NAVIGATION ---
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

function manageEmployee(index, action) {
    if (action === 'rest') { appState.employees[index].fatigue = 0; appState.employees[index].score += 10; } 
    else { appState.employees[index].score += 15; }
    updateScreen();
}

function fixMachine(index) {
    appState.machines[index].health = 100;
    updateScreen();
}

function toggleCloud() {
    appState.cloudProvider = appState.cloudProvider === 'Google BigQuery' ? 'Azure Synapse' : 'Google BigQuery';
    document.getElementById('cloud-name').innerText = appState.cloudProvider;
}

function resetSimulation() { location.reload(); }

// --- 6. RENDER LOOP ---
function updateScreen() {
    // Get Latest CSV Data (Simulate "Latest" by taking last item)
    const latest = historicalData[historicalData.length - 1];

    // --- POPULATE THE NEW BLOCKS ---
    document.getElementById('blk-date').innerText = latest.Date;
    document.getElementById('blk-revenue').innerText = "$" + latest.Daily_Revenue.toLocaleString();
    document.getElementById('blk-leads').innerText = latest.New_Leads;
    document.getElementById('blk-users').innerText = latest.Active_Users.toLocaleString();
    document.getElementById('blk-errors').innerText = latest.System_Error_Rate;
    document.getElementById('blk-risk').innerText = latest.Risk_Flag;

    // Risk Logic & Styling
    const riskCard = document.getElementById('blk-risk-card');
    const riskIcon = document.getElementById('blk-risk-icon');
    const riskDetails = document.getElementById('blk-risk-details');
    
    let riskReasons = [];
    // Parse Error Rate string to float (e.g. "3.20%" -> 3.20)
    const errorRate = parseFloat(latest.System_Error_Rate);
    
    // Logic for reasons
    if (errorRate > 1.0) riskReasons.push("High Error Rate (" + latest.System_Error_Rate + ")");
    if (latest.Overtime_Hours_Logged > 30) riskReasons.push("High Overtime (" + latest.Overtime_Hours_Logged + "h)");
    if (latest.Avg_Employee_Mood_Score < 7.0) riskReasons.push("Low Morale (" + latest.Avg_Employee_Mood_Score + ")");
    
    let riskText = riskReasons.length > 0 ? "Causes: " + riskReasons.join(", ") : "No immediate threats detected.";

    if (latest.Risk_Flag === "Critical") {
        riskCard.style.borderLeftColor = "#ef4444"; // Red
        riskIcon.className = "fa-solid fa-triangle-exclamation text-red-500 animate-pulse";
        riskDetails.className = "mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100";
    } 
    else if (latest.Risk_Flag === "High") {
        riskCard.style.borderLeftColor = "#f97316"; // Orange
        riskIcon.className = "fa-solid fa-circle-exclamation text-orange-500";
        riskDetails.className = "mt-2 text-xs font-bold text-orange-600 bg-orange-50 p-2 rounded border border-orange-100";
    } 
    else {
        riskCard.style.borderLeftColor = "#10b981"; // Green
        riskIcon.className = "fa-solid fa-circle-check text-green-500";
        riskDetails.className = "mt-2 text-xs font-semibold text-green-600 bg-green-50 p-2 rounded border border-green-100";
    }
    
    riskDetails.innerText = riskText;


    // Existing Logic
    let risks = 0;
    appState.employees.forEach(e => { if(e.fatigue > 80) risks++; });
    appState.machines.forEach(m => { if(m.health < 50) risks++; });
    renderTables();

    // Advisor Update
    const advisor = document.getElementById('advisor-feed');
    if (latest.Risk_Flag === "Critical" || risks > 0) {
        advisor.innerHTML = `<div class="bg-red-900/50 p-3 rounded border border-red-500 text-red-200 text-xs"><i class="fa-solid fa-triangle-exclamation mr-2"></i><b>CRITICAL ALERT:</b> Risk Flag is ${latest.Risk_Flag}. System Error Rate at ${latest.System_Error_Rate}. Immediate action needed.</div>`;
    } else {
        advisor.innerHTML = `<div class="bg-green-900/30 p-3 rounded border border-green-500 text-green-200 text-xs"><i class="fa-solid fa-check-circle mr-2"></i><b>OPTIMAL:</b> Operations stable. Revenue trend positive.</div>`;
    }

    // Forecast Insight
    const projRev = futureRevenue[6];
    const currRev = pastRevenue[pastRevenue.length-1];
    const diff = projRev - currRev;
    document.getElementById('forecast-insight').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="p-4 bg-white rounded border"><div class="text-xs text-slate-400 uppercase">Last Revenue</div><div class="font-black text-2xl text-slate-700">$${currRev.toLocaleString()}</div></div>
            <div class="p-4 bg-white rounded border border-purple-200"><div class="text-xs text-slate-400 uppercase">7-Day Prediction</div><div class="font-black text-2xl text-purple-600">$${projRev.toLocaleString()}</div></div>
            <div class="p-4 bg-white rounded border"><div class="text-xs text-slate-400 uppercase">Trend</div><div class="font-black text-2xl ${diff > 0 ? 'text-green-500' : 'text-red-500'}">${diff > 0 ? '▲ UP' : '▼ DOWN'} $${Math.abs(diff).toLocaleString()}</div></div>
        </div>`;
}

function renderTables() {
    let dashW = "", fullW = "", dashR = "", fullR = "";
    appState.employees.forEach((e, i) => {
        let btn = `<span class="text-slate-400 text-xs">OK</span>`, bg = "";
        if (e.fatigue > 80) { btn = `<button onclick="manageEmployee(${i}, 'rest')" class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">REST</button>`; bg = "bg-red-50"; }
        fullW += `<tr class="border-b ${bg}"><td class="p-4 font-bold">${e.name}</td><td class="p-4">${e.role}</td><td class="p-4">${e.fatigue}%</td><td class="p-4">${e.score}</td><td class="p-4 text-right">${btn}</td></tr>`;
        dashW += `<tr class="border-b"><td class="p-3 font-bold text-xs">${e.name}</td><td class="p-3 text-right">${btn}</td></tr>`;
    });
    appState.machines.forEach((m, i) => {
        let btn = `<span class="text-slate-400 text-xs">OK</span>`, bg = "";
        if (m.health < 50) { btn = `<button onclick="fixMachine(${i})" class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">FIX</button>`; bg = "bg-red-50"; }
        fullR += `<tr class="border-b ${bg}"><td class="p-4 font-bold">${m.name}</td><td class="p-4">${m.type}</td><td class="p-4">${Math.floor(m.health)}%</td><td class="p-4 text-right">${btn}</td></tr>`;
        dashR += `<tr class="border-b"><td class="p-3 font-bold text-xs">${m.name}</td><td class="p-3 text-right">${btn}</td></tr>`;
    });
    document.getElementById('full-workforce-table').innerHTML = fullW; document.getElementById('dash-workforce-table').innerHTML = dashW;
    document.getElementById('full-resource-table').innerHTML = fullR; document.getElementById('dash-resource-table').innerHTML = dashR;
}

setInterval(() => {
    appState.history.push(Math.floor(Math.random() * 30) + 50); appState.history.shift();
    mainChart.update();
    appState.machines.forEach(m => m.health -= 0.5);
    updateScreen();
}, 2000);

updateScreen();