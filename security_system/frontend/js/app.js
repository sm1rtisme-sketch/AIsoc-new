const API_BASE = 'http://localhost:3001/api';

let agents = [];
let tasks = [];
let workflows = [];

const iconMap = {
    'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>',
    'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    'file-check': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h6"/>',
    'test-tube': '<path d="M6 2v6a6 6 0 0012 0V2"/><path d="M4 2h16"/><path d="M8 22h8"/>',
    'clipboard-check': '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
    'robot': '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>'
};

const typeColors = {
    'security': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    'compliance': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    'testing': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    'ops': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadData();
});

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
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`page-${page}`).classList.add('active');

    const titles = {
        'dashboard': '工作台',
        'workflows': '运营场景',
        'agents': '智能体管理',
        'tasks': '任务中心',
        'skills': '能力拓展'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
}

async function loadData() {
    try {
        const [agentsRes, tasksRes, workflowsRes] = await Promise.all([
            fetch(`${API_BASE}/agents`),
            fetch(`${API_BASE}/tasks`),
            fetch(`${API_BASE}/workflows`)
        ]);

        agents = await agentsRes.json();
        tasks = await tasksRes.json();
        workflows = await workflowsRes.json();

        renderAll();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function renderAll() {
    renderAgentList();
    renderAgentGrid();
    renderTasksTable();
    renderRecentTasks();
    renderWorkflows();
    renderWorkflowsGrid();
    renderTaskModal();
    updateStats();
}

function updateStats() {
    document.getElementById('agentCount').textContent = agents.length;
    document.getElementById('taskCount').textContent = tasks.length;
    document.getElementById('workflowCount').textContent = workflows.length;
}

function renderAgentList() {
    const container = document.getElementById('agentList');
    const displayAgents = agents.slice(0, 4);
    
    container.innerHTML = displayAgents.map(agent => `
        <div class="agent-list-item" onclick="showAgentDetail('${agent.id}')">
            <div class="agent-icon ${agent.type}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${iconMap[agent.icon] || iconMap['robot']}
                </svg>
            </div>
            <div class="agent-info">
                <h4>${agent.name}</h4>
                <p>${agent.capabilities.slice(0, 2).join('、')}</p>
            </div>
            <div class="agent-status ${agent.status === 'inactive' ? 'inactive' : ''}"></div>
        </div>
    `).join('');
}

function renderAgentGrid() {
    const container = document.getElementById('agentsGrid');
    
    container.innerHTML = agents.map(agent => `
        <div class="agent-card" onclick="showAgentDetail('${agent.id}')">
            <div class="agent-card-header">
                <div class="agent-card-icon" style="background: ${typeColors[agent.type] || typeColors.security}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${iconMap[agent.icon] || iconMap['robot']}
                    </svg>
                </div>
                <span class="badge ${agent.status === 'active' ? 'success' : ''}">${agent.status === 'active' ? '在线' : '离线'}</span>
            </div>
            <h3>${agent.name}</h3>
            <p>${agent.description}</p>
            <div class="agent-capabilities">
                ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
            </div>
            <div class="agent-meta">
                <span class="agent-version">v${agent.version}</span>
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); executeAgent('${agent.id}')">执行</button>
            </div>
        </div>
    `).join('');
}

function renderRecentTasks() {
    const container = document.getElementById('recentTasks');
    const recentTasks = tasks.slice(0, 4);
    
    if (recentTasks.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">暂无任务</p>';
        return;
    }

    container.innerHTML = recentTasks.map(task => `
        <div class="task-item" style="cursor: pointer" onclick="showTaskDetail('${task.id}')">
            <div class="task-item-info">
                <h4>${task.name}</h4>
                <p>${task.agent_name}</p>
            </div>
            <span class="task-status ${task.status}">${getStatusText(task.status)}</span>
        </div>
    `).join('');
}

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

function renderWorkflows() {
    const container = document.getElementById('workflowSteps');
    const wf = workflows[0];
    
    if (!wf) return;

    const statusMap = {
        'completed': { text: '已完成', class: 'completed' },
        'in_progress': { text: '进行中', class: 'active' },
        'pending': { text: '待开始', class: '' }
    };

    container.innerHTML = wf.steps.map(step => `
        <div class="workflow-step ${statusMap[step.status].class}">
            <div class="workflow-step-header">
                <div class="workflow-step-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${step.status === 'completed' ? '<path d="M20 6L9 17l-5-5"/>' : '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'}
                    </svg>
                </div>
            </div>
            <h4>${step.name}</h4>
            <p>${step.agent_name}</p>
        </div>
    `).join('');
}

function renderWorkflowsGrid() {
    const container = document.getElementById('workflowsGrid');
    
    container.innerHTML = workflows.map(wf => `
        <div class="workflow-card">
            <div class="workflow-card-header">
                <div>
                    <h3>${wf.name}</h3>
                    <p>${wf.description}</p>
                </div>
                <span class="badge ${wf.status === 'completed' ? 'success' : 'warning'}">${wf.status === 'completed' ? '已完成' : '进行中'}</span>
            </div>
            <div class="workflow-card-steps">
                ${wf.steps.map(step => `
                    <span class="workflow-mini-step ${step.status}">${step.name}</span>
                `).join('')}
            </div>
        </div>
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

function renderTaskModal() {
    const select = document.getElementById('taskAgent');
    select.innerHTML = agents.map(agent => `
        <option value="${agent.id}">${agent.name}</option>
    `).join('');
}

async function executeAgent(agentId) {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const result = await response.json();
        alert(`智能体执行完成\n任务ID: ${result.task_id}\n结果: ${result.message}`);
        loadData();
    } catch (error) {
        alert('执行失败: ' + error.message);
    }
}

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

function showAgentDetail(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const modal = document.getElementById('agentDetailModal');
    const content = document.getElementById('agentDetailContent');
    const actions = document.getElementById('agentDetailActions');

    content.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 24px;">
            <div class="agent-card-icon" style="background: ${typeColors[agent.type] || typeColors.security}; width: 80px; height: 80px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 40px; height: 40px;">
                    ${iconMap[agent.icon] || iconMap['robot']}
                </svg>
            </div>
            <div>
                <h2 style="font-size: 24px; margin-bottom: 8px;">${agent.name}</h2>
                <p style="color: var(--text-secondary);">${agent.description}</p>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                <label style="color: var(--text-muted); font-size: 12px;">状态</label>
                <p><span class="badge ${agent.status === 'active' ? 'success' : ''}">${agent.status === 'active' ? '在线' : '离线'}</span></p>
            </div>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                <label style="color: var(--text-muted); font-size: 12px;">版本</label>
                <p style="font-family: var(--font-mono);">v${agent.version}</p>
            </div>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                <label style="color: var(--text-muted); font-size: 12px;">类型</label>
                <p>${agent.type === 'security' ? '安全测试' : agent.type === 'compliance' ? '合规审计' : agent.type === 'testing' ? '功能测试' : '运维自动化'}</p>
            </div>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                <label style="color: var(--text-muted); font-size: 12px;">创建时间</label>
                <p style="font-family: var(--font-mono); font-size: 13px;">${agent.created_at}</p>
            </div>
        </div>
        <div style="margin-bottom: 16px;">
            <label style="color: var(--text-muted); font-size: 12px;">能力列表</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
            </div>
        </div>
        <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
            <label style="color: var(--text-muted); font-size: 12px;">底层能力调用</label>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">该智能体调用基础安全IPDRR能力完成安全运营任务</p>
        </div>
    `;

    actions.innerHTML = `
        <button class="btn" onclick="toggleAgent('${agent.id}')">${agent.status === 'active' ? '禁用' : '启用'}</button>
        <button class="btn btn-primary" onclick="executeAgent('${agent.id}'); closeAgentDetailModal();">执行智能体</button>
    `;

    modal.classList.add('active');
}

function closeAgentDetailModal() {
    document.getElementById('agentDetailModal').classList.remove('active');
}

async function toggleAgent(agentId) {
    try {
        await fetch(`${API_BASE}/agents/${agentId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        loadData();
        closeAgentDetailModal();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

function showCreateAgentModal() {
    document.getElementById('createAgentModal').classList.add('active');
}

function closeAgentModal() {
    document.getElementById('createAgentModal').classList.remove('active');
}

async function createAgent() {
    const name = document.getElementById('agentName').value;
    const type = document.getElementById('agentType').value;
    const description = document.getElementById('agentDesc').value;
    const capabilitiesStr = document.getElementById('agentCaps').value;

    if (!name || !description || !capabilitiesStr) {
        alert('请填写完整信息');
        return;
    }

    const capabilities = capabilitiesStr.split(',').map(c => c.trim()).filter(c => c);

    try {
        const response = await fetch(`${API_BASE}/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, description, capabilities })
        });

        if (response.ok) {
            alert('智能体创建成功');
            closeAgentModal();
            loadData();
            document.getElementById('agentName').value = '';
            document.getElementById('agentDesc').value = '';
            document.getElementById('agentCaps').value = '';
        }
    } catch (error) {
        alert('创建失败: ' + error.message);
    }
}

async function showTaskDetail(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('taskDetailModal');
    const content = document.getElementById('taskDetailContent');
    const actions = document.getElementById('taskDetailActions');

    let outputHtml = '';
    if (task.output) {
        outputHtml = `
            <div style="margin-top: 16px;">
                <label style="color: var(--text-muted); font-size: 12px;">执行结果</label>
                <pre style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-top: 8px; font-family: var(--font-mono); font-size: 12px; overflow-x: auto;">${JSON.stringify(task.output, null, 2)}</pre>
            </div>
        `;
    }

    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">任务名称</label>
            <p style="font-size: 16px; font-weight: 500;">${task.name}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div>
                <label style="color: var(--text-muted); font-size: 12px;">执行智能体</label>
                <p style="font-size: 14px;">${task.agent_name}</p>
            </div>
            <div>
                <label style="color: var(--text-muted); font-size: 12px;">状态</label>
                <p><span class="task-status ${task.status}">${getStatusText(task.status)}</span></p>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">创建时间</label>
            <p style="font-size: 14px; font-family: var(--font-mono);">${task.created_at}</p>
        </div>
        ${task.logs ? `
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">执行日志</label>
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-top: 8px; font-family: var(--font-mono); font-size: 12px;">
                ${task.logs.map(log => `<div style="color: var(--text-secondary);">${log}</div>`).join('')}
            </div>
        </div>
        ` : ''}
        ${outputHtml}
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

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});
