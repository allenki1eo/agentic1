"""Formula Agent - Converts natural language to Excel formulas."""
import json
import re
from typing import Dict, Any, Optional
from app.core.openrouter_client import openrouter_client
from app.models.schemas import FormulaRequest, FormulaResponse
from app.prompts.agent_prompts import FORMULA_GENERATION_PROMPT
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class FormulaAgent:
    """Agent that generates Excel formulas from natural language."""
    
    def __init__(self):
        self.common_formulas = self._load_common_formulas()
    
    def _load_common_formulas(self) -> Dict[str, str]:
        """Load common formula patterns for quick matching."""
        return {
            "sum": "SUM",
            "average": "AVERAGE",
            "count": "COUNT",
            "max": "MAX",
            "min": "MIN",
            "if": "IF",
            "vlookup": "VLOOKUP",
            "lookup": "XLOOKUP",
            "match": "MATCH",
            "index": "INDEX",
            "sumif": "SUMIF",
            "countif": "COUNTIF",
            "averageif": "AVERAGEIF",
            "concatenate": "CONCAT",
            "concat": "CONCAT",
            "left": "LEFT",
            "right": "RIGHT",
            "mid": "MID",
            "today": "TODAY",
            "now": "NOW",
            "date": "DATE",
            "year": "YEAR",
            "month": "MONTH",
            "day": "DAY",
            "round": "ROUND",
            "roundup": "ROUNDUP",
            "rounddown": "ROUNDDOWN",
            "abs": "ABS",
            "percentage": "%",
            "growth": "growth",
            "difference": "-",
            "rate": "rate",
        }
    
    async def generate_formula(
        self,
        request: FormulaRequest
    ) -> FormulaResponse:
        """Generate Excel formula from natural language description."""
        
        # Try quick pattern matching first
        quick_result = self._try_pattern_match(request)
        if quick_result:
            return quick_result
        
        # Use LLM for complex formulas
        context = request.context or {}
        
        prompt = FORMULA_GENERATION_PROMPT.format(
            request=request.description,
            sheet_name=context.get("sheet_name", "Sheet1"),
            columns=json.dumps(context.get("columns", [])),
            cell_reference=request.cell_reference or "A1",
            data_sample=json.dumps(context.get("data_sample", [])[:3])  # First 3 rows
        )
        
        messages = [
            SystemMessage(content="You are an Excel formula expert."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await openrouter_client.complete(
                messages=messages,
                model_preference="coding",
                temperature=0.2,
                json_mode=True
            )
            
            data = json.loads(response)
            
            formula = data.get("formula", "")
            # Ensure formula starts with =
            if formula and not formula.startswith("="):
                formula = "=" + formula
            
            return FormulaResponse(
                formula=formula,
                explanation=data.get("explanation", ""),
                suggested_named_ranges=data.get("suggested_named_ranges", {}),
                cell_reference=data.get("cell_reference", request.cell_reference)
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse formula JSON: {e}")
            return self._create_fallback_response(request)
        except Exception as e:
            logger.error(f"Formula generation failed: {e}")
            return self._create_fallback_response(request)
    
    def _try_pattern_match(self, request: FormulaRequest) -> Optional[FormulaResponse]:
        """Try to match common formula patterns."""
        desc_lower = request.description.lower()
        context = request.context or {}
        columns = context.get("columns", [])
        
        # Simple patterns
        if "sum of" in desc_lower or "total" in desc_lower:
            for col in columns:
                col_name = col.get("name", "")
                if col_name.lower() in desc_lower:
                    return FormulaResponse(
                        formula=f"=SUM([{col_name}])",
                        explanation=f"Sum all values in the {col_name} column",
                        cell_reference=request.cell_reference
                    )
        
        if "average" in desc_lower or "mean" in desc_lower:
            for col in columns:
                col_name = col.get("name", "")
                if col_name.lower() in desc_lower:
                    return FormulaResponse(
                        formula=f"=AVERAGE([{col_name}])",
                        explanation=f"Calculate average of {col_name} column",
                        cell_reference=request.cell_reference
                    )
        
        if "count" in desc_lower:
            return FormulaResponse(
                formula="=COUNTA([Column1])",
                explanation="Count non-empty cells",
                cell_reference=request.cell_reference
            )
        
        if "percentage" in desc_lower or "%" in desc_lower:
            return FormulaResponse(
                formula="=A1/B1",
                explanation="Calculate percentage (format as %)",
                cell_reference=request.cell_reference
            )
        
        return None
    
    def _create_fallback_response(self, request: FormulaRequest) -> FormulaResponse:
        """Create a safe fallback response."""
        return FormulaResponse(
            formula="=0",
            explanation="Placeholder formula - manual entry required",
            cell_reference=request.cell_reference
        )
    
    def validate_formula(self, formula: str) -> bool:
        """Basic validation of Excel formula syntax."""
        if not formula:
            return False
        
        # Must start with =
        if not formula.startswith("="):
            return False
        
        # Check for balanced parentheses
        if formula.count("(") != formula.count(")"):
            return False
        
        # Check for invalid characters
        invalid_chars = ["{", "}", "[", "]"]  # These are valid in structured refs but check context
        # More validation could be added
        
        return True
    
    async def generate_multiple_formulas(
        self,
        descriptions: list[str],
        context: Dict[str, Any]
    ) -> Dict[str, FormulaResponse]:
        """Generate multiple formulas efficiently."""
        results = {}
        for i, desc in enumerate(descriptions):
            request = FormulaRequest(
                description=desc,
                context=context,
                cell_reference=f"Z{i+1}"  # Temporary reference
            )
            results[desc] = await self.generate_formula(request)
        return results


# Global instance
formula_agent = FormulaAgent()
