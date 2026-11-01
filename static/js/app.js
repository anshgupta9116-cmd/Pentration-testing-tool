// ==========================================================================
// CYBERGUARD // MODERN WEB SUITE CONTROLLER (2026)
// ==========================================================================

const socket = io();
let currentScanId = null;
let timerInterval = null;
let scanStartTime = null;

// DOM Elements
const scanForm = document.getElementById('scan-form');
const targetUrlInput = document.getElementById('target_url');
const crawlDepthInput = document.getElementById('crawl_depth');
const startPortInput = document.getElementById('start_port');
const endPortInput = document.getElementById('end_port');
const runPocCheckbox = document.getElementById('run_poc');
const startScanBtn = document.getElementById('start-scan-btn');

const scanFormSection = document.getElementById('scan-form-section');
const progressSection = document.getElementById('progress-section');
const resultsSection = document.getElementById('results-section');
const remediationSection = document.getElementById('remediation-section');

const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const progressStageName = document.getElementById('progress-stage-name');
const progressMessages = document.getElementById('progress-messages');
const auditTimer = document.getElementById('audit-timer');

const resultsContent = document.getElementById('results-content');
const viewReportBtn = document.getElementById('view-report-btn');
const newScanBtn = document.getElementById('new-scan-btn');
const getRemediationBtn = document.getElementById('get-remediation-btn');
const remediationContent = document.getElementById('remediation-content');
const remediationLoading = document.getElementById('remediation-loading');
const closeRemediationBtn = document.getElementById('close-remediation-btn');

const clearTerminalBtn = document.getElementById('clear-terminal-btn');
const refreshHistoryBtn = document.getElementById('refresh-history-btn');

// Preset Buttons
const presetFast = document.getElementById('preset-fast');
const presetStandard = document.getElementById('preset-standard');
const presetDeep = document.getElementById('preset-deep');

// Stage friendly names
const STAGE_LABELS = {
    'initializing': 'Initializing Penetration Engine...',
    'crawling': 'Phase 1: Web Spider Surface Mapping...',
    'port_scanning': 'Phase 2: Hybrid TCP/Service Port Scanner...',
    'passive_scanning': 'Phase 3: Passive Security Headers & SSL Audit...',
    'active_scanning': 'Phase 4: Active Vulnerability Fuzzing (SQLi/XSS)...',
    'poc': 'Phase 5: Proof-of-Concept Module...',
    'reporting': 'Final Phase: Generating Interactive HTML Report...',
    'complete': 'Audit Completed Successfully',
    'error': 'Audit Interrupted / Error Occurred'
};

// ==========================================================================
// Preset Handlers
// ==========================================================================
function setPreset(activeBtn, depth, startPort, endPort, url = null) {
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
    crawlDepthInput.value = depth;
    startPortInput.value = startPort;
    endPortInput.value = endPort;
    if (url) {
        targetUrlInput.value = url;
    }
}

if (presetFast) {
    presetFast.addEventListener('click', () => {
        setPreset(presetFast, 1, 80, 80, 'http://testphp.vulnweb.com/');
    });
}

if (presetStandard) {
    presetStandard.addEventListener('click', () => {
        setPreset(presetStandard, 1, 80, 443);
    });
}

if (presetDeep) {
    presetDeep.addEventListener('click', () => {
        setPreset(presetDeep, 2, 1, 1024);
    });
}

// ==========================================================================
// Timer Utility
// ==========================================================================
function startAuditTimer() {
    stopAuditTimer();
    scanStartTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - scanStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        if (auditTimer) {
            auditTimer.querySelector('span').textContent = `${mins}:${secs}`;
        }
    }, 1000);
}

function stopAuditTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ==========================================================================
// WebSocket Handlers
// ==========================================================================
socket.on('connect', () => {
    addMessage('Connected to live audit daemon via WebSocket.', 'info');
});

socket.on('scan_progress', (data) => {
    if (data.scan_id === currentScanId) {
        updateProgress(data);
    }
});

// ==========================================================================
// Form Submission
// ==========================================================================
scanForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        target_url: targetUrlInput.value.trim(),
        crawl_depth: parseInt(crawlDepthInput.value),
        start_port: parseInt(startPortInput.value),
        end_port: parseInt(endPortInput.value),
        run_poc: runPocCheckbox.checked
    };

    try {
        startScanBtn.disabled = true;
        startScanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing Daemon...';

        const response = await fetch('/api/scan/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            currentScanId = result.scan_id;
            startScan(formData.target_url);
            addMessage(`Session authenticated. Audit launched: ${result.scan_id}`, 'success');
        } else {
            addMessage(`Launch error: ${result.error}`, 'error');
            startScanBtn.disabled = false;
            startScanBtn.innerHTML = '<i class="fas fa-bolt-lightning"></i> Launch Penetration Audit';
        }
    } catch (error) {
        addMessage(`Network error during scan trigger: ${error.message}`, 'error');
        startScanBtn.disabled = false;
        startScanBtn.innerHTML = '<i class="fas fa-bolt-lightning"></i> Launch Penetration Audit';
    }
});

function startScan(targetUrl) {
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    scanFormSection.style.display = 'none';
    if (remediationSection) remediationSection.style.display = 'none';

    updateProgress({ progress: 0, stage: 'initializing', message: `Initializing audit pipeline against: ${targetUrl}` });

    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active', 'completed');
    });

    startAuditTimer();
    pollScanStatus();
}

function updateProgress(data) {
    const progress = data.progress !== undefined && data.progress !== null ? data.progress : 0;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;

    if (progressStageName && data.stage) {
        progressStageName.textContent = STAGE_LABELS[data.stage] || `Stage: ${data.stage}`;
    }

    // Update active stage
    const stageElement = document.getElementById(`stage-${data.stage}`);
    if (stageElement) {
        document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));

        const stages = ['crawling', 'port_scanning', 'passive_scanning', 'active_scanning', 'reporting'];
        const currentIndex = stages.indexOf(data.stage);
        for (let i = 0; i < currentIndex; i++) {
            const prevStage = document.getElementById(`stage-${stages[i]}`);
            if (prevStage) {
                prevStage.classList.add('completed');
                prevStage.classList.remove('active');
            }
        }
        stageElement.classList.add('active');
    }

    // Log message
    if (data.message) {
        addMessage(data.message, data.stage === 'error' ? 'error' : (progress >= 100 ? 'success' : 'info'));
    }

    // Completion Check
    if (data.stage === 'complete' || progress >= 100) {
        stopAuditTimer();
        setTimeout(() => {
            showResults();
        }, 1500);
    }
}

function addMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `<strong>[${timestamp}]</strong> ${escapeHtml(message)}`;
    progressMessages.appendChild(messageDiv);
    progressMessages.scrollTop = progressMessages.scrollHeight;
}

if (clearTerminalBtn) {
    clearTerminalBtn.addEventListener('click', () => {
        progressMessages.innerHTML = '';
        addMessage('Terminal console cleared.', 'info');
    });
}

// ==========================================================================
// Status Polling
// ==========================================================================
async function pollScanStatus() {
    if (!currentScanId) return;

    try {
        const response = await fetch(`/api/scan/${currentScanId}/status`);
        const status = await response.json();

        if (status.status === 'complete') {
            stopAuditTimer();
            showResults();
        } else if (status.status === 'error') {
            stopAuditTimer();
            addMessage(`Scan encountered fatal error: ${status.error}`, 'error');
            startScanBtn.disabled = false;
            startScanBtn.innerHTML = '<i class="fas fa-bolt-lightning"></i> Launch Penetration Audit';
        } else {
            setTimeout(pollScanStatus, 2000);
        }
    } catch (error) {
        console.error('Error polling scan status:', error);
        setTimeout(pollScanStatus, 4000);
    }
}

// ==========================================================================
// Display Results
// ==========================================================================
async function showResults() {
    try {
        const response = await fetch(`/api/scan/${currentScanId}/status`);
        const status = await response.json();

        if (status.report_path) {
            viewReportBtn.style.display = 'inline-flex';
            viewReportBtn.onclick = () => {
                window.open(`/api/scan/${currentScanId}/report`, '_blank');
            };
        }

        if (status.status === 'complete') {
            getRemediationBtn.style.display = 'inline-flex';
        }

        const scansResponse = await fetch('/api/scans');
        const scansData = await scansResponse.json();
        const currentScan = scansData.scans.find(s => s.scan_id === currentScanId);

        if (currentScan && currentScan.summary) {
            const summary = currentScan.summary;
            const isDanger = summary.vulnerabilities > 0;
            const grade = summary.grade || 'N/A';
            const gradeClass = (grade === 'A' || grade === 'B') ? 'success' : (grade === 'F' ? 'danger' : 'warning');

            resultsContent.innerHTML = `
                <div class="results-summary">
                    <div class="summary-box ${gradeClass}">
                        <h3>Security Grade</h3>
                        <div class="value">${grade}</div>
                    </div>
                    <div class="summary-box ${isDanger ? 'danger' : 'success'}">
                        <h3>Vulnerabilities</h3>
                        <div class="value">${summary.vulnerabilities}</div>
                    </div>
                    <div class="summary-box">
                        <h3>Pages Crawled</h3>
                        <div class="value">${summary.pages_crawled}</div>
                    </div>
                    <div class="summary-box">
                        <h3>Open Ports</h3>
                        <div class="value">${summary.open_ports}</div>
                    </div>
                </div>
            `;
        } else {
            resultsContent.innerHTML = '<p style="padding: 20px 0; color: #34d399;"><i class="fas fa-check-circle"></i> Penetration audit completed successfully!</p>';
        }

        resultsSection.style.display = 'block';
        progressSection.style.display = 'none';
        startScanBtn.disabled = false;
        startScanBtn.innerHTML = '<i class="fas fa-bolt-lightning"></i> Launch Penetration Audit';

        loadScansList();
    } catch (error) {
        console.error('Error showing results:', error);
        addMessage(`Error rendering findings: ${error.message}`, 'error');
    }
}

// ==========================================================================
// AI Remediation Engine
// ==========================================================================
getRemediationBtn.addEventListener('click', async () => {
    try {
        remediationSection.style.display = 'block';
        remediationLoading.style.display = 'block';
        remediationContent.innerHTML = '';
        remediationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const scanDataResponse = await fetch(`/api/scan/${currentScanId}/data`);
        if (!scanDataResponse.ok) {
            throw new Error('Failed to retrieve structured findings context');
        }
        const scanData = await scanDataResponse.json();
        scanData['provider'] = 'gemini';

        const remediationResponse = await fetch('/api/remediation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scanData)
        });

        if (!remediationResponse.ok) {
            const errJson = await remediationResponse.json();
            throw new Error(errJson.error || 'Failed to synthesize AI remediation advice');
        }

        const remediations = await remediationResponse.json();
        remediationLoading.style.display = 'none';
        displayRemediationReport(remediations);

    } catch (error) {
        console.error('Error in AI remediation:', error);
        remediationLoading.style.display = 'none';
        remediationContent.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px; border-radius: 12px; margin-top: 15px;">
                <h4 style="color: #f87171; margin-bottom: 6px;"><i class="fas fa-triangle-exclamation"></i> AI Engine Notification</h4>
                <p style="font-size: 0.9rem; color: #cbd5e1;">${escapeHtml(error.message)}</p>
                <small style="color: #94a3b8; display: block; margin-top: 8px;">Ensure your <code>GEMINI_API_KEY</code> is configured in the <code>.env</code> file if querying live Google Gemini APIs.</small>
            </div>
        `;
    }
});

function displayRemediationReport(remediations) {
    const summary = remediations.summary || {};
    const provider = remediations.provider || 'Gemini Pro';

    let html = `
        <div class="remediation-header">
            <div class="provider-badge">
                <i class="fas fa-robot"></i> ${provider.toUpperCase()} ARCHITECTURAL REMEDIATION
            </div>
            <div class="remediation-summary">
                <div class="summary-stat">
                    <span class="stat-label">Total Vulnerabilities</span>
                    <span class="stat-value">${summary.total_vulnerabilities || 0}</span>
                </div>
                <div class="summary-stat critical">
                    <span class="stat-label">Critical / High</span>
                    <span class="stat-value">${summary.critical_count || 0}</span>
                </div>
                <div class="summary-stat medium">
                    <span class="stat-label">Medium</span>
                    <span class="stat-value">${summary.medium_count || 0}</span>
                </div>
                <div class="summary-stat low">
                    <span class="stat-label">Low / Informational</span>
                    <span class="stat-value">${summary.low_count || 0}</span>
                </div>
            </div>
        </div>
    `;

    // Active vulnerabilities
    if (remediations.active_vulnerabilities && remediations.active_vulnerabilities.length > 0) {
        html += `
            <div class="remediation-section">
                <h3><i class="fas fa-bug" style="color: #ef4444;"></i> Active Injections & Exploits</h3>
                ${remediations.active_vulnerabilities.map((vuln, index) => `
                    <div class="vulnerability-card ${vuln.severity ? vuln.severity.toLowerCase() : 'critical'}">
                        <div class="vuln-header">
                            <h4>#${index + 1} ${escapeHtml(vuln.type || 'Vulnerability')}</h4>
                            <span class="severity-badge ${vuln.severity ? vuln.severity.toLowerCase() : 'critical'}">${vuln.severity || 'HIGH'}</span>
                        </div>
                        <div class="vuln-details">
                            <p><strong>Endpoint:</strong> <code>${escapeHtml(vuln.url || 'N/A')}</code></p>
                            ${vuln.parameter ? `<p><strong>Vulnerable Parameter:</strong> <code>${escapeHtml(vuln.parameter)}</code></p>` : ''}
                        </div>
                        <div class="remediation-advice">
                            <h5><i class="fas fa-shield-halved"></i> Recommended Architectural Mitigation:</h5>
                            <p class="remediation-summary">${escapeHtml(vuln.remediation ? vuln.remediation.summary : 'Sanitize and parameterize all input queries.')}</p>
                            ${vuln.remediation && vuln.remediation.details && vuln.remediation.details.length > 0 ? `
                                <ul class="remediation-steps">
                                    ${vuln.remediation.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Passive vulnerabilities
    if (remediations.passive_vulnerabilities && remediations.passive_vulnerabilities.length > 0) {
        html += `
            <div class="remediation-section">
                <h3><i class="fas fa-shield-virus" style="color: #38bdf8;"></i> Passive Configuration & Header Flaws</h3>
                ${remediations.passive_vulnerabilities.map((vuln, index) => `
                    <div class="vulnerability-card ${vuln.severity ? vuln.severity.toLowerCase() : 'medium'}">
                        <div class="vuln-header">
                            <h4>#${index + 1} ${escapeHtml(vuln.type || 'Header Missing')}</h4>
                            <span class="severity-badge ${vuln.severity ? vuln.severity.toLowerCase() : 'medium'}">${vuln.severity || 'MEDIUM'}</span>
                        </div>
                        <div class="remediation-advice">
                            <p class="remediation-summary">${escapeHtml(vuln.remediation ? vuln.remediation.summary : 'Enforce defensive security headers in web configuration.')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Port recommendations
    if (remediations.port_recommendations && remediations.port_recommendations.length > 0) {
        html += `
            <div class="remediation-section">
                <h3><i class="fas fa-network-wired" style="color: #10b981;"></i> Service Hardening Recommendations</h3>
                ${remediations.port_recommendations.map(rec => `
                    <div class="vulnerability-card low">
                        <div class="vuln-header">
                            <h4>Port ${rec.port} (${rec.protocol || 'TCP'})</h4>
                            <span class="severity-badge low">${rec.status || 'OPEN'}</span>
                        </div>
                        <p class="remediation-summary">${escapeHtml(rec.recommendation || 'Verify service authentication.')}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    remediationContent.innerHTML = html;
}

closeRemediationBtn.addEventListener('click', () => {
    remediationSection.style.display = 'none';
});

newScanBtn.addEventListener('click', () => {
    currentScanId = null;
    stopAuditTimer();
    progressSection.style.display = 'none';
    resultsSection.style.display = 'none';
    scanFormSection.style.display = 'block';
    progressMessages.innerHTML = '';
    viewReportBtn.style.display = 'none';
});

// ==========================================================================
// Scan History
// ==========================================================================
async function loadScansList() {
    try {
        const response = await fetch('/api/scans');
        const data = await response.json();
        const scansList = document.getElementById('scans-list');

        if (!data.scans || data.scans.length === 0) {
            scansList.innerHTML = '<p class="loading" style="color: #64748b; font-size: 0.9rem;">No audit records found.</p>';
            return;
        }

        scansList.innerHTML = data.scans.map(scan => {
            const hasReport = !!scan.report_path;
            const isComplete = scan.status === 'complete' || !!scan.summary;
            const statusClass = scan.status === 'running' ? 'running' : (scan.status === 'error' ? 'error' : 'complete');
            const statusLabel = (scan.status || 'COMPLETE').toUpperCase();

            return `
                <div class="scan-item">
                    <div class="scan-info">
                        <h4><i class="fas fa-globe" style="color: #38bdf8;"></i> ${escapeHtml(scan.target_url)}</h4>
                        <p>Timestamp: ${new Date(scan.start_time).toLocaleString()}</p>
                        ${scan.summary ? `
                            <div class="scan-meta-stats">
                                <span class="meta-chip"><i class="fas fa-bug"></i> ${scan.summary.vulnerabilities} Vulns</span>
                                <span class="meta-chip"><i class="fas fa-network-wired"></i> ${scan.summary.open_ports} Ports</span>
                                <span class="meta-chip"><i class="fas fa-award"></i> Grade: ${scan.summary.grade}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="scan-status ${statusClass}">
                            ${statusLabel}
                        </span>
                        ${(hasReport || (scan.scan_id === currentScanId && isComplete)) ? `
                            <button class="cyber-btn cyber-btn-success" style="padding: 7px 14px; font-size: 0.8rem;" 
                                    onclick="window.open('/api/scan/${scan.scan_id}/report', '_blank')">
                                <i class="fas fa-file-lines"></i> Report
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading scans list:', error);
    }
}

if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', () => {
        loadScansList();
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initial Load & Refresh Interval
loadScansList();
setInterval(loadScansList, 10000);
