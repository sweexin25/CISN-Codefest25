/**
 * XENBER DASHBOARD LOGIC (FULLY INTEGRATED)
 * =========================================
 * 1. CSV Parsing & Linear Regression Forecast
 * 2. Time-Aware Simulation (Clock & Load History)
 * 3. AI Chatbot Logic
 * 4. Risk Analysis & Data Blocks
 */

// ==========================================
// PART 0: CSV DATA & MATH HELPERS
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

// Simple Linear Regression for forecasting
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
        // Add organic "jitter" so it doesn't look like a robot line
        let randomVariance = (Math.random() * val * 0.05) - (val * 0.025);
        predictions.push(Math.round(val + randomVariance));
    }
    return predictions;
}

// Prepare Forecasting Data
const historicalData = parseCSV(csvRawData);
const pastRevenue = historicalData.map(d => d.Daily_Revenue);
const pastLeads = historicalData.map(d => d.New_Leads * 300); // Scaled up to match chart axis
const pastDates = historicalData.map(d => d.Date.slice(5)); // Remove '2025-' for cleaner labels

const futureRevenue = calculateTrendAndForecast(pastRevenue, 7);
const futureLeads = calculateTrendAndForecast(pastLeads, 7);

// Generate Future Dates
let lastDate = new Date("2025-11-15");
let futureDates = [];
for(let i=1; i<=7; i++) {
    let d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    futureDates.push((d.getMonth()+1) + "-" + d.getDate());
}

// ==========================================
// CHAPTER 1: THE DATABASE (STATE)
// ==========================================
const database = {
    currentCloud: 'Google BigQuery',
    companySavings: 450000,
    
    // Time-Aware Graph Data
    timeLabels: ['09:00', '10:00', '11:00', '12:00', '13:00'], 
    loadHistory: [45, 50, 48, 55, 60],
    nextSimulatedHour: 14, 
    
    // Staff & Machines
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

// ==========================================
// CHAPTER 2: THE SETUP (CHARTS & DISPLAY)
// ==========================================

// A. Main Chart (Real-Time Load)
const chartContext = document.getElementById('mainChart').getContext('2d');
const dashboardChart = new Chart(chartContext, {
    type: 'line',
    data: {
        labels: database.timeLabels,
        datasets: [{ 
            label: 'Actual Load', 
            data: database.loadHistory, 
            borderColor: '#3b82f6', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            fill: true, 
            tension: 0.4 
        }]
    },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 500 } }
});

// B. Forecast Chart (New Feature)
// We separate past (solid line) and future (dashed line)
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

// C. The Main Function to Draw the Screen
function updateScreen() {
    // 1. Update Big Numbers
    const currentLoad = database.loadHistory[database.loadHistory.length - 1];
    document.getElementById('kpi-load').innerText = currentLoad + "%";
    document.getElementById('kpi-savings').innerText = "$" + database.companySavings.toLocaleString();
    
    // 2. Count Risks
    let riskCount = 0;
    database.employees.forEach(e => { if(e.fatigue > 80) riskCount++; });
    database.machines.forEach(m => { if(m.health < 50) riskCount++; });
    document.getElementById('kpi-alerts').innerText = riskCount;

    // 3. Update CSV Data Blocks (Latest Snapshot)
    // This populates the colored blocks at the top
    const latest = historicalData[historicalData.length - 1];
    if(document.getElementById('blk-date')) {
        document.getElementById('blk-date').innerText = latest.Date;
        document.getElementById('blk-revenue').innerText = "$" + latest.Daily_Revenue.toLocaleString();
        document.getElementById('blk-leads').innerText = latest.New_Leads;
        document.getElementById('blk-users').innerText = latest.Active_Users.toLocaleString();
        document.getElementById('blk-errors').innerText = latest.System_Error_Rate;
        document.getElementById('blk-risk').innerText = latest.Risk_Flag;

        // Advanced Risk Logic: Why is the flag red?
        const riskCard = document.getElementById('blk-risk-card');
        const riskIcon = document.getElementById('blk-risk-icon');
        const riskDetails = document.getElementById('blk-risk-details');
        
        let riskReasons = [];
        if (parseFloat(latest.System_Error_Rate) > 1.0) riskReasons.push("High Error Rate");
        if (latest.Overtime_Hours_Logged > 30) riskReasons.push("High Overtime");
        if (latest.Avg_Employee_Mood_Score < 7.0) riskReasons.push("Low Morale");
        
        let riskText = riskReasons.length > 0 ? "Causes: " + riskReasons.join(", ") : "System Stable";

        if (latest.Risk_Flag === "Critical") {
            riskCard.style.borderLeftColor = "#ef4444"; // Red
            riskIcon.className = "fa-solid fa-triangle-exclamation text-red-500 animate-pulse";
            riskDetails.className = "mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100";
        } else if (latest.Risk_Flag === "High") {
            riskCard.style.borderLeftColor = "#f97316"; // Orange
            riskIcon.className = "fa-solid fa-circle-exclamation text-orange-500";
            riskDetails.className = "mt-2 text-xs font-bold text-orange-600 bg-orange-50 p-2 rounded border border-orange-100";
        } else {
            riskCard.style.borderLeftColor = "#10b981"; // Green
            riskIcon.className = "fa-solid fa-circle-check text-green-500";
            riskDetails.className = "mt-2 text-xs font-semibold text-green-600 bg-green-50 p-2 rounded border border-green-100";
        }
        riskDetails.innerText = riskText;
    }

    // 4. Update Forecast Insight Text
    const projRev = futureRevenue[6];
    const currRev = pastRevenue[pastRevenue.length-1];
    const diff = projRev - currRev;
    if(document.getElementById('forecast-insight')) {
        document.getElementById('forecast-insight').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="p-4 bg-white rounded border"><div class="text-xs text-slate-400 uppercase">Last Revenue</div><div class="font-black text-2xl text-slate-700">$${currRev.toLocaleString()}</div></div>
            <div class="p-4 bg-white rounded border border-purple-200"><div class="text-xs text-slate-400 uppercase">7-Day Prediction</div><div class="font-black text-2xl text-purple-600">$${projRev.toLocaleString()}</div></div>
            <div class="p-4 bg-white rounded border"><div class="text-xs text-slate-400 uppercase">Trend</div><div class="font-black text-2xl ${diff > 0 ? 'text-green-500' : 'text-red-500'}">${diff > 0 ? '▲ UP' : '▼ DOWN'} $${Math.abs(diff).toLocaleString()}</div></div>
        </div>`;
    }

    // 5. Update Charts & Tables
    dashboardChart.data.labels = database.timeLabels; 
    dashboardChart.data.datasets[0].data = database.loadHistory;
    dashboardChart.update();
    drawTables();
    
    // 6. Update AI Advisor (Combines Time-Awareness & Risk Flags)
    const advisorBox = document.getElementById('advisor-feed');
    if (latest.Risk_Flag === "Critical" || riskCount > 0) {
        advisorBox.innerHTML = `<div class="bg-red-900/50 p-3 rounded border border-red-500 text-red-200 text-xs"><i class="fa-solid fa-triangle-exclamation mr-2"></i><b>CRITICAL:</b> Risk Flag is ${latest.Risk_Flag}. ${riskCount} active risks detected.</div>`;
    } else {
        advisorBox.innerHTML = `<div class="bg-green-900/30 p-3 rounded border border-green-500 text-green-200 text-xs"><i class="fa-solid fa-check-circle mr-2"></i><b>OPTIMAL:</b> Systems stable. Forecast suggests growth.</div>`;
    }
}

// Helper: Draw Tables
function drawTables() {
    let dashW = "", fullW = "", dashR = "", fullR = "";
    
    // Generate Employee Rows
    database.employees.forEach((e, i) => {
        let btn = `<span class="text-slate-400 text-xs">OK</span>`, bg = "";
        if (e.fatigue > 80) { 
            btn = `<button onclick="actionRest(${i})" class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold hover:bg-red-200">REST</button>`; 
            bg = "bg-red-50"; 
        } else if (e.score < 70) { 
            btn = `<button onclick="actionTrain(${i})" class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold hover:bg-yellow-200">TRAIN</button>`; 
        }
        
        fullW += `<tr class="border-b ${bg}"><td class="p-4 font-bold">${e.name}</td><td class="p-4">${e.role}</td><td class="p-4">${e.fatigue}%</td><td class="p-4">${e.score}</td><td class="p-4 text-right">${btn}</td></tr>`;
        dashW += `<tr class="border-b"><td class="p-3 font-bold text-xs">${e.name}</td><td class="p-3 text-right">${btn}</td></tr>`;
    });

    // Generate Machine Rows
    database.machines.forEach((m, i) => {
        let btn = `<span class="text-slate-400 text-xs">OK</span>`, bg = "";
        if (m.health < 50) { 
            btn = `<button onclick="actionFix(${i})" class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200">FIX</button>`; 
            bg = "bg-red-50"; 
        }
        fullR += `<tr class="border-b ${bg}"><td class="p-4 font-bold">${m.name}</td><td class="p-4">${m.type}</td><td class="p-4">${Math.floor(m.health)}%</td><td class="p-4 text-right">${btn}</td></tr>`;
        dashR += `<tr class="border-b"><td class="p-3 font-bold text-xs">${m.name}</td><td class="p-3 text-right">${btn}</td></tr>`;
    });

    // Inject HTML
    if(document.getElementById('full-workforce-table')) document.getElementById('full-workforce-table').innerHTML = fullW;
    if(document.getElementById('dash-workforce-table')) document.getElementById('dash-workforce-table').innerHTML = dashW;
    if(document.getElementById('full-resource-table')) document.getElementById('full-resource-table').innerHTML = fullR;
    if(document.getElementById('dash-resource-table')) document.getElementById('dash-resource-table').innerHTML = dashR;
}

// ==========================================
// CHAPTER 3: USER ACTIONS (Navigation & Interaction)
// ==========================================
function switchView(viewName) {
    // Hide all views
    ['dashboard', 'forecast', 'workforce', 'maintenance'].forEach(v => {
        const page = document.getElementById('view-' + v);
        const btn = document.getElementById('btn-' + v);
        if(page) page.classList.add('hidden');
        if(btn) btn.classList.remove('nav-active');
    });
    
    // Show selected view
    document.getElementById('view-' + viewName).classList.remove('hidden');
    document.getElementById('btn-' + viewName).classList.add('nav-active');

    const titles = { 'dashboard': 'Operational Dashboard', 'forecast': 'AI KPI Forecast', 'workforce': 'Workforce Hub', 'maintenance': 'Maintenance Scheduler' };
    document.getElementById('header-title').innerText = titles[viewName];
}

function toggleCloud() {
    database.currentCloud = (database.currentCloud === 'Google BigQuery') ? 'Azure Synapse' : 'Google BigQuery';
    if(document.getElementById('cloud-name')) document.getElementById('cloud-name').innerText = database.currentCloud;
    alert("Switched Data Source to: " + database.currentCloud);
}

function actionRest(index) {
    database.employees[index].fatigue = 0;
    database.employees[index].score += 5;
    alert("Rest approved for " + database.employees[index].name);
    updateScreen();
}

function actionTrain(index) {
    database.employees[index].score += 10;
    alert("Training assigned to " + database.employees[index].name);
    updateScreen();
}

function actionFix(index) {
    database.machines[index].health = 100;
    database.companySavings += 5000;
    alert("Maintenance dispatched for " + database.machines[index].name);
    updateScreen();
}

function resetSimulation() { location.reload(); }

// ==========================================
// CHAPTER 4: AI LOGIC (SIMULATION & CHAT)
// ==========================================

// A. Real-Time Clock (1s)
setInterval(() => {
    const now = new Date();
    if(document.getElementById('live-clock')) {
        document.getElementById('live-clock').innerText = now.toLocaleTimeString('en-US', { hour12: false });
    }
}, 1000);

// B. Simulation Heartbeat (2s)
setInterval(() => {
    let newLoad = Math.floor(Math.random() * 30) + 50; 
    
    let nextTime = database.nextSimulatedHour + ":00";
    database.nextSimulatedHour++;
    if (database.nextSimulatedHour > 23) database.nextSimulatedHour = 0;

    database.loadHistory.push(newLoad);
    database.loadHistory.shift(); 
    database.timeLabels.push(nextTime);
    database.timeLabels.shift();

    database.machines.forEach(machine => machine.health -= 1);

    updateScreen();
}, 2000);

// C. Chatbot Logic
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
        const aiReply = generateAnswer(userText.toLowerCase());
        displayMessage(aiReply, 'ai');
    }, 600);
}

function displayMessage(text, sender) {
    const chatContainer = document.getElementById('chat-messages');
    const messageWrapper = document.createElement('div');
    if (sender === 'user') {
        messageWrapper.className = "flex justify-end";
        messageWrapper.innerHTML = `<div class="bg-blue-600 text-white p-2 rounded-lg rounded-tr-none max-w-[85%]">${text}</div>`;
    } else {
        messageWrapper.className = "flex justify-start";
        messageWrapper.innerHTML = `<div class="bg-slate-200 text-slate-800 p-2 rounded-lg rounded-tl-none max-w-[85%]">${text}</div>`;
    }
    chatContainer.appendChild(messageWrapper);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function generateAnswer(question) {
    if (question.includes('staff') || question.includes('employee') || question.includes('team')) {
        const tiredPerson = database.employees.find(e => e.fatigue > 80);
        if (tiredPerson) return `Warning: ${tiredPerson.name} is very tired (${tiredPerson.fatigue}% fatigue).`;
        return "Your team is doing great. No high fatigue detected.";
    }
    if (question.includes('money') || question.includes('savings') || question.includes('profit')) {
        return `We have saved $${database.companySavings.toLocaleString()} so far.`;
    }
    if (question.includes('machine') || question.includes('broken') || question.includes('status')) {
        const brokenMachine = database.machines.find(m => m.health < 50);
        if (brokenMachine) return `Alert: ${brokenMachine.name} is in bad health (${brokenMachine.health}%). Fix it in Maintenance.`;
        return "All machines are running normally.";
    }
    if (question.includes('forecast') || question.includes('revenue') || question.includes('prediction')) {
        return "My AI models predict positive revenue growth over the next 7 days. Check the 'KPI Forecast' tab for details.";
    }
    return "I can answer questions about: Staff Fatigue, Machine Status, Revenue Forecasts, or Savings.";
}

// Start the engine
updateScreen();