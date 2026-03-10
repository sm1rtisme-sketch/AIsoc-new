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

class AgentCreate(BaseModel):
    name: str
    type: str
    description: str
    capabilities: List[str]
    icon: str = "robot"

class Task(BaseModel):
    id: str
    name: str
    agent_id: str
    agent_name: str
    status: str
    created_at: str
    result: Optional[str] = None
    logs: Optional[List[str]] = None
    output: Optional[dict] = None

class Approval(BaseModel):
    id: str
    task_id: str
    task_name: str
    approver: str
    status: str
    created_at: str
    comment: Optional[str] = None

class WorkflowStep(BaseModel):
    step_id: str
    name: str
    agent_id: str
    agent_name: str
    status: str
    order: int

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    steps: List[WorkflowStep]
    status: str
    created_at: str

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
]

tasks_db = []
approvals_db = []

workflows_db = [
    Workflow(
        id="wf-001",
        name="系统上线工作流",
        description="新系统上线所需的完整安全运营流程",
        steps=[
            WorkflowStep(step_id="s1", name="漏洞扫描", agent_id="agent-001", agent_name="漏洞扫描智能体", status="completed", order=1),
            WorkflowStep(step_id="s2", name="代码审计", agent_id="agent-002", agent_name="代码审计智能体", status="completed", order=2),
            WorkflowStep(step_id="s3", name="等保定级", agent_id="agent-003", agent_name="定级备案智能体", status="completed", order=3),
            WorkflowStep(step_id="s4", name="功能测试", agent_id="agent-004", agent_name="功能测试智能体", status="in_progress", order=4),
            WorkflowStep(step_id="s5", name="合规检查", agent_id="agent-005", agent_name="合规检查智能体", status="pending", order=5),
        ],
        status="running",
        created_at="2026-03-01 10:00:00"
    ),
]

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
def create_agent(agent_data: AgentCreate):
    new_agent = Agent(
        id=f"agent-{str(uuid.uuid4())[:8]}",
        name=agent_data.name,
        type=agent_data.type,
        description=agent_data.description,
        status="active",
        icon=agent_data.icon,
        capabilities=agent_data.capabilities,
        version="1.0.0",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    agents_db.append(new_agent)
    return new_agent

@app.put("/api/agents/{agent_id}")
def update_agent(agent_id: str, agent_data: dict):
    for i, agent in enumerate(agents_db):
        if agent.id == agent_id:
            agents_db[i] = Agent(
                id=agent_id,
                name=agent_data.get("name", agent.name),
                type=agent_data.get("type", agent.type),
                description=agent_data.get("description", agent.description),
                status=agent_data.get("status", agent.status),
                icon=agent_data.get("icon", agent.icon),
                capabilities=agent_data.get("capabilities", agent.capabilities),
                version=agent.version,
                created_at=agent.created_at
            )
            return agents_db[i]
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str):
    for i, agent in enumerate(agents_db):
        if agent.id == agent_id:
            agents_db.pop(i)
            return {"message": "删除成功"}
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.post("/api/agents/{agent_id}/execute")
def execute_agent(agent_id: str, params: dict):
    for agent in agents_db:
        if agent.id == agent_id:
            output = {
                "scan_results": [
                    {"vuln": "SQL注入", "severity": "high", "status": "found"},
                    {"vuln": "XSS", "severity": "medium", "status": "found"}
                ] if agent.type == "security" else None,
                "test_results": {
                    "passed": 45,
                    "failed": 3,
                    "total": 48
                } if agent.type == "testing" else None,
                "compliance_results": {
                    "score": 85,
                    "issues": 5
                } if agent.type == "compliance" else None
            }
            
            task = Task(
                id=str(uuid.uuid4()),
                name=f"{agent.name}任务",
                agent_id=agent_id,
                agent_name=agent.name,
                status="completed",
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                result=f"{agent.name}执行完成",
                logs=[
                    f"[{datetime.now().strftime('%H:%M:%S')}] 任务已启动",
                    f"[{datetime.now().strftime('%H:%M:%S')}] 调用基础安全能力...",
                    f"[{datetime.now().strftime('%H:%M:%S')}] 执行分析中...",
                    f"[{datetime.now().strftime('%H:%M:%S')}] 任务完成"
                ],
                output=output
            )
            tasks_db.insert(0, task)
            return {
                "task_id": task.id,
                "status": "completed",
                "message": f"智能体 {agent.name} 执行完成",
                "output": output
            }
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.post("/api/agents/{agent_id}/toggle")
def toggle_agent(agent_id: str):
    for agent in agents_db:
        if agent.id == agent_id:
            agent.status = "inactive" if agent.status == "active" else "active"
            return {"status": agent.status}
    raise HTTPException(status_code=404, detail="智能体不存在")

# ==================== 运营平台 API ====================

@app.get("/api/tasks")
def get_tasks():
    return tasks_db

@app.get("/api/tasks/{task_id}")
def get_task(task_id: str):
    for task in tasks_db:
        if task.id == task_id:
            return task
    raise HTTPException(status_code=404, detail="任务不存在")

@app.post("/api/tasks")
def create_task(task_data: dict):
    agent_id = task_data.get("agent_id")
    for agent in agents_db:
        if agent.id == agent_id:
            task = Task(
                id=str(uuid.uuid4()),
                name=task_data.get("name", f"{agent.name}任务"),
                agent_id=agent_id,
                agent_name=agent.name,
                status="pending",
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                result=None,
                logs=[]
            )
            tasks_db.insert(0, task)
            return task
    raise HTTPException(status_code=404, detail="智能体不存在")

@app.post("/api/tasks/{task_id}/approve")
def approve_task(task_id: str, approval_data: dict):
    for task in tasks_db:
        if task.id == task_id:
            task.status = "approved"
            approval = Approval(
                id=str(uuid.uuid4()),
                task_id=task_id,
                task_name=task.name,
                approver=approval_data.get("approver", "审批人"),
                status="approved",
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                comment=approval_data.get("comment", "审批通过")
            )
            approvals_db.append(approval)
            return {"message": "审批通过", "approval": approval}
    raise HTTPException(status_code=404, detail="任务不存在")

@app.post("/api/tasks/{task_id}/reject")
def reject_task(task_id: str, approval_data: dict):
    for task in tasks_db:
        if task.id == task_id:
            task.status = "rejected"
            approval = Approval(
                id=str(uuid.uuid4()),
                task_id=task_id,
                task_name=task.name,
                approver=approval_data.get("approver", "审批人"),
                status="rejected",
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                comment=approval_data.get("comment", "审批拒绝")
            )
            approvals_db.append(approval)
            return {"message": "审批拒绝", "approval": approval}
    raise HTTPException(status_code=404, detail="任务不存在")

@app.get("/api/approvals")
def get_approvals():
    return approvals_db

# ==================== 工作流 API ====================

@app.get("/api/workflows")
def get_workflows():
    return workflows_db

@app.get("/api/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    for wf in workflows_db:
        if wf.id == workflow_id:
            return wf
    raise HTTPException(status_code=404, detail="工作流不存在")

@app.post("/api/workflows/{workflow_id}/execute")
def execute_workflow_step(workflow_id: str, step_data: dict):
    for wf in workflows_db:
        if wf.id == workflow_id:
            step_order = step_data.get("step_order")
            for step in wf.steps:
                if step.order == step_order:
                    step.status = "completed"
                    task = Task(
                        id=str(uuid.uuid4()),
                        name=f"{step.agent_name} - {step.name}",
                        agent_id=step.agent_id,
                        agent_name=step.agent_name,
                        status="completed",
                        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        result=f"{step.name}完成",
                        logs=[f"{step.name}任务执行完成"]
                    )
                    tasks_db.insert(0, task)
                    
                    next_step = next((s for s in wf.steps if s.order == step_order + 1), None)
                    if next_step:
                        next_step.status = "in_progress"
                        wf.status = "running"
                    else:
                        wf.status = "completed"
                    return {"message": f"{step.name}完成", "workflow": wf}
            return {"message": "步骤不存在"}
    raise HTTPException(status_code=404, detail="工作流不存在")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
