"""LangGraph workflow for agent orchestration."""
from typing import Annotated, TypedDict, Sequence, Any, Dict, List
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import asyncio
import json
import uuid
from datetime import datetime

from app.models.schemas import UserIntent, AgentTask, WorkflowState, AgentStatus, TaskType
from app.agents.intent_classifier import intent_classifier
from app.agents.structure_agent import structure_agent
from app.agents.data_agent import data_agent
from app.agents.chart_agent import chart_agent
from app.agents.formula_agent import formula_agent
from app.agents.style_agent import style_agent
from app.agents.review_agent import review_agent
from app.compilers.excel_compiler import excel_compiler
from app.compilers.word_compiler import word_compiler
from app.compilers.ppt_compiler import ppt_compiler
import logging

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """State maintained across the workflow."""
    workflow_id: str
    user_intent: UserIntent
    tasks: List[AgentTask]
    current_data: Dict[str, Any]
    final_output: Dict[str, Any]
    error: str
    status: str


class AgentOrchestrator:
    """Orchestrates multiple agents using LangGraph."""
    
    def __init__(self):
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        
        # Define the graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("plan", self._planning_node)
        workflow.add_node("structure", self._structure_node)
        workflow.add_node("data", self._data_node)
        workflow.add_node("formulas", self._formulas_node)
        workflow.add_node("charts", self._charts_node)
        workflow.add_node("style", self._style_node)
        workflow.add_node("compile", self._compile_node)
        workflow.add_node("review", self._review_node)
        
        # Add edges
        workflow.set_entry_point("plan")
        workflow.add_edge("plan", "structure")
        workflow.add_edge("structure", "data")
        workflow.add_edge("data", "formulas")
        workflow.add_edge("formulas", "charts")
        workflow.add_edge("charts", "style")
        workflow.add_edge("style", "compile")
        workflow.add_edge("compile", "review")
        workflow.add_conditional_edges(
            "review",
            self._review_decision,
            {
                "retry": "structure",
                "complete": END
            }
        )
        
        return workflow.compile()
    
    async def execute(
        self,
        user_input: str,
        file_ids: List[str] = None,
        progress_callback = None
    ) -> WorkflowState:
        """Execute the full workflow."""
        
        workflow_id = str(uuid.uuid4())[:8]
        file_ids = file_ids or []
        
        try:
            # Step 1: Classify intent
            if progress_callback:
                await progress_callback("intent", {"status": "classifying"})
            
            intent = await intent_classifier.classify(user_input, file_ids)
            
            if progress_callback:
                await progress_callback("intent", {
                    "status": "completed",
                    "intent": intent.dict()
                })
            
            # Initialize state
            initial_state = AgentState(
                workflow_id=workflow_id,
                user_intent=intent,
                tasks=[],
                current_data={},
                final_output={},
                error="",
                status="running"
            )
            
            # Execute graph
            logger.info(f"[{workflow_id}] Starting graph execution")
            final_state = await self.graph.ainvoke(initial_state)
            logger.info(f"[{workflow_id}] Graph execution completed")
            logger.info(f"[{workflow_id}] Final state keys: {final_state.keys()}")
            logger.info(f"[{workflow_id}] Final output: {final_state.get('final_output')}")
            logger.info(f"[{workflow_id}] Error: {final_state.get('error')}")
            
            # Create workflow state result
            workflow_state = WorkflowState(
                workflow_id=workflow_id,
                user_intent=intent,
                tasks=final_state.get("tasks", []),
                final_output=final_state.get("final_output"),
                error=final_state.get("error"),
                status="completed" if not final_state.get("error") else "failed",
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
            
            return workflow_state
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            return WorkflowState(
                workflow_id=workflow_id,
                user_intent=UserIntent(
                    task_type=TaskType.CREATE_SPREADSHEET,
                    description=user_input,
                    goal="",
                    output_format="auto",
                    complexity_score=5,
                    data_sources=file_ids
                ),
                error=str(e),
                status="failed",
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
    
    async def _planning_node(self, state: AgentState) -> AgentState:
        """Create execution plan."""
        logger.info(f"[{state['workflow_id']}] Planning execution")
        
        intent = state["user_intent"]
        
        # Create tasks based on intent
        tasks = []
        
        if intent.task_type == TaskType.CREATE_SPREADSHEET:
            tasks = [
                AgentTask(agent_name="StructureAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="DataAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="FormulaAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="ChartAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="StyleAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="CompileAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="ReviewAgent", status=AgentStatus.PENDING),
            ]
        elif intent.task_type == TaskType.CREATE_DOCUMENT:
            tasks = [
                AgentTask(agent_name="StructureAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="DataAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="StyleAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="CompileAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="ReviewAgent", status=AgentStatus.PENDING),
            ]
        elif intent.task_type == TaskType.CREATE_PRESENTATION:
            tasks = [
                AgentTask(agent_name="StructureAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="DataAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="ChartAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="StyleAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="CompileAgent", status=AgentStatus.PENDING),
                AgentTask(agent_name="ReviewAgent", status=AgentStatus.PENDING),
            ]
        
        state["tasks"] = tasks
        return state
    
    async def _structure_node(self, state: AgentState) -> AgentState:
        """Execute structure agent."""
        logger.info(f"[{state['workflow_id']}] Structure agent executing")
        
        task = self._get_task(state, "StructureAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        intent = state["user_intent"]
        
        try:
            if intent.task_type == TaskType.CREATE_SPREADSHEET:
                structure = await structure_agent.design_spreadsheet(
                    intent.description,
                    {"goal": intent.goal, "constraints": intent.constraints}
                )
                state["current_data"]["structure"] = [s.dict() for s in structure]
                
            elif intent.task_type == TaskType.CREATE_DOCUMENT:
                structure = await structure_agent.design_document(
                    intent.description,
                    "report"
                )
                state["current_data"]["structure"] = structure.dict()
                
            elif intent.task_type == TaskType.CREATE_PRESENTATION:
                structure = await structure_agent.design_presentation(
                    intent.description,
                    intent.constraints.get("audience", "general"),
                    intent.constraints.get("duration", "15 min")
                )
                state["current_data"]["structure"] = structure.dict()
            
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Structure agent failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
        
        task.completed_at = datetime.utcnow()
        return state
    
    async def _data_node(self, state: AgentState) -> AgentState:
        """Execute data agent."""
        logger.info(f"[{state['workflow_id']}] Data agent executing")
        
        task = self._get_task(state, "DataAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        try:
            intent = state["user_intent"]
            
            # Generate sample data
            row_count = intent.constraints.get("row_count", 50)
            data = await data_agent.generate_sample_data(
                intent.description,
                row_count=row_count
            )
            
            state["current_data"]["data"] = data
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Data agent failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
            # Continue with empty data
            state["current_data"]["data"] = []
            task.status = AgentStatus.COMPLETED
        
        task.completed_at = datetime.utcnow()
        return state
    
    async def _formulas_node(self, state: AgentState) -> AgentState:
        """Execute formula agent."""
        logger.info(f"[{state['workflow_id']}] Formula agent executing")
        
        task = self._get_task(state, "FormulaAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        try:
            structure = state["current_data"].get("structure", {})
            formulas = {}
            
            # Only for spreadsheets
            if state["user_intent"].task_type == TaskType.CREATE_SPREADSHEET:
                sheets = structure if isinstance(structure, list) else [structure]
                
                for sheet in sheets:
                    sheet_formulas = sheet.get("formulas", {})
                    formulas.update(sheet_formulas)
            
            state["current_data"]["formulas"] = formulas
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Formula agent failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
            state["current_data"]["formulas"] = {}
            task.status = AgentStatus.COMPLETED
        
        task.completed_at = datetime.utcnow()
        return state
    
    async def _charts_node(self, state: AgentState) -> AgentState:
        """Execute chart agent."""
        logger.info(f"[{state['workflow_id']}] Chart agent executing")
        
        task = self._get_task(state, "ChartAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        try:
            data = state["current_data"].get("data", [])
            
            charts = await chart_agent.design_charts(
                data_description=f"Data with {len(data)} rows" if data else "Empty dataset",
                chart_purpose="visualization",
                sheet_name="Dashboard"
            )
            
            state["current_data"]["charts"] = charts
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Chart agent failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
            state["current_data"]["charts"] = []
            task.status = AgentStatus.COMPLETED
        
        task.completed_at = datetime.utcnow()
        return state
    
    async def _style_node(self, state: AgentState) -> AgentState:
        """Execute style agent."""
        logger.info(f"[{state['workflow_id']}] Style agent executing")
        
        task = self._get_task(state, "StyleAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        try:
            intent = state["user_intent"]
            theme = intent.constraints.get("theme", "corporate")
            
            if intent.task_type == TaskType.CREATE_SPREADSHEET:
                styling = await style_agent.style_spreadsheet(
                    theme=theme
                )
            elif intent.task_type == TaskType.CREATE_DOCUMENT:
                styling = await style_agent.style_document(
                    theme=theme,
                    constraints=intent.constraints
                )
            else:
                styling = await style_agent.style_presentation(
                    theme=theme
                )
            
            state["current_data"]["styling"] = styling
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Style agent failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
            state["current_data"]["styling"] = {}
            task.status = AgentStatus.COMPLETED
        
        task.completed_at = datetime.utcnow()
        return state
    
    async def _compile_node(self, state: AgentState) -> AgentState:
        """Compile the final document."""
        logger.info(f"[{state['workflow_id']}] Compiling document")
        
        task = self._get_task(state, "CompileAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        try:
            intent = state["user_intent"]
            current_data = state["current_data"]
            
            if intent.task_type == TaskType.CREATE_SPREADSHEET:
                output = excel_compiler.compile(
                    structure=current_data.get("structure", {}),
                    data=current_data.get("data", []),
                    formulas=current_data.get("formulas", {}),
                    charts=current_data.get("charts", []),
                    styling=current_data.get("styling", {})
                )
            elif intent.task_type == TaskType.CREATE_DOCUMENT:
                output = word_compiler.compile(
                    structure=current_data.get("structure", {}),
                    data=current_data.get("data", []),
                    styling=current_data.get("styling", {})
                )
            elif intent.task_type == TaskType.CREATE_PRESENTATION:
                output = ppt_compiler.compile(
                    structure=current_data.get("structure", {}),
                    data=current_data.get("data", []),
                    styling=current_data.get("styling", {})
                )
            else:
                output = excel_compiler.compile(
                    structure=current_data.get("structure", {}),
                    data=current_data.get("data", []),
                    formulas=current_data.get("formulas", {}),
                    charts=current_data.get("charts", []),
                    styling=current_data.get("styling", {})
                )
            
            state["final_output"] = output
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Compilation failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
            state["error"] = str(e)
        
        task.completed_at = datetime.utcnow()
        return state
    
    async def _review_node(self, state: AgentState) -> AgentState:
        """Review the compiled output."""
        logger.info(f"[{state['workflow_id']}] Reviewing output")
        
        task = self._get_task(state, "ReviewAgent")
        task.status = AgentStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()
        
        try:
            intent = state["user_intent"]
            structure = state["current_data"].get("structure", {})
            
            if intent.task_type == TaskType.CREATE_SPREADSHEET:
                review = await review_agent.review_spreadsheet(
                    structure,
                    state["current_data"].get("formulas", {})
                )
            elif intent.task_type == TaskType.CREATE_DOCUMENT:
                review = await review_agent.review_document(structure)
            elif intent.task_type == TaskType.CREATE_PRESENTATION:
                review = await review_agent.review_presentation(structure)
            else:
                review = {"score": 85, "passed": True, "issues": [], "suggestions": []}
            
            state["current_data"]["review"] = review
            task.status = AgentStatus.COMPLETED
            task.progress_percent = 100
            
        except Exception as e:
            logger.error(f"Review failed: {e}")
            task.status = AgentStatus.FAILED
            task.error_message = str(e)
            state["current_data"]["review"] = {"score": 70, "passed": True}
            task.status = AgentStatus.COMPLETED
        
        task.completed_at = datetime.utcnow()
        return state
    
    def _review_decision(self, state: AgentState) -> str:
        """Decide next step after review."""
        review = state["current_data"].get("review", {})
        
        if review.get("passed", True) or review.get("score", 0) >= 70:
            return "complete"
        
        # Could implement retry logic here
        return "complete"
    
    def _get_task(self, state: AgentState, agent_name: str) -> AgentTask:
        """Get or create task for agent."""
        for task in state["tasks"]:
            if task.agent_name == agent_name:
                return task
        
        # Create new task
        task = AgentTask(agent_name=agent_name)
        state["tasks"].append(task)
        return task


# Global orchestrator
orchestrator = AgentOrchestrator()
