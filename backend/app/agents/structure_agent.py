"""Structure Agent - Designs document structure."""
import json
from typing import Dict, Any, List
from app.core.openrouter_client import openrouter_client
from app.models.schemas import SpreadsheetStructure, DocumentStructure, PresentationStructure
from app.prompts.agent_prompts import EXCEL_STRUCTURE_PROMPT, WORD_STRUCTURE_PROMPT, PRESENTATION_STRUCTURE_PROMPT
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class StructureAgent:
    """Agent that designs document structure based on user intent."""
    
    async def design_spreadsheet(
        self,
        request: str,
        context: Dict[str, Any] = None
    ) -> List[SpreadsheetStructure]:
        """Design Excel spreadsheet structure."""
        
        context = context or {}
        
        prompt = EXCEL_STRUCTURE_PROMPT.format(
            request=request,
            context=json.dumps(context)
        )
        
        messages = [
            SystemMessage(content="You are an Excel structure architect."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await openrouter_client.complete(
                messages=messages,
                model_preference="primary",
                temperature=0.4,
                json_mode=True
            )
            
            data = json.loads(response)
            
            # Parse sheets
            sheets = []
            for sheet_data in data.get("sheets", []):
                sheet = SpreadsheetStructure(
                    sheet_name=sheet_data.get("name", "Sheet1"),
                    columns=sheet_data.get("columns", []),
                    data=sheet_data.get("sample_data", []),
                    formulas=sheet_data.get("formulas", {}),
                    charts=sheet_data.get("charts", []),
                    conditional_formatting=sheet_data.get("conditional_formatting", []),
                    styling=sheet_data.get("formatting", {})
                )
                sheets.append(sheet)
            
            if not sheets:
                # Create default structure
                sheets = [self._create_default_spreadsheet()]
            
            return sheets
            
        except Exception as e:
            logger.error(f"Spreadsheet design failed: {e}")
            return [self._create_default_spreadsheet()]
    
    def _create_default_spreadsheet(self) -> SpreadsheetStructure:
        """Create a minimal default spreadsheet."""
        return SpreadsheetStructure(
            sheet_name="Data",
            columns=[
                {"name": "Item", "type": "text"},
                {"name": "Value", "type": "number"}
            ],
            data=[
                ["Sample 1", 100],
                ["Sample 2", 200],
                ["Sample 3", 300]
            ],
            formulas={},
            charts=[],
            styling={}
        )
    
    async def design_document(
        self,
        request: str,
        doc_type: str = "report"
    ) -> DocumentStructure:
        """Design Word document structure."""
        
        prompt = WORD_STRUCTURE_PROMPT.format(
            request=request,
            doc_type=doc_type
        )
        
        messages = [
            SystemMessage(content="You are a document structure expert."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await openrouter_client.complete(
                messages=messages,
                model_preference="primary",
                temperature=0.4,
                json_mode=True
            )
            
            data = json.loads(response)
            
            return DocumentStructure(
                title=data.get("title", "Document"),
                sections=data.get("sections", []),
                tables=data.get("tables", []),
                images=data.get("images", []),
                headers=data.get("headers", {}),
                footers=data.get("footers", {}),
                styling=data.get("styling", {})
            )
            
        except Exception as e:
            logger.error(f"Document design failed: {e}")
            return self._create_default_document()
    
    def _create_default_document(self) -> DocumentStructure:
        """Create a minimal default document."""
        return DocumentStructure(
            title="Generated Document",
            sections=[
                {
                    "heading": "Introduction",
                    "level": 1,
                    "content": "This is a generated document.",
                    "bullet_points": []
                }
            ],
            tables=[],
            images=[],
            headers={},
            footers={},
            styling={}
        )
    
    async def design_presentation(
        self,
        topic: str,
        audience: str = "general",
        duration: str = "15 min"
    ) -> PresentationStructure:
        """Design PowerPoint presentation structure."""
        
        prompt = PRESENTATION_STRUCTURE_PROMPT.format(
            topic=topic,
            audience=audience,
            duration=duration
        )
        
        messages = [
            SystemMessage(content="You are a presentation design expert."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await openrouter_client.complete(
                messages=messages,
                model_preference="primary",
                temperature=0.5,
                json_mode=True
            )
            
            data = json.loads(response)
            
            return PresentationStructure(
                title=data.get("title", "Presentation"),
                slides=data.get("slides", []),
                theme=data.get("theme", "default"),
                master_slide=data.get("master_slide")
            )
            
        except Exception as e:
            logger.error(f"Presentation design failed: {e}")
            return self._create_default_presentation()
    
    def _create_default_presentation(self) -> PresentationStructure:
        """Create a minimal default presentation."""
        return PresentationStructure(
            title="Presentation",
            slides=[
                {
                    "type": "title",
                    "title": "Presentation",
                    "subtitle": "Generated by AI Office Suite"
                },
                {
                    "type": "content",
                    "title": "Overview",
                    "content": ["Point 1", "Point 2", "Point 3"]
                }
            ],
            theme="default",
            master_slide=None
        )


# Global instance
structure_agent = StructureAgent()
