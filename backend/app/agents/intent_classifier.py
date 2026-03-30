"""Intent classification using LLM."""
import json
from typing import List
from app.core.openrouter_client import openrouter_client
from app.models.schemas import UserIntent, TaskType, OutputFormat
from app.prompts.agent_prompts import INTENT_CLASSIFICATION_PROMPT
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class IntentClassifier:
    """Classifies user intent using LLM."""
    
    async def classify(
        self,
        user_input: str,
        file_names: List[str] = None
    ) -> UserIntent:
        """Classify user intent from natural language."""
        
        file_names = file_names or []
        
        # Build prompt
        prompt = INTENT_CLASSIFICATION_PROMPT.format(
            user_input=user_input,
            file_names=", ".join(file_names) if file_names else "None"
        )
        
        messages = [
            SystemMessage(content="You classify user intents for an AI office suite."),
            HumanMessage(content=prompt)
        ]
        
        try:
            # Get completion with JSON mode
            logger.info(f"Classifying intent for: {user_input[:50]}...")
            response = await openrouter_client.complete(
                messages=messages,
                model_preference="reasoning",
                temperature=0.3,
                json_mode=True
            )
            logger.info(f"Intent classification response received")
            
            # Parse JSON response
            data = json.loads(response)
            logger.info(f"Parsed intent: {data}")
            
            # Convert string enum values to proper enums
            intent = UserIntent(
                task_type=TaskType(data.get("task_type", "create_spreadsheet")),
                description=data.get("description", user_input),
                goal=data.get("goal", ""),
                constraints=data.get("constraints", {}),
                output_format=OutputFormat(data.get("output_format", "auto")),
                complexity_score=data.get("complexity_score", 5),
                data_sources=data.get("data_sources", file_names)
            )
            
            logger.info(f"Classified intent: {intent.task_type.value}, complexity: {intent.complexity_score}")
            return intent
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse intent JSON: {e}")
            # Fallback to basic classification
            return self._fallback_classify(user_input, file_names)
        except Exception as e:
            logger.error(f"Intent classification failed: {e}")
            return self._fallback_classify(user_input, file_names)
    
    def _fallback_classify(self, user_input: str, file_names: List[str]) -> UserIntent:
        """Simple rule-based fallback classification with constraint extraction."""
        text_lower = user_input.lower()
        
        # Extract constraints
        constraints = self._extract_constraints(user_input)
        
        # Determine task type
        if any(word in text_lower for word in ["spreadsheet", "excel", "csv", "sheet", "table", "formula"]):
            task_type = TaskType.CREATE_SPREADSHEET
            output_format = OutputFormat.EXCEL
        elif any(word in text_lower for word in ["presentation", "slides", "powerpoint", "deck", "slideshow"]):
            task_type = TaskType.CREATE_PRESENTATION
            output_format = OutputFormat.POWERPOINT
        elif any(word in text_lower for word in ["document", "report", "word", "letter", "memo"]):
            task_type = TaskType.CREATE_DOCUMENT
            output_format = OutputFormat.WORD
        elif any(word in text_lower for word in ["analyze", "analysis", "insights", "statistics"]):
            task_type = TaskType.ANALYZE_DATA
            output_format = OutputFormat.EXCEL
        else:
            task_type = TaskType.CREATE_SPREADSHEET
            output_format = OutputFormat.EXCEL
        
        return UserIntent(
            task_type=task_type,
            description=user_input,
            goal="Create professional document based on request",
            constraints=constraints,
            output_format=output_format,
            complexity_score=5,
            data_sources=file_names
        )
    
    def _extract_constraints(self, user_input: str) -> dict:
        """Extract formatting constraints from user input."""
        constraints = {}
        text_lower = user_input.lower()
        
        # Extract font specifications
        font_match = None
        if "calibri" in text_lower:
            font_match = "Calibri"
        elif "arial" in text_lower:
            font_match = "Arial"
        elif "times new roman" in text_lower:
            font_match = "Times New Roman"
        elif "segoe" in text_lower:
            font_match = "Segoe UI"
        elif "verdana" in text_lower:
            font_match = "Verdana"
        
        if font_match:
            constraints["font"] = font_match
            constraints["header_font"] = font_match
        
        # Extract spacing requirements
        if "double space" in text_lower or "double spacing" in text_lower:
            constraints["line_spacing"] = 2.0
        elif "1.5 space" in text_lower or "1.5 spacing" in text_lower:
            constraints["line_spacing"] = 1.5
        elif "single space" in text_lower:
            constraints["line_spacing"] = 1.0
        
        # Extract margin requirements
        if "wide margin" in text_lower:
            constraints["margin_left"] = 1.5
            constraints["margin_right"] = 1.5
        
        # Extract page size
        if "a4" in text_lower:
            constraints["page_size"] = "A4"
        elif "letter" in text_lower:
            constraints["page_size"] = "Letter"
        
        # Extract theme/color preferences
        if "modern" in text_lower:
            constraints["theme"] = "modern"
        elif "minimal" in text_lower:
            constraints["theme"] = "minimal"
        elif "corporate" in text_lower:
            constraints["theme"] = "corporate"
        
        return constraints


# Global classifier instance
intent_classifier = IntentClassifier()
