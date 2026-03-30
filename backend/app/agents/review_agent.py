"""Review Agent - Validates document quality and correctness."""
import json
import re
from typing import Dict, Any, List
from app.core.openrouter_client import openrouter_client
from app.prompts.agent_prompts import REVIEW_AGENT_PROMPT
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class ReviewAgent:
    """Agent that reviews and validates generated documents."""
    
    async def review_spreadsheet(
        self,
        structure: Dict[str, Any],
        formulas: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """Review spreadsheet for errors and issues."""
        
        issues = []
        score = 100
        
        # Check formulas
        if formulas:
            for cell, formula in formulas.items():
                formula_issues = self._check_formula(formula, cell)
                issues.extend(formula_issues)
                score -= len(formula_issues) * 5
        
        # Check structure
        if "sheets" in structure:
            for sheet in structure["sheets"]:
                # Check for empty sheets
                if not sheet.get("data") and not sheet.get("formulas"):
                    issues.append({
                        "severity": "minor",
                        "category": "content",
                        "description": f"Sheet '{sheet.get('name')}' has no data",
                        "suggestion": "Add sample data or remove empty sheet"
                    })
                    score -= 5
        
        # Check for common issues
        content_preview = json.dumps(structure)[:500]
        
        # Use LLM for additional review
        try:
            llm_review = await self._llm_review("spreadsheet", content_preview)
            issues.extend(llm_review.get("issues", []))
            score -= len(llm_review.get("issues", [])) * 3
        except Exception as e:
            logger.warning(f"LLM review failed: {e}")
        
        # Ensure score is within bounds
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "passed": score >= 70,
            "issues": issues,
            "suggestions": self._generate_suggestions(structure, issues)
        }
    
    async def review_document(
        self,
        structure: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Review Word document for errors and issues."""
        
        issues = []
        score = 100
        
        # Check sections
        sections = structure.get("sections", [])
        if not sections:
            issues.append({
                "severity": "critical",
                "category": "structure",
                "description": "Document has no sections",
                "suggestion": "Add at least one content section"
            })
            score -= 20
        
        # Check content
        for section in sections:
            content = section.get("content", "")
            if len(content) < 10:
                issues.append({
                    "severity": "minor",
                    "category": "content",
                    "description": f"Section '{section.get('heading')}' has very short content",
                    "suggestion": "Expand content or remove section"
                })
                score -= 3
        
        # LLM review
        content_preview = json.dumps(structure)[:500]
        try:
            llm_review = await self._llm_review("document", content_preview)
            issues.extend(llm_review.get("issues", []))
            score -= len(llm_review.get("issues", [])) * 3
        except Exception as e:
            logger.warning(f"LLM review failed: {e}")
        
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "passed": score >= 70,
            "issues": issues,
            "suggestions": self._generate_suggestions(structure, issues)
        }
    
    async def review_presentation(
        self,
        structure: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Review PowerPoint presentation for errors and issues."""
        
        issues = []
        score = 100
        
        slides = structure.get("slides", [])
        
        # Check slide count
        if len(slides) < 3:
            issues.append({
                "severity": "minor",
                "category": "structure",
                "description": "Presentation has very few slides",
                "suggestion": "Consider adding more content slides"
            })
            score -= 5
        
        if len(slides) > 30:
            issues.append({
                "severity": "major",
                "category": "structure",
                "description": "Presentation has too many slides",
                "suggestion": "Consider condensing into fewer slides"
            })
            score -= 10
        
        # Check content density
        for i, slide in enumerate(slides):
            content = slide.get("content", [])
            if isinstance(content, list) and len(content) > 6:
                issues.append({
                    "severity": "minor",
                    "category": "content",
                    "description": f"Slide {i+1} has too many bullet points ({len(content)})",
                    "suggestion": "Follow 6x6 rule: max 6 bullets, 6 words each"
                })
                score -= 2
        
        # LLM review
        content_preview = json.dumps(structure)[:500]
        try:
            llm_review = await self._llm_review("presentation", content_preview)
            issues.extend(llm_review.get("issues", []))
            score -= len(llm_review.get("issues", [])) * 3
        except Exception as e:
            logger.warning(f"LLM review failed: {e}")
        
        score = max(0, min(100, score))
        
        return {
            "score": score,
            "passed": score >= 70,
            "issues": issues,
            "suggestions": self._generate_suggestions(structure, issues)
        }
    
    def _check_formula(self, formula: str, cell: str) -> List[Dict[str, Any]]:
        """Check a single formula for errors."""
        issues = []
        
        if not formula:
            issues.append({
                "severity": "critical",
                "category": "formula",
                "description": f"Empty formula in cell {cell}",
                "suggestion": "Add valid formula or remove cell reference"
            })
            return issues
        
        # Check formula starts with =
        if not formula.startswith("="):
            issues.append({
                "severity": "critical",
                "category": "formula",
                "description": f"Formula in {cell} doesn't start with =",
                "suggestion": f"Change to '={formula}'"
            })
        
        # Check balanced parentheses
        open_count = formula.count("(")
        close_count = formula.count(")")
        if open_count != close_count:
            issues.append({
                "severity": "critical",
                "category": "formula",
                "description": f"Unbalanced parentheses in {cell}",
                "suggestion": f"Fix parentheses: {open_count} open, {close_count} close"
            })
        
        # Check for division by zero risk
        if "/" in formula and "IFERROR" not in formula.upper():
            issues.append({
                "severity": "major",
                "category": "formula",
                "description": f"Potential division by zero in {cell}",
                "suggestion": "Wrap with IFERROR: IFERROR(formula, 0)"
            })
        
        # Check for circular reference (simple check)
        cell_ref_clean = cell.replace("$", "")
        if cell_ref_clean in formula.replace("$", ""):
            issues.append({
                "severity": "critical",
                "category": "formula",
                "description": f"Possible circular reference in {cell}",
                "suggestion": "Formula references its own cell"
            })
        
        return issues
    
    async def _llm_review(self, doc_type: str, content_preview: str) -> Dict[str, Any]:
        """Use LLM for additional review."""
        
        prompt = REVIEW_AGENT_PROMPT.format(
            doc_type=doc_type,
            content_preview=content_preview
        )
        
        messages = [
            SystemMessage(content="You are a quality assurance expert."),
            HumanMessage(content=prompt)
        ]
        
        response = await openrouter_client.complete(
            messages=messages,
            model_preference="reasoning",
            temperature=0.3,
            json_mode=True
        )
        
        return json.loads(response)
    
    def _generate_suggestions(
        self,
        structure: Dict[str, Any],
        issues: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate improvement suggestions."""
        
        suggestions = []
        
        # Add suggestions based on issues
        critical_count = sum(1 for i in issues if i["severity"] == "critical")
        if critical_count > 0:
            suggestions.append(f"Fix {critical_count} critical issues before finalizing")
        
        # General suggestions
        suggestions.append("Review all formulas with actual data")
        suggestions.append("Verify all data sources are correctly referenced")
        suggestions.append("Check that formatting is consistent throughout")
        
        return suggestions


# Global instance
review_agent = ReviewAgent()
