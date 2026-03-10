const API_BASE = 'http://localhost:3001/api';

let agents = [];
let workflows = [];
let workflowTemplates = [];
let tasks = [];

const iconMap = {
    'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>',
    'code': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    'file-check': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h6"/>',
    'test-tube': '<path d="M6 2v6a6 6 0 0012 0V2"/><path d="M4 2h16"/><path d="M8 22h8"/>',
    'clipboard-check': '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'check-square': '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
    'robot': '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>'
};

const typeColors = {
    'security': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    'compliance': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    'testing': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    'ops': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    'analysis': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
};

const categoryNames = {
    'system_launch': '系统上线',
    'security_scan': '安全巡检',
    'app_release': '应用发布',
    'custom': '自定义'
};

const statusNames = {
    'pending': '待开始',
    'waiting_approval': '待审批',
    'running': '执行中',
    'completed': '已完成',
    'failed': '失败',
    'paused': '已暂停',
    'cancelled': '已取消',
    'approved': '已通过',
    'rejected': '已拒绝'
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadData();
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
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
        'workflow-templates': '工作流模板',
        'agents': '智能体管理',
        'tasks': '任务中心',
        'skills': 'IPDRR能力'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
}

async function loadData() {
    try {
        const [agentsRes, workflowsRes, templatesRes, tasksRes] = await Promise.all([
            fetch(`${API_BASE}/agents`),
            fetch(`${API_BASE}/workflows`),
            fetch(`${API_BASE}/workflow-templates`),
            fetch(`${API_BASE}/tasks`)
        ]);

        agents = await agentsRes.json();
        workflows = await workflowsRes.json();
        workflowTemplates = await templatesRes.json();
        tasks = await tasksRes.json();

        renderAll();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function renderAll() {
    renderRunningWorkflows();
    renderWorkflowsGrid();
    renderTemplatesGrid();
    renderAgentGrid();
    renderTasksTable();
    renderPendingTasks();
    renderTemplateList();
    updateStats();
    initCreateWorkflowModal();
}

function updateStats() {
    document.getElementById('workflowCount').textContent = workflows.filter(w => w.status === 'running').length;
    document.getElementById('taskCount').textContent = tasks.filter(t => t.status === 'pending').length;
    document.getElementById('agentCount').textContent = agents.length;
}

function renderRunningWorkflows() {
    const container = document.getElementById('runningWorkflows');
    const running = workflows.filter(w => w.status === 'running' || w.status === 'paused');
    
    if (running.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">暂无进行中的工作流</p>';
        return;
    }

    container.innerHTML = running.map(wf => `
        <div class="workflow-mini-card" onclick="showWorkflowDetail('${wf.id}')">
            <div class="workflow-mini-header">
                <h4>${wf.name}</h4>
                <span class="badge ${wf.status === 'running' ? 'success' : 'warning'}">${statusNames[wf.status]}</span>
            </div>
            <p class="workflow-mini-desc">${wf.description}</p>
            <div class="workflow-mini-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(wf.current_step / wf.steps.length) * 100}%"></div>
                </div>
                <span>${wf.current_step}/${wf.steps.length} 步骤</span>
            </div>
        </div>
    `).join('');
}

function renderWorkflowsGrid() {
    const container = document.getElementById('workflowsGrid');
    
    if (workflows.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">暂无工作流实例</p>';
        return;
    }

    container.innerHTML = workflows.map(wf => `
        <div class="workflow-card" onclick="showWorkflowDetail('${wf.id}')">
            <div class="workflow-card-header">
                <div>
                    <h3>${wf.name}</h3>
                    <p>${wf.description}</p>
                </div>
                <span class="badge ${getWorkflowStatusClass(wf.status)}">${statusNames[wf.status]}</span>
            </div>
            <div class="workflow-progress-info">
                <span>当前步骤: ${wf.current_step}/${wf.steps.length}</span>
                <span>创建时间: ${wf.created_at}</span>
            </div>
            <div class="workflow-steps-preview">
                ${wf.steps.slice(0, 4).map((step, idx) => `
                    <span class="step-dot ${step.status}" title="${step.name}: ${statusNames[step.status]}"></span>
                `).join('')}
                ${wf.steps.length > 4 ? `<span class="step-more">+${wf.steps.length - 4}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderTemplatesGrid() {
    const container = document.getElementById('templatesGrid');
    
    container.innerHTML = workflowTemplates.map(tpl => `
        <div class="template-card">
            <div class="template-card-header">
                <div>
                    <h3>${tpl.name}</h3>
                    <p>${tpl.description}</p>
                </div>
                <span class="badge">${categoryNames[tpl.category] || tpl.category}</span>
            </div>
            <div class="template-steps">
                ${tpl.steps.map(step => `
                    <div class="template-step-item">
                        <span class="step-num">${step.order}</span>
                        <span class="step-name">${step.name}</span>
                        ${step.require_approval ? '<span class="step-approval">需审批</span>' : ''}
                    </div>
                `).join('')}
            </div>
            <div class="template-actions">
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); quickStartWorkflow('${tpl.id}')">快速启动</button>
            </div>
        </div>
    `).join('');
}

function renderTemplateList() {
    const container = document.getElementById('templateList');
    
    container.innerHTML = workflowTemplates.map(tpl => `
        <div class="template-mini-item">
            <div class="template-mini-info">
                <h4>${tpl.name}</h4>
                <p>${tpl.steps.length} 个步骤</p>
            </div>
            <button class="btn btn-sm" onclick="quickStartWorkflow('${tpl.id}')">启动</button>
        </div>
    `).join('');
}

function renderAgentGrid() {
    const container = document.getElementById('agentsGrid');
    
    container.innerHTML = agents.map(agent => `
        <div class="agent-card">
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
            <div class="agent-card-actions">
                <button class="btn btn-sm" onclick="event.stopPropagation(); showAgentDetail('${agent.id}')">详情</button>
                <button class="btn btn-sm" onclick="event.stopPropagation(); showEditAgentModal('${agent.id}')">编辑</button>
                <button class="btn btn-sm ${agent.status === 'active' ? '' : 'btn-primary'}" onclick="event.stopPropagation(); toggleAgent('${agent.id}')">${agent.status === 'active' ? '禁用' : '启用'}</button>
                <button class="btn btn-sm" onclick="event.stopPropagation(); deleteAgent('${agent.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

function renderPendingTasks() {
    const container = document.getElementById('pendingTasks');
    const pending = tasks.filter(t => t.status === 'pending');
    
    if (pending.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">暂无待审批任务</p>';
        return;
    }

    container.innerHTML = pending.map(task => `
        <div class="task-item" onclick="showTaskDetail('${task.id}')">
            <div class="task-item-info">
                <h4>${task.name}</h4>
                <p>${task.step_name || task.agent_name}</p>
            </div>
            <span class="task-status pending">待审批</span>
        </div>
    `).join('');
}

function renderTasksTable() {
    const container = document.getElementById('tasksTable');
    
    if (tasks.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">暂无任务</td></tr>';
        return;
    }

    container.innerHTML = tasks.map(task => {
        const wf = workflows.find(w => w.id === task.workflow_id);
        return `
            <tr>
                <td style="cursor: pointer; color: var(--accent-primary);" onclick="showTaskDetail('${task.id}')">${task.name}</td>
                <td>${wf ? wf.name : '-'}</td>
                <td>${task.agent_name || '-'}</td>
                <td><span class="task-status ${task.status}">${statusNames[task.status]}</span></td>
                <td style="color: var(--text-muted); font-family: var(--font-mono);">${task.created_at}</td>
                <td>
                    ${task.status === 'pending' ? `
                        <button class="btn btn-sm" onclick="event.stopPropagation(); approveTask('${task.id}')">通过</button>
                        <button class="btn btn-sm" onclick="event.stopPropagation(); rejectTask('${task.id}')">拒绝</button>
                    ` : `
                        <button class="btn btn-sm" onclick="event.stopPropagation(); showTaskDetail('${task.id}')">查看</button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function getWorkflowStatusClass(status) {
    if (status === 'completed') return 'success';
    if (status === 'failed' || status === 'cancelled') return 'danger';
    if (status === 'running') return 'success';
    if (status === 'paused') return 'warning';
    return '';
}

function initCreateWorkflowModal() {
    const select = document.getElementById('workflowTemplate');
    select.innerHTML = workflowTemplates.map(tpl => `
        <option value="${tpl.id}">${tpl.name}</option>
    `).join('');
    loadTemplateSteps();
}

function loadTemplateSteps() {
    const templateId = document.getElementById('workflowTemplate').value;
    const tpl = workflowTemplates.find(t => t.id === templateId);
    const container = document.getElementById('stepsPreview');
    
    if (!tpl) return;
    
    container.innerHTML = tpl.steps.map(step => `
        <div class="step-preview-item">
            <span class="step-num">${step.order}</span>
            <span class="step-name">${step.name}</span>
            <span class="step-agent">${step.agent_name || '审批节点'}</span>
            ${step.require_approval ? '<span class="step-approval-badge">需审批</span>' : ''}
        </div>
    `).join('');
}

document.getElementById('newWorkflowBtn').addEventListener('click', () => {
    document.getElementById('createWorkflowModal').classList.add('active');
});

function closeModal() {
    document.getElementById('createWorkflowModal').classList.remove('active');
}

async function createWorkflow() {
    const name = document.getElementById('workflowName').value;
    const description = document.getElementById('workflowDesc').value;
    const templateId = document.getElementById('workflowTemplate').value;

    if (!name) {
        alert('请输入工作流名称');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, template_id: templateId })
        });
        
        const result = await response.json();
        
        // 自动启动工作流
        await fetch(`${API_BASE}/workflows/${result.id}/start`, {
            method: 'POST'
        });
        
        alert('工作流创建成功并已启动');
        closeModal();
        loadData();
        
        document.getElementById('workflowName').value = '';
        document.getElementById('workflowDesc').value = '';
    } catch (error) {
        alert('创建失败: ' + error.message);
    }
}

async function quickStartWorkflow(templateId) {
    const tpl = workflowTemplates.find(t => t.id === templateId);
    const name = prompt('请输入工作流名称', tpl.name);
    if (!name) return;

    try {
        const response = await fetch(`${API_BASE}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: tpl.description, template_id: templateId })
        });
        
        const result = await response.json();
        
        await fetch(`${API_BASE}/workflows/${result.id}/start`, {
            method: 'POST'
        });
        
        alert('工作流启动成功');
        loadData();
    } catch (error) {
        alert('启动失败: ' + error.message);
    }
}

async function showWorkflowDetail(workflowId) {
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf) return;

    const modal = document.getElementById('workflowDetailModal');
    const content = document.getElementById('workflowDetailContent');
    const actions = document.getElementById('workflowDetailActions');

    const statusMap = {
        'pending': '待开始',
        'waiting_approval': '待审批',
        'running': '执行中',
        'completed': '已完成',
        'failed': '失败',
        'paused': '已暂停',
        'cancelled': '已取消'
    };

    content.innerHTML = `
        <div class="workflow-detail-header">
            <div>
                <h2>${wf.name}</h2>
                <p>${wf.description}</p>
            </div>
            <span class="badge ${getWorkflowStatusClass(wf.status)}" style="font-size: 14px; padding: 8px 16px;">${statusMap[wf.status]}</span>
        </div>
        
        <div class="workflow-detail-info">
            <div class="info-item">
                <label>模板</label>
                <span>${wf.template_name}</span>
            </div>
            <div class="info-item">
                <label>创建时间</label>
                <span>${wf.created_at}</span>
            </div>
            <div class="info-item">
                <label>创建人</label>
                <span>${wf.created_by}</span>
            </div>
            <div class="info-item">
                <label>当前步骤</label>
                <span>${wf.current_step}/${wf.steps.length}</span>
            </div>
        </div>
        
        <div class="workflow-steps-detail">
            <h4>执行步骤</h4>
            <div class="steps-timeline">
                ${wf.steps.map((step, idx) => `
                    <div class="timeline-step ${step.status}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <span class="timeline-title">${step.order}. ${step.name}</span>
                                <span class="timeline-status">${statusNames[step.status]}</span>
                            </div>
                            <p class="timeline-desc">${step.description || ''}</p>
                            ${step.agent_name ? `<p class="timeline-agent">执行智能体: ${step.agent_name}</p>` : ''}
                            ${step.result ? `<p class="timeline-result">结果: ${step.result}</p>` : ''}
                            ${step.start_time ? `<p class="timeline-time">开始: ${step.start_time}</p>` : ''}
                            ${step.end_time ? `<p class="timeline-time">结束: ${step.end_time}</p>` : ''}
                            ${step.status === 'pending' || step.status === 'waiting_approval' ? `
                                <button class="btn btn-sm btn-primary" style="margin-top: 8px;" onclick="executeStep('${wf.id}', ${step.order})">执行</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    let actionButtons = '';
    if (wf.status === 'running') {
        actionButtons += `<button class="btn" onclick="pauseWorkflow('${wf.id}')">暂停</button>`;
        actionButtons += `<button class="btn btn-danger" onclick="cancelWorkflow('${wf.id}')">取消</button>`;
    } else if (wf.status === 'paused') {
        actionButtons += `<button class="btn btn-primary" onclick="resumeWorkflow('${wf.id}')">恢复</button>`;
        actionButtons += `<button class="btn btn-danger" onclick="cancelWorkflow('${wf.id}')">取消</button>`;
    } else if (wf.status === 'pending') {
        actionButtons += `<button class="btn btn-primary" onclick="startWorkflow('${wf.id}')">启动</button>`;
    }
    actionButtons += `<button class="btn" onclick="closeWorkflowModal()">关闭</button>`;
    
    actions.innerHTML = actionButtons;
    modal.classList.add('active');
}

function closeWorkflowModal() {
    document.getElementById('workflowDetailModal').classList.remove('active');
}

async function startWorkflow(workflowId) {
    try {
        await fetch(`${API_BASE}/workflows/${workflowId}/start`, { method: 'POST' });
        alert('工作流已启动');
        loadData();
        closeWorkflowModal();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

async function pauseWorkflow(workflowId) {
    try {
        await fetch(`${API_BASE}/workflows/${workflowId}/pause`, { method: 'POST' });
        alert('工作流已暂停');
        loadData();
        closeWorkflowModal();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

async function resumeWorkflow(workflowId) {
    try {
        await fetch(`${API_BASE}/workflows/${workflowId}/resume`, { method: 'POST' });
        alert('工作流已恢复');
        loadData();
        closeWorkflowModal();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

async function cancelWorkflow(workflowId) {
    if (!confirm('确定要取消此工作流吗？')) return;
    try {
        await fetch(`${API_BASE}/workflows/${workflowId}/cancel`, { method: 'POST' });
        alert('工作流已取消');
        loadData();
        closeWorkflowModal();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

async function executeStep(workflowId, stepOrder) {
    try {
        const response = await fetch(`${API_BASE}/workflows/${workflowId}/steps/${stepOrder}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        
        if (result.message.includes('审批')) {
            alert('步骤已提交审批');
        } else {
            alert('步骤执行完成: ' + result.message);
        }
        
        loadData();
        showWorkflowDetail(workflowId);
    } catch (error) {
        alert('执行失败: ' + error.message);
    }
}

async function showTaskDetail(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('taskDetailModal');
    const content = document.getElementById('taskDetailContent');
    const actions = document.getElementById('taskDetailActions');

    const wf = workflows.find(w => w.id === task.workflow_id);

    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <label style="color: var(--text-muted); font-size: 12px;">任务名称</label>
            <p style="font-size: 16px; font-weight: 500;">${task.name}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div>
                <label style="color: var(--text-muted); font-size: 12px;">关联工作流</label>
                <p style="font-size: 14px;">${wf ? wf.name : '-'}</p>
            </div>
            <div>
                <label style="color: var(--text-muted); font-size: 12px;">执行智能体</label>
                <p style="font-size: 14px;">${task.agent_name || '-'}</p>
            </div>
            <div>
                <label style="color: var(--text-muted); font-size: 12px;">状态</label>
                <p><span class="task-status ${task.status}">${statusNames[task.status]}</span></p>
            </div>
            <div>
                <label style="color: var(--text-muted); font-size: 12px;">创建时间</label>
                <p style="font-size: 14px; font-family: var(--font-mono);">${task.created_at}</p>
            </div>
        </div>
        ${task.result ? `
        <div>
            <label style="color: var(--text-muted); font-size: 12px;">执行结果</label>
            <p style="font-size: 14px; margin-top: 8px;">${task.result}</p>
        </div>
        ` : ''}
    `;

    if (task.status === 'pending') {
        actions.innerHTML = `
            <button class="btn btn-danger" onclick="rejectTask('${task.id}')">拒绝</button>
            <button class="btn btn-success" onclick="approveTask('${task.id}')">批准</button>
        `;
    } else {
        actions.innerHTML = `<button class="btn" onclick="closeTaskModal()">关闭</button>`;
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

// ==================== 智能体管理函数 ====================

function showCreateAgentModal() {
    document.getElementById('agentFormTitle').textContent = '新增智能体';
    document.getElementById('editAgentId').value = '';
    document.getElementById('agentName').value = '';
    document.getElementById('agentType').value = 'security';
    document.getElementById('agentIcon').value = 'robot';
    document.getElementById('agentDesc').value = '';
    document.getElementById('agentCapabilities').value = '';
    document.getElementById('agentVersion').value = '1.0.0';
    document.getElementById('agentFormModal').classList.add('active');
}

function showEditAgentModal(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    document.getElementById('agentFormTitle').textContent = '编辑智能体';
    document.getElementById('editAgentId').value = agent.id;
    document.getElementById('agentName').value = agent.name;
    document.getElementById('agentType').value = agent.type;
    document.getElementById('agentIcon').value = agent.icon || 'robot';
    document.getElementById('agentDesc').value = agent.description;
    document.getElementById('agentCapabilities').value = agent.capabilities.join(', ');
    document.getElementById('agentVersion').value = agent.version;
    document.getElementById('agentFormModal').classList.add('active');
}

function closeAgentFormModal() {
    document.getElementById('agentFormModal').classList.remove('active');
}

async function saveAgent() {
    const agentId = document.getElementById('editAgentId').value;
    const name = document.getElementById('agentName').value.trim();
    const type = document.getElementById('agentType').value;
    const icon = document.getElementById('agentIcon').value;
    const description = document.getElementById('agentDesc').value.trim();
    const capabilitiesStr = document.getElementById('agentCapabilities').value;
    const version = document.getElementById('agentVersion').value.trim() || '1.0.0';

    if (!name) {
        alert('请输入智能体名称');
        return;
    }

    if (!capabilitiesStr) {
        alert('请输入智能体能力');
        return;
    }

    const capabilities = capabilitiesStr.split(',').map(c => c.trim()).filter(c => c);

    const agentData = {
        name,
        type,
        icon,
        description,
        capabilities,
        version
    };

    try {
        if (agentId) {
            // 编辑
            await fetch(`${API_BASE}/agents/${agentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });
            alert('智能体更新成功');
        } else {
            // 新增
            await fetch(`${API_BASE}/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentData)
            });
            alert('智能体创建成功');
        }
        closeAgentFormModal();
        loadData();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

function showAgentDetail(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const modal = document.getElementById('agentDetailModal');
    const content = document.getElementById('agentDetailContent');
    const actions = document.getElementById('agentDetailActions');

    const typeNames = {
        'security': '安全测试',
        'compliance': '合规审计',
        'testing': '功能测试',
        'ops': '运维自动化',
        'analysis': '数据分析'
    };

    // 统计使用该智能体的工作流和任务
    const relatedWorkflows = workflowTemplates.filter(t => 
        t.steps.some(s => s.agent_id === agentId)
    ).length;
    
    const relatedTasks = tasks.filter(t => t.agent_id === agentId).length;

    content.innerHTML = `
        <div class="agent-detail-header">
            <div class="agent-detail-icon" style="background: ${typeColors[agent.type] || typeColors.security}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${iconMap[agent.icon] || iconMap['robot']}
                </svg>
            </div>
            <div class="agent-detail-info">
                <h2>${agent.name}</h2>
                <p>${agent.description}</p>
                <span class="badge ${agent.status === 'active' ? 'success' : ''}">${agent.status === 'active' ? '在线' : '离线'}</span>
            </div>
        </div>
        
        <div class="agent-detail-stats">
            <div class="agent-detail-stat">
                <div class="value">${typeNames[agent.type] || agent.type}</div>
                <div class="label">类型</div>
            </div>
            <div class="agent-detail-stat">
                <div class="value">v${agent.version}</div>
                <div class="label">版本</div>
            </div>
            <div class="agent-detail-stat">
                <div class="value">${agent.created_at.split(' ')[0]}</div>
                <div class="label">创建时间</div>
            </div>
        </div>

        <div class="agent-detail-section">
            <h4>关联工作流模板</h4>
            <p style="color: var(--text-secondary);">${relatedWorkflows} 个工作流模板使用此智能体</p>
        </div>

        <div class="agent-detail-section">
            <h4>执行统计</h4>
            <p style="color: var(--text-secondary);">累计执行 ${relatedTasks} 次</p>
        </div>

        <div class="agent-detail-section">
            <h4>能力列表</h4>
            <div class="capability-tags">
                ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
            </div>
        </div>

        <div class="agent-detail-section">
            <h4>底层能力调用</h4>
            <p style="color: var(--text-secondary); font-size: 13px;">该智能体调用基础安全IPDRR能力完成安全运营任务</p>
        </div>
    `;

    actions.innerHTML = `
        <button class="btn" onclick="closeAgentDetailModal()">关闭</button>
        <button class="btn btn-primary" onclick="executeAgent('${agent.id}'); closeAgentDetailModal();">执行智能体</button>
    `;

    modal.classList.add('active');
}

function closeAgentDetailModal() {
    document.getElementById('agentDetailModal').classList.remove('active');
}

async function toggleAgent(agentId) {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        alert(`智能体已${result.status === 'active' ? '启用' : '禁用'}`);
        loadData();
    } catch (error) {
        alert('操作失败: ' + error.message);
    }
}

async function deleteAgent(agentId) {
    const agent = agents.find(a => a.id === agentId);
    if (!confirm(`确定要删除智能体"${agent.name}"吗？`)) return;

    try {
        await fetch(`${API_BASE}/agents/${agentId}`, {
            method: 'DELETE'
        });
        alert('智能体已删除');
        loadData();
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

async function executeAgent(agentId) {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const result = await response.json();
        alert(`智能体执行完成\n任务: ${result.task.name}\n结果: ${result.task.result}`);
        loadData();
    } catch (error) {
        alert('执行失败: ' + error.message);
    }
}
