const API_BASE = 'http://localhost:3001/api';

let agents = [];
let tasks = [];
let vulnerabilities = [];
let securityEvents = [];
let assets = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadData();
});

// 导航
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    // 更新导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // 更新页面
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`page-${page}`).classList.add('active');

    // 更新标题
    const titles = {
        'dashboard': '系统上线场景',
        'agents': '智能体管理',
        'tasks': '任务中心',
        'security': '安全态势',
        'assets': '资产管理'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
}

// 加载数据
async function loadData() {
    try {
        const [agentsRes, tasksRes, vulnRes, eventsRes, assetsRes] = await Promise.all([
            fetch(`${API_BASE}/agents`),
            fetch(`${API_BASE}/tasks`),
            fetch(`${API_BASE}/security/vulnerabilities`),
            fetch(`${API_BASE}/security/events`),
            fetch(`${API_BASE}/security/assets`)
        ]);

        agents = await agentsRes.json();
        tasks = await tasksRes.json();
        vulnerabilities = await vulnRes.json();
        securityEvents = await eventsRes.json();
        assets = await assetsRes.json();

        renderAll();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function renderAll() {
    renderAgentList();
    renderAgentGrid();
    renderPendingTasks();
    renderTasksTable();
    renderSecurityEvents();
    renderVulnTable();
    renderAssetsGrid();
    renderTaskModal();
    updateSecurityStats();
}

// 渲染智能体列表
function renderAgentList() {
    const container = document.getElementById('agentList');
    container.innerHTML = agents.map(agent => `
        <div class="agent-list-item" onclick="executeAgent('${agent.id}')">
            <div class="agent-icon ${agent.type}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
            </div>
            <div class="agent-info">
                <h4>${agent.name}</h4>
                <p>${agent.capabilities.join('、')}</p>
            </div>
            <div class="agent-status"></div>
        </div>
    `).join('');
}

// 渲染智能体网格
function renderAgentGrid() {
    const container = document.getElementById('agentsGrid');
    const typeColors = {
        'security': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        'compliance': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
        'testing': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
    };
    
    container.innerHTML = agents.map(agent => `
        <div class="agent-card">
            <div class="agent-card-header">
                <div class="agent-card-icon" style="background: ${typeColors[agent.type] || typeColors.security}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4"/>
                    </svg>
                </div>
                <span class="badge">${agent.status === 'active' ? '在线' : '离线'}</span>
            </div>
            <h3>${agent.name}</h3>
            <p>${agent.description}</p>
            <div class="agent-capabilities">
                ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
            </div>
            <button class="btn btn-primary" style="width: 100%" onclick="executeAgent('${agent.id}')">
                执行智能体
            </button>
        </div>
    `).join('');
}

// 渲染待审批任务
function renderPendingTasks() {
    const container = document.getElementById('pendingTasks');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    document.getElementById('pendingCount').textContent = pendingTasks.length;

    if (pendingTasks.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">暂无待审批任务</p>';
        return;
    }

    container.innerHTML = pendingTasks.map(task => `
        <div class="event-item" style="cursor: pointer" onclick="showTaskDetail('${task.id}')">
            <div class="event-severity medium"></div>
            <div class="event-info">
                <h4>${task.name}</h4>
                <p>${task.agent_name} · ${task.created_at}</p>
            </div>
        </div>
    `).join('');
}

// 渲染任务表格
function renderTasksTable() {
    const container = document.getElementById('tasksTable');
    
    if (tasks.length === 0) {
        container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">暂无任务</td></tr>';
        return;
    }

    container.innerHTML = tasks.map(task => `
        <tr>
            <td style="cursor: pointer; color: var(--accent-primary);" onclick="showTaskDetail('${task.id}')">${task.name}</td>
            <td>${task.agent_name}</td>
            <td><span class="task-status ${task.status}">${getStatusText(task.status)}</span></td>
            <td style="color: var(--text-muted); font-family: var(--font-mono);">${task.created_at}</td>
            <td>
                <button class="btn btn-icon" onclick="showTaskDetail('${task.id}')" title="查看详情">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'pending': '待审批',
        'running': '执行中',
        'completed': '已完成',
        'approved': '已通过',
        'rejected': '已拒绝'
    };
    return statusMap[status] || status;
}

// 渲染安全事件
function renderSecurityEvents() {
    const container = document.getElementById('securityEvents');
    container.innerHTML = securityEvents.map(event => `
        <div class="event-item">
            <div class="event-severity ${event.severity}"></div>
            <div class="event-info">
                <h4>${event.event_type}</h4>
                <p>${event.description}</p>
            </div>
            <div class="event-time">${event.timestamp}</div>
        </div>
    `).join('');
}

// 渲染漏洞表格
function renderVulnTable() {
    const container = document.getElementById('vulnTable');
    container.innerHTML = vulnerabilities.map(vuln => `
        <tr>
            <td>${vuln.name}</td>
            <td><span class="task-status ${vuln.severity}">${getSeverityText(vuln.severity)}</span></td>
            <td><span class="task-status ${vuln.status === 'fixed' ? 'completed' : 'pending'}">${vuln.status === 'fixed' ? '已修复' : '待修复'}</span></td>
            <td style="color: var(--text-muted); font-family: var(--font-mono);">${vuln.discovered_at}</td>
        </tr>
    `).join('');
}

function getSeverityText(severity) {
    const map = {
        'critical': '严重',
        'high': '高危',
        'medium': '中危',
        'low': '低危'
    };
    return map[severity] || severity;
}

// 渲染资产网格
function renderAssetsGrid() {
    const container = document.getElementById('assetsGrid');
    container.innerHTML = assets.map(asset => `
        <div class="asset-card">
            <div class="asset-header">
                <span class="asset-type">${asset.type}</span>
                <span class="badge">ID: ${asset.id}</span>
            </div>
            <h3>${asset.name}</h3>
            <p class="asset-ip">${asset.ip}</p>
            <div class="asset-status">
                <span class="dot"></span>
                <span>${asset.status === 'online' ? '在线' : '离线'}</span>
            </div>
        </div>
    `).join('');
}

// 更新安全统计
function updateSecurityStats() {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    vulnerabilities.forEach(v => {
        if (counts.hasOwnProperty(v.severity)) {
            counts[v.severity]++;
        }
    });
    document.getElementById('criticalCount').textContent = counts.critical;
    document.getElementById('highCount').textContent = counts.high;
    document.getElementById('mediumCount').textContent = counts.medium;
    document.getElementById('lowCount').textContent = counts.low;
}

// 渲染任务模态框
function renderTaskModal() {
    const select = document.getElementById('taskAgent');
    select.innerHTML = agents.map(agent => `
        <option value="${agent.id}">${agent.name}</option>
    `).join('');
}

// 执行智能体
async function executeAgent(agentId) {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const result = await response.json();
        alert(`智能体已启动，任务ID: ${result.task_id}`);
        loadData();
    } catch (error) {
        alert('执行失败: ' + error.message);
    }
}

// 新建任务
document.getElementById('newTaskBtn').addEventListener('click', () => {
    document.getElementById('newTaskModal').classList.add('active');
});

function closeModal() {
    document.getElementById('newTaskModal').classList.remove('active');
}

async function createTask() {
    const name = document.getElementById('taskName').value;
    const agentId = document.getElementById('taskAgent').value;

    if (!name) {
        alert('请输入任务名称');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, agent_id: agentId })
        });
        
        if (response.ok) {
            alert('任务创建成功');
            closeModal();
            loadData();
            document.getElementById('taskName').value = '';
        }
    } catch (error) {
        alert('创建失败: ' + error.message);
    }
}

// 显示任务详情
async function showTaskDetail(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('taskDetailModal');
    const content = document.getElementById('taskDetailContent');
    const actions = document.getElementById('taskDetailActions');

    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">任务名称</label>
            <p style="font-size: 16px; font-weight: 500;">${task.name}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">执行智能体</label>
            <p style="font-size: 14px;">${task.agent_name}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">状态</label>
            <p><span class="task-status ${task.status}">${getStatusText(task.status)}</span></p>
        </div>
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">创建时间</label>
            <p style="font-size: 14px; font-family: var(--font-mono);">${task.created_at}</p>
        </div>
        ${task.logs ? `
        <div>
            <label style="color: var(--text-muted); font-size: 12px;">执行日志</label>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-top: 8px; font-family: var(--font-mono); font-size: 12px;">
                ${task.logs.map(log => `<div style="color: var(--text-secondary);">${log}</div>`).join('')}
            </div>
        </div>
        ` : ''}
    `;

    if (task.status === 'pending') {
        actions.innerHTML = `
            <button class="btn btn-danger" onclick="rejectTask('${task.id}')">拒绝</button>
            <button class="btn btn-success" onclick="approveTask('${task.id}')">批准</button>
        `;
    } else {
        actions.innerHTML = `
            <button class="btn" onclick="closeTaskModal()">关闭</button>
        `;
    }

    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskDetailModal').classList.remove('active');
}

async function approveTask(taskId) {
    try {
        await fetch(`${API_BASE}/tasks/${taskId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approver: '管理员', comment: '审批通过' })
        });
        alert('审批通过');
        closeTaskModal();
        loadData();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

async function rejectTask(taskId) {
    try {
        await fetch(`${API_BASE}/tasks/${taskId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approver: '管理员', comment: '审批拒绝' })
        });
        alert('已拒绝');
        closeTaskModal();
        loadData();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

// 运行扫描
async function runScan(type) {
    try {
        const endpoint = type === 'vuln' ? 'vulnerability-scan' : 'code-audit';
        const target = type === 'vuln' ? '全部资产' : '全部项目';
        
        const response = await fetch(`${API_BASE}/security/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target })
        });
        
        const result = await response.json();
        alert(`${type === 'vuln' ? '漏洞扫描' : '代码审计'}已启动\n${result.message}`);
        loadData();
    } catch (error) {
        alert('启动失败: ' + error.message);
    }
}

// 点击模态框背景关闭
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});
