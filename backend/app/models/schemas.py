"""Pydantic models for the AI Office Suite."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
from datetime import datetime


class TaskType(str, Enum):
    """Types of tasks the system can handle."""
    CREATE_SPREADSHEET = "create_spreadsheet"
    ANALYZE_DATA = "analyze_data"
    GENERATE_REPORT = "generate_report"
    CREATE_PRESENTATION = "create_presentation"
    TRANSFORM_FILE = "transform_file"
    EDIT_EXISTING = "edit_existing"
    CREATE_DOCUMENT = "create_document"


class OutputFormat(str, Enum):
    """Supported output formats."""
    EXCEL = "excel"
    WORD = "word"
    POWERPOINT = "powerpoint"
    PDF = "pdf"
    CSV = "csv"
    AUTO = "auto"


class UserIntent(BaseModel):
    """Structured user intent from classification."""
    task_type: TaskType = Field(..., description="The type of task")
    description: str = Field(..., description="Original user description")
    goal: str = Field(..., description="Specific goal to achieve")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Constraints like format, style, length")
    output_format: OutputFormat = Field(default=OutputFormat.AUTO, description="Desired output format")
    complexity_score: int = Field(default=5, ge=1, le=10, description="Complexity from 1-10")
    data_sources: List[str] = Field(default_factory=list, description="References to uploaded files or URLs")


class AgentStatus(str, Enum):
    """Status of an agent task."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class AgentTask(BaseModel):
    """Individual agent task in the workflow."""
    agent_name: str = Field(..., description="Name of the agent")
    status: AgentStatus = AgentStatus.PENDING
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress_percent: int = Field(default=0, ge=0, le=100)


class WorkflowState(BaseModel):
    """Current state of the workflow execution."""
    workflow_id: str = Field(..., description="Unique workflow identifier")
    user_intent: UserIntent
    tasks: List[AgentTask] = Field(default_factory=list)
    current_task_index: int = 0
    final_output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: Literal["running", "completed", "failed"] = "running"


class FileUpload(BaseModel):
    """Information about an uploaded file."""
    file_id: str
    original_filename: str
    stored_path: str
    file_size: int
    mime_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class SpreadsheetStructure(BaseModel):
    """Structure for a spreadsheet."""
    sheet_name: str
    columns: List[Dict[str, Any]] = Field(default_factory=list)
    data: List[List[Any]] = Field(default_factory=list)
    formulas: Dict[str, str] = Field(default_factory=dict)  # cell -> formula
    charts: List[Dict[str, Any]] = Field(default_factory=list)
    conditional_formatting: List[Dict[str, Any]] = Field(default_factory=list)
    styling: Dict[str, Any] = Field(default_factory=dict)


class DocumentStructure(BaseModel):
    """Structure for a Word document."""
    title: str = ""
    sections: List[Dict[str, Any]] = Field(default_factory=list)
    tables: List[Dict[str, Any]] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)  # paths
    headers: Dict[str, Any] = Field(default_factory=dict)
    footers: Dict[str, Any] = Field(default_factory=dict)
    styling: Dict[str, Any] = Field(default_factory=dict)


class PresentationStructure(BaseModel):
    """Structure for a PowerPoint presentation."""
    title: str = ""
    slides: List[Dict[str, Any]] = Field(default_factory=list)
    theme: str = "default"
    master_slide: Optional[Dict[str, Any]] = None


class GenerationRequest(BaseModel):
    """Request to generate a document."""
    prompt: str = Field(..., description="User's natural language request")
    output_format: OutputFormat = OutputFormat.AUTO
    file_ids: List[str] = Field(default_factory=list)
    options: Dict[str, Any] = Field(default_factory=dict)


class GenerationResponse(BaseModel):
    """Response from document generation."""
    workflow_id: str
    status: str
    message: str
    download_url: Optional[str] = None
    preview_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class StreamEvent(BaseModel):
    """Event for streaming updates to client."""
    event_type: Literal["intent", "agent_start", "agent_progress", "agent_complete", "output", "error", "complete"]
    workflow_id: str
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FormulaRequest(BaseModel):
    """Request to generate an Excel formula."""
    description: str = Field(..., description="Natural language description")
    context: Dict[str, Any] = Field(default_factory=dict, description="Sheet context (columns, data, etc.)")
    cell_reference: Optional[str] = None


class FormulaResponse(BaseModel):
    """Response with generated formula."""
    formula: str
    explanation: str
    suggested_named_ranges: Dict[str, str] = Field(default_factory=dict)
    cell_reference: Optional[str] = None
