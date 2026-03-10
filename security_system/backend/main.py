from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(title="安全运营平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================

class Agent(BaseModel):
    id: str
    name: str
    type: str
    description: str
    status: str
    capabilities: List[str]
    icon: str = "robot"
    version: str = "1.0.0"
    created_at: str = ""

class WorkflowStep(BaseModel):
    order: int
    name: str
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    require_approval: bool = False
    description: str = ""
    status: str = "pending"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    result: Optional[str] = None
    is_approval: bool = False

class WorkflowTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    steps: List[dict]
    created_at: str
    updated_at: str
    is_default: bool = False

class WorkflowInstance(BaseModel):
    id: str
    template_id: str
    template_name: str
    name: str
    description: str
    status: str
    current_step: int
    steps: List[dict]
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_by: str = "管理员"

class Task(BaseModel):
    id: str
    name: str
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    workflow_id: Optional[str] = None
    step_name: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[str] = None
    logs: Optional[List[dict]] = None
    output: Optional[dict] = None

class Approval(BaseModel):
    id: str
    task_id: str
    task_name: str
    workflow_id: Optional[str] = None
    approver: str
    status: str
    created_at: str
    comment: Optional[str] = None

# ==================== 模拟数据 ====================

agents_db = [
    Agent(
        id="agent-001",
        name="漏洞扫描智能体",
        type="security",
        description="调用基础安全IPDRR的漏洞扫描工具，自动发现系统漏洞并生成修复建议",
        status="active",
        icon="shield-alert",
        capabilities=["漏洞扫描", "风险评估", "修复建议"],
        version="1.2.0",
        created_at="2026-01-15 10:00:00"
    ),
    Agent(
        id="agent-002",
        name="代码审计智能体",
        type="security",
        description="调用基础安全IPDRR的代码审计工具，进行静态代码分析发现安全缺陷",
        status="active",
        icon="code",
        capabilities=["代码审计", "安全漏洞检测", "代码质量评估"],
        version="1.1.5",
        created_at="2026-01-20 14:30:00"
    ),
    Agent(
        id="agent-003",
        name="定级备案智能体",
        type="compliance",
        description="自动化完成等保定级自评和备案材料生成",
        status="active",
        icon="file-check",
        capabilities=["等保自评", "备案材料生成", "定级报告"],
        version="2.0.0",
        created_at="2026-02-01 09:00:00"
    ),
    Agent(
        id="agent-004",
        name="功能测试智能体",
        type="testing",
        description="自动化功能测试、接口测试和回归测试",
        status="active",
        icon="test-tube",
        capabilities=["功能测试", "接口测试", "性能测试", "回归测试"],
        version="1.5.0",
        created_at="2026-02-10 11:00:00"
    ),
    Agent(
        id="agent-005",
        name="合规检查智能体",
        type="compliance",
        description="安全合规检查、策略审计和合规报告生成",
        status="active",
        icon="clipboard-check",
        capabilities=["合规检查", "策略审计", "合规报告", "差距分析"],
        version="1.3.0",
        created_at="2026-02-15 16:00:00"
    ),
    Agent(
        id="agent-006",
        name="渗透测试智能体",
        type="security",
        description="模拟黑客攻击进行渗透测试，发现深层次安全漏洞",
        status="active",
        icon="target",
        capabilities=["渗透测试", "边界突破", "权限维持", "漏洞利用"],
        version="1.0.0",
        created_at="2026-03-01 10:00:00"
    ),
    Agent(
        id="agent-007",
        name="基线核查智能体",
        type="security",
        description="安全基线配置核查，确保系统符合安全标准",
        status="active",
        icon="check-square",
        capabilities=["基线检查", "配置审计", "合规对比", "修复建议"],
        version="1.1.0",
        created_at="2026-03-05 14:00:00"
    ),
]

workflow_templates_db = [
    {
        "id": "tpl-001",
        "name": "系统上线工作流",
        "description": "新系统上线所需的完整安全运营流程，包含安全测评、定级备案、功能测试和合规检查",
        "category": "system_launch",
        "is_default": True,
        "steps": [
            {"order": 1, "name": "漏洞扫描", "agent_id": "agent-001", "agent_name": "漏洞扫描智能体", "require_approval": True, "description": "自动化漏洞扫描，发现系统安全漏洞"},
            {"order": 2, "name": "代码审计", "agent_id": "agent-002", "agent_name": "代码审计智能体", "require_approval": True, "description": "静态代码分析，发现安全缺陷"},
            {"order": 3, "name": "渗透测试", "agent_id": "agent-006", "agent_name": "渗透测试智能体", "require_approval": True, "description": "模拟攻击测试，验证安全性"},
            {"order": 4, "name": "基线核查", "agent_id": "agent-007", "agent_name": "基线核查智能体", "require_approval": True, "description": "安全配置核查"},
            {"order": 5, "name": "等保定级", "agent_id": "agent-003", "agent_name": "定级备案智能体", "require_approval": True, "description": "等保定级自评"},
            {"order": 6, "name": "功能测试", "agent_id": "agent-004", "agent_name": "功能测试智能体", "require_approval": True, "description": "自动化功能测试"},
            {"order": 7, "name": "合规检查", "agent_id": "agent-005", "agent_name": "合规检查智能体", "require_approval": True, "description": "安全合规检查"},
            {"order": 8, "name": "上线审批", "agent_id": None, "agent_name": None, "require_approval": True, "description": "最终上线审批", "is_approval": True},
        ],
        "created_at": "2026-01-01 10:00:00",
        "updated_at": "2026-03-01 10:00:00"
    },
    {
        "id": "tpl-002",
        "name": "日常安全巡检",
        "description": "定期安全巡检工作流，持续监控系统安全状态",
        "category": "security_scan",
        "is_default": True,
        "steps": [
            {"order": 1, "name": "漏洞扫描", "agent_id": "agent-001", "agent_name": "漏洞扫描智能体", "require_approval": False, "description": "定期漏洞扫描"},
            {"order": 2, "name": "基线核查", "agent_id": "agent-007", "agent_name": "基线核查智能体", "require_approval": False, "description": "安全配置检查"},
            {"order": 3, "name": "合规检查", "agent_id": "agent-005", "agent_name": "合规检查智能体", "require_approval": True, "description": "合规状态检查"},
        ],
        "created_at": "2026-01-15 10:00:00",
        "updated_at": "2026-01-15 10:00:00"
    },
    {
        "id": "tpl-003",
        "name": "应用发布工作流",
        "description": "应用发布前的安全检查流程",
        "category": "app_release",
        "is_default": True,
        "steps": [
            {"order": 1, "name": "代码审计", "agent_id": "agent-002", "agent_name": "代码审计智能体", "require_approval": True, "description": "代码安全审计"},
            {"order": 2, "name": "漏洞扫描", "agent_id": "agent-001", "agent_name": "漏洞扫描智能体", "require_approval": True, "description": "应用漏洞扫描"},
            {"order": 3, "name": "功能测试", "agent_id": "agent-004", "agent_name": "功能测试智能体", "require_approval": False, "description": "功能回归测试"},
            {"order": 4, "name": "发布审批", "agent_id": None, "agent_name": None, "require_approval": True, "description": "发布审批", "is_approval": True},
        ],
        "created_at": "2026-02-01 10:00:00",
        "updated_at": "2026-02-01 10:00:00"
    },
]

workflow_instances_db = [
    {
        "id": "wf-001",
        "template_id": "tpl-001",
        "template_name": "系统上线工作流",
        "name": "XX业务系统上线",
        "description": "XX业务系统安全上线流程",
        "status": "running",
        "current_step": 4,
        "steps": [
            {"order": 1, "name": "漏洞扫描", "agent_id": "agent-001", "agent_name": "漏洞扫描智能体", "require_approval": True, "status": "completed", "start_time": "2026-03-01 10:00:00", "end_time": "2026-03-01 10:15:00", "result": "发现3个高危漏洞", "description": "自动化漏洞扫描"},
            {"order": 2, "name": "代码审计", "agent_id": "agent-002", "agent_name": "代码审计智能体", "require_approval": True, "status": "completed", "start_time": "2026-03-01 10:20:00", "end_time": "2026-03-01 11:00:00", "result": "发现5个安全问题", "description": "静态代码分析"},
            {"order": 3, "name": "渗透测试", "agent_id": "agent-006", "agent_name": "渗透测试智能体", "require_approval": True, "status": "completed", "start_time": "2026-03-01 11:10:00", "end_time": "2026-03-01 14:00:00", "result": "发现1个可利用漏洞", "description": "模拟攻击测试"},
            {"order": 4, "name": "基线核查", "agent_id": "agent-007", "agent_name": "基线核查智能体", "require_approval": True, "status": "in_progress", "start_time": "2026-03-01 14:10:00", "end_time": None, "result": None, "description": "安全配置核查"},
            {"order": 5, "name": "等保定级", "agent_id": "agent-003", "agent_name": "定级备案智能体", "require_approval": True, "status": "pending", "start_time": None, "end_time": None, "result": None, "description": "等保定级自评"},
            {"order": 6, "name": "功能测试", "agent_id": "agent-004", "agent_name": "功能测试智能体", "require_approval": True, "status": "pending", "start_time": None, "end_time": None, "result": None, "description": "自动化功能测试"},
            {"order": 7, "name": "合规检查", "agent_id": "agent-005", "agent_name": "合规检查智能体", "require_approval": True, "status": "pending", "start_time": None, "end_time": None, "result": None, "description": "安全合规检查"},
            {"order": 8, "name": "上线审批", "agent_id": None, "agent_name": None, "require_approval": True, "status": "pending", "start_time": None, "end_time": None, "result": None, "description": "最终上线审批", "is_approval": True},
        ],
        "created_at": "2026-03-01 10:00:00",
        "started_at": "2026-03-01 10:00:00"
    },
]

tasks_db = []
approvals_db = []

# ==================== 智能体平台 API ====================

@app.get("/api/agents")
def get_agents():
    return agents_db

@app.get("/api/agents/{agent_id}")
def get_agent(agent_id: str):
    for agent in agents_db:
        if agent.id == agent_id:
            return agent
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.post("/api/agents")
def create_agent(agent_data: dict):
    new_agent = {
        "id": f"agent-{str(uuid.uuid4())[:8]}",
        "name": agent_data["name"],
        "type": agent_data.get("type", "security"),
        "description": agent_data.get("description", ""),
        "status": "active",
        "icon": agent_data.get("icon", "robot"),
        "capabilities": agent_data.get("capabilities", []),
        "version": agent_data.get("version", "1.0.0"),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    agents_db.append(new_agent)
    return new_agent

@app.put("/api/agents/{agent_id}")
def update_agent(agent_id: str, agent_data: dict):
    for i, agent in enumerate(agents_db):
        if agent.id == agent_id:
            agents_db[i] = {
                "id": agent_id,
                "name": agent_data.get("name", agent.name),
                "type": agent_data.get("type", agent.type),
                "description": agent_data.get("description", agent.description),
                "status": agent_data.get("status", agent.status),
                "icon": agent_data.get("icon", agent.icon),
                "capabilities": agent_data.get("capabilities", agent.capabilities),
                "version": agent_data.get("version", agent.version),
                "created_at": agent.created_at
            }
            return agents_db[i]
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str):
    for i, agent in enumerate(agents_db):
        if agent.id == agent_id:
            agents_db.pop(i)
            return {"message": "删除成功"}
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.post("/api/agents/{agent_id}/toggle")
def toggle_agent_status(agent_id: str):
    for agent in agents_db:
        if agent.id == agent_id:
            agent.status = "inactive" if agent.status == "active" else "active"
            return {"id": agent_id, "status": agent.status}
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.post("/api/agents/{agent_id}/execute")
def execute_agent(agent_id: str, params: dict = {}):
    for agent in agents_db:
        if agent.id == agent_id:
            task = {
                "id": str(uuid.uuid4()),
                "name": f"{agent.name} - 执行任务",
                "agent_id": agent_id,
                "agent_name": agent.name,
                "workflow_id": None,
                "step_name": "直接执行",
                "status": "completed",
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "started_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "completed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "result": f"{agent.name}执行完成",
                "logs": [
                    {"time": datetime.now().strftime("%H:%M:%S"), "message": "任务开始"},
                    {"time": datetime.now().strftime("%H:%M:%S"), "message": "调用基础安全能力"},
                    {"time": datetime.now().strftime("%H:%M:%S"), "message": "任务完成"}
                ],
                "output": {
                    "status": "success",
                    "message": "智能体执行成功"
                }
            }
            tasks_db.append(task)
            return {"message": "执行成功", "task": task}
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.get("/api/agent-types")
def get_agent_types():
    return [
        {"value": "security", "label": "安全测试", "icon": "shield-alert", "color": "linear-gradient(135deg, #ef4444 0%, #f97316 100%)"},
        {"value": "compliance", "label": "合规审计", "icon": "clipboard-check", "color": "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)"},
        {"value": "testing", "label": "功能测试", "icon": "test-tube", "color": "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"},
        {"value": "ops", "label": "运维自动化", "icon": "settings", "color": "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)"},
        {"value": "analysis", "label": "数据分析", "icon": "bar-chart", "color": "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"},
    ]

# ==================== 工作流模板 API ====================

@app.get("/api/workflow-templates")
def get_workflow_templates():
    return workflow_templates_db

@app.get("/api/workflow-templates/{template_id}")
def get_workflow_template(template_id: str):
    for tpl in workflow_templates_db:
        if tpl["id"] == template_id:
            return tpl
    raise HTTPException(status_code=404, detail="工作流模板不存在")

@app.post("/api/workflow-templates")
def create_workflow_template(template_data: dict):
    new_template = {
        "id": f"tpl-{str(uuid.uuid4())[:8]}",
        "name": template_data["name"],
        "description": template_data["description"],
        "category": template_data.get("category", "custom"),
        "steps": template_data["steps"],
        "is_default": False,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    workflow_templates_db.append(new_template)
    return new_template

@app.delete("/api/workflow-templates/{template_id}")
def delete_workflow_template(template_id: str):
    for i, tpl in enumerate(workflow_templates_db):
        if tpl["id"] == template_id:
            if tpl.get("is_default"):
                raise HTTPException(status_code=400, detail="默认模板不能删除")
            workflow_templates_db.pop(i)
            return {"message": "删除成功"}
    raise HTTPException(status_code=404, detail="工作流模板不存在")

# ==================== 工作流实例 API ====================

@app.get("/api/workflows")
def get_workflows():
    return workflow_instances_db

@app.get("/api/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    for wf in workflow_instances_db:
        if wf["id"] == workflow_id:
            return wf
    raise HTTPException(status_code=404, detail="工作流不存在")

@app.post("/api/workflows")
def create_workflow(workflow_data: dict):
    template_id = workflow_data.get("template_id")
    template = None
    for tpl in workflow_templates_db:
        if tpl["id"] == template_id:
            template = tpl
            break
    
    if not template:
        raise HTTPException(status_code=404, detail="工作流模板不存在")
    
    steps = []
    for step in template["steps"]:
        steps.append({
            "order": step["order"],
            "name": step["name"],
            "agent_id": step.get("agent_id"),
            "agent_name": step.get("agent_name"),
            "require_approval": step.get("require_approval", False),
            "description": step.get("description", ""),
            "status": "pending",
            "start_time": None,
            "end_time": None,
            "result": None,
            "is_approval": step.get("is_approval", False)
        })
    
    new_workflow = {
        "id": f"wf-{str(uuid.uuid4())[:8]}",
        "template_id": template_id,
        "template_name": template["name"],
        "name": workflow_data.get("name"),
        "description": workflow_data.get("description"),
        "status": "pending",
        "current_step": 1,
        "steps": steps,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "created_by": workflow_data.get("created_by", "管理员")
    }
    workflow_instances_db.append(new_workflow)
    return new_workflow

@app.post("/api/workflows/{workflow_id}/start")
def start_workflow(workflow_id: str):
    for wf in workflow_instances_db:
        if wf["id"] == workflow_id:
            wf["status"] = "running"
            wf["started_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if wf["steps"][0].get("require_approval"):
                wf["steps"][0]["status"] = "waiting_approval"
            else:
                wf["steps"][0]["status"] = "pending"
            return wf
    raise HTTPException(status_code=404, detail="工作流不存在")

@app.post("/api/workflows/{workflow_id}/pause")
def pause_workflow(workflow_id: str):
    for wf in workflow_instances_db:
        if wf["id"] == workflow_id:
            wf["status"] = "paused"
            return wf
    raise HTTPException(status_code=404, detail="工作流不存在")

@app.post("/api/workflows/{workflow_id}/resume")
def resume_workflow(workflow_id: str):
    for wf in workflow_instances_db:
        if wf["id"] == workflow_id:
            wf["status"] = "running"
            return wf
    raise HTTPException(status_code=404, detail="工作流不存在")

@app.post("/api/workflows/{workflow_id}/cancel")
def cancel_workflow(workflow_id: str):
    for wf in workflow_instances_db:
        if wf["id"] == workflow_id:
            wf["status"] = "cancelled"
            wf["completed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return wf
    raise HTTPException(status_code=404, detail="工作流不存在")

# ==================== 工作流步骤执行 API ====================

@app.post("/api/workflows/{workflow_id}/steps/{step_order}/execute")
def execute_workflow_step(workflow_id: str, step_order: int):
    for wf in workflow_instances_db:
        if wf["id"] == workflow_id:
            for step in wf["steps"]:
                if step["order"] == step_order:
                    if step["status"] not in ["pending", "waiting_approval"]:
                        raise HTTPException(status_code=400, detail="步骤状态不允许执行")
                    
                    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # 如果需要审批且未审批，先创建审批任务
                    if step.get("require_approval") and not step.get("is_approval"):
                        step["status"] = "waiting_approval"
                        
                        task = {
                            "id": str(uuid.uuid4()),
                            "name": f"{wf['name']} - {step['name']}",
                            "agent_id": step.get("agent_id"),
                            "agent_name": step.get("agent_name"),
                            "workflow_id": workflow_id,
                            "step_name": step["name"],
                            "status": "pending",
                            "created_at": current_time,
                            "started_at": None,
                            "completed_at": None,
                            "result": None,
                            "logs": None,
                            "output": None
                        }
                        tasks_db.append(task)
                        
                        return {
                            "message": "步骤已提交审批",
                            "step": step,
                            "task": task
                        }
                    
                    # 直接执行步骤
                    step["status"] = "running"
                    step["start_time"] = current_time
                    
                    # 模拟执行完成
                    step["status"] = "completed"
                    step["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    step["result"] = f"{step['name']}执行完成"
                    
                    # 创建任务记录
                    task = {
                        "id": str(uuid.uuid4()),
                        "name": f"{wf['name']} - {step['name']}",
                        "agent_id": step.get("agent_id"),
                        "agent_name": step.get("agent_name"),
                        "workflow_id": workflow_id,
                        "step_name": step["name"],
                        "status": "completed",
                        "created_at": step["start_time"],
                        "started_at": step["start_time"],
                        "completed_at": step["end_time"],
                        "result": step["result"],
                        "logs": [
                            {"time": step["start_time"], "message": "任务开始"},
                            {"time": step["end_time"], "message": "任务完成"}
                        ],
                        "output": {}
                    }
                    tasks_db.append(task)
                    
                    # 更新工作流当前步骤
                    wf["current_step"] = step_order + 1
                    if wf["current_step"] > len(wf["steps"]):
                        wf["status"] = "completed"
                        wf["completed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    elif wf["steps"][wf["current_step"] - 1].get("require_approval"):
                        wf["steps"][wf["current_step"] - 1]["status"] = "waiting_approval"
                    
                    return {
                        "message": f"{step['name']}执行完成",
                        "workflow": wf,
                        "task": task
                    }
            raise HTTPException(status_code=404, detail="步骤不存在")
    raise HTTPException(status_code=404, detail="工作流不存在")

# ==================== 任务 API ====================

@app.get("/api/tasks")
def get_tasks():
    return tasks_db

@app.get("/api/tasks/{task_id}")
def get_task(task_id: str):
    for task in tasks_db:
        if task["id"] == task_id:
            return task
    raise HTTPException(status_code=404, detail="任务不存在")

@app.post("/api/tasks")
def create_task(task_data: dict):
    agent_id = task_data.get("agent_id")
    agent_name = ""
    for agent in agents_db:
        if agent.id == agent_id:
            agent_name = agent.name
            break
    
    if not agent_name:
        raise HTTPException(status_code=404, detail="智能体不存在")
    
    task = {
        "id": str(uuid.uuid4()),
        "name": task_data.get("name", f"{agent_name}任务"),
        "agent_id": agent_id,
        "agent_name": agent_name,
        "workflow_id": task_data.get("workflow_id"),
        "step_name": task_data.get("step_name", ""),
        "status": "pending",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "started_at": None,
        "completed_at": None,
        "result": None,
        "logs": [],
        "output": None
    }
    tasks_db.insert(0, task)
    return task

@app.post("/api/tasks/{task_id}/approve")
def approve_task(task_id: str, approval_data: dict):
    for task in tasks_db:
        if task["id"] == task_id:
            task["status"] = "approved"
            
            approval = {
                "id": str(uuid.uuid4()),
                "task_id": task_id,
                "task_name": task["name"],
                "workflow_id": task.get("workflow_id"),
                "approver": approval_data.get("approver", "审批人"),
                "status": "approved",
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "comment": approval_data.get("comment", "审批通过")
            }
            approvals_db.append(approval)
            
            # 如果有关联工作流，执行该步骤
            if task.get("workflow_id"):
                for wf in workflow_instances_db:
                    if wf["id"] == task["workflow_id"]:
                        for step in wf["steps"]:
                            if step["name"] == task["step_name"]:
                                step["status"] = "completed"
                                step["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                step["result"] = "审批通过"
                                
                                wf["current_step"] = step["order"] + 1
                                if wf["current_step"] > len(wf["steps"]):
                                    wf["status"] = "completed"
                                    wf["completed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                break
                        break
            
            return {"message": "审批通过", "approval": approval}
    raise HTTPException(status_code=404, detail="任务不存在")

@app.post("/api/tasks/{task_id}/reject")
def reject_task(task_id: str, approval_data: dict):
    for task in tasks_db:
        if task["id"] == task_id:
            task["status"] = "rejected"
            
            approval = {
                "id": str(uuid.uuid4()),
                "task_id": task_id,
                "task_name": task["name"],
                "workflow_id": task.get("workflow_id"),
                "approver": approval_data.get("approver", "审批人"),
                "status": "rejected",
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "comment": approval_data.get("comment", "审批拒绝")
            }
            approvals_db.append(approval)
            
            if task.get("workflow_id"):
                for wf in workflow_instances_db:
                    if wf["id"] == task["workflow_id"]:
                        for step in wf["steps"]:
                            if step["name"] == task["step_name"]:
                                step["status"] = "rejected"
                                step["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                step["result"] = "审批拒绝"
                                wf["status"] = "failed"
                                break
                        break
            
            return {"message": "审批拒绝", "approval": approval}
    raise HTTPException(status_code=404, detail="任务不存在")

@app.get("/api/approvals")
def get_approvals():
    return approvals_db

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
