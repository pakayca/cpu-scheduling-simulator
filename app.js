const algoSelect = document.getElementById('algorithm');
const quantumContainer = document.getElementById('quantum-container');
const quantumInput = document.getElementById('quantum');
const pNameInput = document.getElementById('p-name');
const arrTimeInput = document.getElementById('arr-time');
const burstTimeInput = document.getElementById('burst-time');
const addBtn = document.getElementById('add-btn');
const simulateBtn = document.getElementById('simulate-btn');
const clearBtn = document.getElementById('clear-btn');
const tableBody = document.getElementById('table-body');

let processes = [];

// --- EVENT LISTENERS ---
algoSelect.addEventListener('change', (e) => {
    e.target.value === 'RR' 
        ? quantumContainer.classList.remove('hidden') 
        : quantumContainer.classList.add('hidden');
});

addBtn.addEventListener('click', () => {
    const id = pNameInput.value.trim();
    const arrivalTime = parseInt(arrTimeInput.value);
    const burstTime = parseInt(burstTimeInput.value);

    if (!id || isNaN(arrivalTime) || isNaN(burstTime) || burstTime <= 0 || arrivalTime < 0) {
        alert("Invalid input parameters.");
        return;
    }

    if (processes.some(p => p.id === id)) {
        alert("Process ID must be unique.");
        return;
    }

    processes.push({ id, arrivalTime, burstTime });
    pNameInput.value = `P${processes.length + 1}`;
    arrTimeInput.value = "";
    burstTimeInput.value = "";
    renderTable();
});

simulateBtn.addEventListener('click', () => {
    if (processes.length === 0) return;

    const selectedAlgo = algoSelect.value;
    const procs = JSON.parse(JSON.stringify(processes));
    let result;

    switch(selectedAlgo) {
        case 'FCFS': result = runFCFS(procs); break;
        case 'SJF':  result = runSJF(procs); break;
        case 'SRTF': result = runSRTF(procs); break;
        case 'RR':   
            const q = parseInt(quantumInput.value);
            if(isNaN(q) || q <= 0) return alert("Invalid Quantum");
            result = runRR(procs, q); 
            break;
    }

    renderGanttChart(result.gantt);
    renderMetrics(result.avgWT, result.avgTAT);
});

clearBtn.addEventListener('click', () => {
    if (processes.length === 0) return;
    
    processes = [];
    pNameInput.value = "P1";
    renderTable();

    document.getElementById('gantt-chart').innerHTML = '<p class="placeholder-text">Awaiting process data...</p>';
    document.getElementById('gantt-chart').style.display = 'flex';
    document.getElementById('avg-wt').innerHTML = '0.00 <small>ms</small>';
    document.getElementById('avg-tat').innerHTML = '0.00 <small>ms</small>';
});

// --- HELPER FUNCTION ---
function addToGantt(gantt, id, start, end) {
    if (gantt.length > 0 && gantt[gantt.length - 1].id === id) {
        gantt[gantt.length - 1].end = end;
    } else {
        gantt.push({ id, start, end });
    }
}

// --- ALGORITHMS ---

function runFCFS(procs) {
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0, totalWT = 0, totalTAT = 0, gantt = [];

    procs.forEach(p => {
        if (currentTime < p.arrivalTime) {
            addToGantt(gantt, 'IDLE', currentTime, p.arrivalTime);
            currentTime = p.arrivalTime;
        }
        addToGantt(gantt, p.id, currentTime, currentTime + p.burstTime);
        
        let tat = (currentTime + p.burstTime) - p.arrivalTime;
        let wt = tat - p.burstTime;
        totalTAT += tat;
        totalWT += wt;
        currentTime += p.burstTime;
    });

    return { gantt, avgWT: (totalWT/procs.length).toFixed(2), avgTAT: (totalTAT/procs.length).toFixed(2) };
}

function runSJF(procs) {
    let n = procs.length, completed = 0, currentTime = 0, totalWT = 0, totalTAT = 0, gantt = [];
    let isCompleted = new Array(n).fill(false);

    while (completed < n) {
        let idx = -1, min_bt = Infinity;

        for (let i = 0; i < n; i++) {
            if (procs[i].arrivalTime <= currentTime && !isCompleted[i] && procs[i].burstTime < min_bt) {
                min_bt = procs[i].burstTime;
                idx = i;
            }
        }

        if (idx !== -1) {
            addToGantt(gantt, procs[idx].id, currentTime, currentTime + procs[idx].burstTime);
            currentTime += procs[idx].burstTime;
            isCompleted[idx] = true;
            completed++;

            let tat = currentTime - procs[idx].arrivalTime;
            let wt = tat - procs[idx].burstTime;
            totalTAT += tat;
            totalWT += wt;
        } else {
            let nextArrival = Math.min(...procs.filter((p, i) => !isCompleted[i]).map(p => p.arrivalTime));
            addToGantt(gantt, 'IDLE', currentTime, nextArrival);
            currentTime = nextArrival;
        }
    }
    return { gantt, avgWT: (totalWT/n).toFixed(2), avgTAT: (totalTAT/n).toFixed(2) };
}

function runSRTF(procs) {
    let n = procs.length, completed = 0, currentTime = 0, totalWT = 0, totalTAT = 0, gantt = [];
    let rt = procs.map(p => p.burstTime);

    while (completed < n) {
        let idx = -1, min_rt = Infinity;

        for (let i = 0; i < n; i++) {
            if (procs[i].arrivalTime <= currentTime && rt[i] > 0 && rt[i] < min_rt) {
                min_rt = rt[i];
                idx = i;
            }
        }

        if (idx !== -1) {
            addToGantt(gantt, procs[idx].id, currentTime, currentTime + 1);
            rt[idx]--;
            currentTime++;

            if (rt[idx] === 0) {
                completed++;
                let tat = currentTime - procs[idx].arrivalTime;
                let wt = tat - procs[idx].burstTime;
                totalTAT += tat;
                totalWT += wt;
            }
        } else {
            addToGantt(gantt, 'IDLE', currentTime, currentTime + 1);
            currentTime++;
        }
    }
    return { gantt, avgWT: (totalWT/n).toFixed(2), avgTAT: (totalTAT/n).toFixed(2) };
}

function runRR(procs, quantum) {
    let n = procs.length, completed = 0, currentTime = 0, totalWT = 0, totalTAT = 0, gantt = [];
    let rt = procs.map(p => p.burstTime);
    let queue = [];
    let isQueued = new Array(n).fill(false);

    procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

    const checkArrivals = (time) => {
        for (let i = 0; i < n; i++) {
            if (procs[i].arrivalTime <= time && rt[i] > 0 && !isQueued[i]) {
                queue.push(i);
                isQueued[i] = true;
            }
        }
    };

    checkArrivals(currentTime);

    while (completed < n) {
        if (queue.length === 0) {
            let nextArrival = Infinity;
            for (let i = 0; i < n; i++) {
                if (rt[i] > 0 && procs[i].arrivalTime < nextArrival) nextArrival = procs[i].arrivalTime;
            }
            addToGantt(gantt, 'IDLE', currentTime, nextArrival);
            currentTime = nextArrival;
            checkArrivals(currentTime);
        } else {
            let i = queue.shift();
            isQueued[i] = false;

            let execTime = Math.min(quantum, rt[i]);
            addToGantt(gantt, procs[i].id, currentTime, currentTime + execTime);
            currentTime += execTime;
            rt[i] -= execTime;

            checkArrivals(currentTime);

            if (rt[i] === 0) {
                completed++;
                let tat = currentTime - procs[i].arrivalTime;
                let wt = tat - procs[i].burstTime;
                totalTAT += tat;
                totalWT += wt;
            } else {
                queue.push(i);
                isQueued[i] = true;
            }
        }
    }
    return { gantt, avgWT: (totalWT/n).toFixed(2), avgTAT: (totalTAT/n).toFixed(2) };
}

// --- DOM RENDERERS ---
function renderTable() {
    tableBody.innerHTML = '';
    if (processes.length === 0) {
        tableBody.innerHTML = `<tr id="empty-row"><td colspan="4" class="empty-message">No processes added yet.</td></tr>`;
        return;
    }
    processes.forEach((p, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.id}</td><td>${p.arrivalTime}</td><td>${p.burstTime}</td>
                         <td><button class="delete-btn" onclick="deleteProcess(${index})">Delete</button></td>`;
        tableBody.appendChild(row);
    });
}

window.deleteProcess = function(index) {
    processes.splice(index, 1);
    pNameInput.value = `P${processes.length + 1}`;
    renderTable();
}

function renderMetrics(avgWT, avgTAT) {
    document.getElementById('avg-wt').innerHTML = `${avgWT} <small>ms</small>`;
    document.getElementById('avg-tat').innerHTML = `${avgTAT} <small>ms</small>`;
}

function renderGanttChart(ganttData) {
    const wrapper = document.getElementById('gantt-chart');
    wrapper.innerHTML = '';
    const totalTime = ganttData[ganttData.length - 1].end;
    const barContainer = document.createElement('div');
    barContainer.style.display = 'flex';
    barContainer.style.width = '100%';
    barContainer.style.height = '40px';
    barContainer.style.borderRadius = '4px';
    barContainer.style.overflow = 'hidden';
    barContainer.style.border = '1px solid var(--border-color)';

    const timelineContainer = document.createElement('div');
    timelineContainer.style.position = 'relative';
    timelineContainer.style.width = '100%';
    timelineContainer.style.height = '20px';
    timelineContainer.style.marginTop = '4px';

    ganttData.forEach((block, index) => {
        const duration = block.end - block.start;
        const widthPercent = (duration / totalTime) * 100;
        const blockDiv = document.createElement('div');
        blockDiv.style.width = `${widthPercent}%`;
        blockDiv.style.backgroundColor = block.id === 'IDLE' ? '#2d2d2d' : '#0e639c';
        blockDiv.style.borderRight = index !== ganttData.length - 1 ? '1px solid #1e1e1e' : 'none';
        blockDiv.style.color = '#fff';
        blockDiv.style.display = 'flex';
        blockDiv.style.alignItems = 'center';
        blockDiv.style.justifyContent = 'center';
        blockDiv.style.fontSize = '0.8rem';
        blockDiv.style.fontWeight = '500';
        blockDiv.style.overflow = 'hidden';
        
        if (widthPercent > 4) {
            blockDiv.textContent = block.id;
        }
        blockDiv.title = `${block.id} (${block.start}ms - ${block.end}ms)`
        barContainer.appendChild(blockDiv);

        const startMarker = document.createElement('div');
        startMarker.textContent = block.start;
        startMarker.style.position = 'absolute';
        const leftPercent = (block.start / totalTime) * 100;
        startMarker.style.left = `${leftPercent}%`;
        startMarker.style.transform = 'translateX(-50%)';
        startMarker.style.fontSize = '0.75rem';
        startMarker.style.color = 'var(--text-muted)';
        startMarker.style.fontFamily = "'Fira Code', monospace";
        timelineContainer.appendChild(startMarker);

        if (index === ganttData.length - 1) {
            const endMarker = document.createElement('div');
            endMarker.textContent = block.end;
            endMarker.style.position = 'absolute';
            endMarker.style.left = '100%';
            endMarker.style.transform = 'translateX(-50%)';
            endMarker.style.fontSize = '0.75rem';
            endMarker.style.color = 'var(--text-muted)';
            endMarker.style.fontFamily = "'Fira Code', monospace";
            timelineContainer.appendChild(endMarker);
        }
    });

    wrapper.appendChild(barContainer);
    wrapper.appendChild(timelineContainer);
}