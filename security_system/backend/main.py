from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import json

app = FastAPI(title="安全运营平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================

class Vulnerability(BaseModel):
    id: str
    name: str
    severity: str
    status: str
    discovered_at: str
    description: str

class SecurityEvent(BaseModel):
    id: str
    event_type: str
    severity: str
    source: str
    timestamp: str
    description: str

class Asset(BaseModel):
    id: str
    name: str
    type: str
    ip: str
    status: str

class Agent(BaseModel):
    id: str
    name: str
    type: str
    description: str
    status: str
    capabilities: List[str]

class Task(BaseModel):
    id: str
    name: str
    agent_id: str
    agent_name: str
    status: str
    created_at: str
    result: Optional[str] = None
    logs: Optional[List[str]] = None

class Approval(BaseModel):
    id: str
    task_id: str
    task_name: str
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
        description="自动化漏洞扫描与风险评估",
        status="active",
        capabilities=["漏洞扫描", "风险评估", "修复建议"]
    ),
    Agent(
        id="agent-002",
        name="代码审计智能体",
        type="security",
        description="静态代码分析与安全审计",
        status="active",
        capabilities=["代码审计", "安全漏洞检测", "代码质量评估"]
    ),
    Agent(
        id="agent-003",
        name="定级备案智能体",
        type="compliance",
        description="等保定级与备案流程自动化",
        status="active",
        capabilities=["等保自评", "备案材料生成", "合规检查"]
    ),
    Agent(
        id="agent-004",
        name="功能测试智能体",
        type="testing",
        description="自动化功能测试与回归测试",
        status="active",
        capabilities=["功能测试", "接口测试", "性能测试"]
    ),
    Agent(
        id="agent-005",
        name="合规检查智能体",
        type="compliance",
        description="安全合规检查与策略审计",
        status="active",
        capabilities=["合规检查", "策略审计", "合规报告"]
    ),
]

tasks_db = []
approvals_db = []

# ==================== 基础安全IPDRR API ====================

@app.get("/api/security/vulnerabilities")
def get_vulnerabilities():
    return [
        Vulnerability(
            id="vuln-001",
            name="SQL注入漏洞",
            severity="high",
            status="pending",
            discovered_at="2026-03-10 10:30:00",
            description="用户输入未经过滤直接拼接SQL语句"
        ),
        Vulnerability(
            id="vuln-002",
            name="XSS跨站脚本",
            severity="medium",
            status="fixed",
            discovered_at="2026-03-09 14:20:00",
            description="富文本编辑器未做HTML转义"
        ),
        Vulnerability(
            id="vuln-003",
            name="敏感信息泄露",
            severity="critical",
            status="pending",
            discovered_at="2026-03-10 09:15:00",
            description="配置文件包含明文数据库密码"
        ),
    ]

@app.get("/api/security/events")
def get_security_events():
    return [
        SecurityEvent(
            id="evt-001",
            event_type="入侵检测",
            severity="high",
            source="192.168.1.100",
            timestamp="2026-03-10 11:45:00",
            description="检测到异常登录尝试"
        ),
        SecurityEvent(
            id="evt-002",
            event_type="权限变更",
            severity="medium",
            source="192.168.1.50",
            timestamp="2026-03-10 10:20:00",
            description="管理员账户权限被修改"
        ),
    ]

@app.get("/api/security/assets")
def get_assets():
    return [
        Asset(id="asset-001", name="Web服务器", type="server", ip="192.168.1.10", status="online"),
        Asset(id="asset-002", name="数据库服务器", type="database", ip="192.168.1.20", status="online"),
        Asset(id="asset-003", name="API网关", type="gateway", ip="192.168.1.30", status="online"),
    ]

@app.post("/api/security/scan")
def run_vulnerability_scan(target: str):
    return {
        "task_id": str(uuid.uuid4()),
        "status": "started",
        "message": f"漏洞扫描任务已启动，目标: {target}",
        "progress": 0
    }

@app.post("/api/security/code-audit")
def run_code_audit(project: str):
    return {
        "task_id": str(uuid.uuid4()),
        "status": "started",
        "message": f"代码审计任务已启动，项目: {project}",
        "progress": 0
    }

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

@app.post("/api/agents/{agent_id}/execute")
def execute_agent(agent_id: str, params: dict):
    for agent in agents_db:
        if agent.id == agent_id:
            task = Task(
                id=str(uuid.uuid4()),
                name=f"{agent.name}任务",
                agent_id=agent_id,
                agent_name=agent.name,
                status="running",
                created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                result=None,
                logs=[f"任务已启动", "正在执行中...", "任务完成"]
            )
            tasks_db.append(task)
            return {
                "task_id": task.id,
                "status": "started",
                "message": f"智能体 {agent.name} 已启动"
            }
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
            tasks_db.append(task)
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

@app.get("/api/system-launch/status")
def get_system_launch_status():
    return {
        "phase": "security_testing",
        "phases": [
            {"name": "需求分析", "status": "completed"},
            {"name": "安全测评", "status": "in_progress"},
            {"name": "定级备案", "status": "pending"},
            {"name": "功能测试", "status": "pending"},
            {"name": "合规检查", "status": "pending"},
            {"name": "上线审批", "status": "pending"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
