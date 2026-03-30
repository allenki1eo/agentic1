"""Chart Agent - Designs and configures data visualizations."""
import json
from typing import Dict, Any, List, Optional
from app.core.openrouter_client import openrouter_client
from app.prompts.agent_prompts import CHART_AGENT_PROMPT
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class ChartAgent:
    """Agent that designs charts for data visualization."""
    
    async def design_charts(
        self,
        data_description: str,
        chart_purpose: str,
        sheet_name: str = "Data"
    ) -> List[Dict[str, Any]]:
        """Design appropriate charts for the data."""
        
        prompt = CHART_AGENT_PROMPT.format(
            data_description=data_description,
            chart_purpose=chart_purpose,
            sheet_name=sheet_name
        )
        
        messages = [
            SystemMessage(content="You are a data visualization expert."),
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
            charts = data.get("charts", [])
            
            if not charts:
                charts = self._create_default_charts(data_description)
            
            return charts
            
        except Exception as e:
            logger.error(f"Chart design failed: {e}")
            return self._create_default_charts(data_description)
    
    def _create_default_charts(self, data_description: str) -> List[Dict[str, Any]]:
        """Create default chart suggestions."""
        return [
            {
                "type": "column",
                "subtype": "clustered",
                "title": "Data Overview",
                "data_range": "A1:D10",
                "x_axis": "Category",
                "y_axis": "Value",
                "position": {"sheet": "Dashboard", "left": 100, "top": 100, "width": 400, "height": 250},
                "style": {
                    "colors": ["#4472C4", "#ED7D31"],
                    "show_legend": True,
                    "show_data_labels": False
                }
            }
        ]
    
    def select_chart_type(
        self,
        data: List[Dict[str, Any]],
        x_column: str,
        y_column: str,
        purpose: str = "comparison"
    ) -> str:
        """Select best chart type based on data characteristics."""
        
        if not data or x_column not in data[0] or y_column not in data[0]:
            return "column"
        
        x_vals = [row.get(x_column) for row in data if row.get(x_column) is not None]
        y_vals = [row.get(y_column) for row in data if row.get(y_column) is not None]
        
        # Check if X is date/time
        is_time_series = False
        if x_vals and isinstance(x_vals[0], str):
            # Simple date detection
            date_indicators = ["date", "time", "month", "year", "day"]
            if any(ind in x_column.lower() for ind in date_indicators):
                is_time_series = True
        
        # Check data types
        x_numeric = all(isinstance(v, (int, float)) for v in x_vals[:10])
        y_numeric = all(isinstance(v, (int, float)) for v in y_vals[:10])
        
        # Decision logic
        if is_time_series:
            return "line"  # Time series → line chart
        
        if x_numeric and y_numeric:
            return "scatter"  # Both numeric → scatter for correlation
        
        if purpose == "comparison":
            unique_x = len(set(str(v) for v in x_vals))
            if unique_x <= 5:
                return "pie"  # Few categories → pie
            return "column"  # Many categories → column
        
        if purpose == "distribution":
            return "histogram"
        
        return "column"
    
    def get_chart_config(
        self,
        chart_type: str,
        title: str,
        data_range: str,
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Get full chart configuration."""
        
        options = options or {}
        
        base_config = {
            "type": chart_type,
            "title": title,
            "data_range": data_range,
            "position": options.get("position", {"sheet": "Dashboard", "left": 100, "top": 100, "width": 500, "height": 300}),
            "style": {
                "colors": options.get("colors", ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000"]),
                "show_legend": options.get("show_legend", True),
                "show_data_labels": options.get("show_data_labels", False),
                "chart_style": options.get("chart_style", 2)  # Excel chart style
            }
        }
        
        # Type-specific configurations
        if chart_type == "pie":
            base_config["subtype"] = "pie"
        elif chart_type == "column":
            base_config["subtype"] = options.get("subtype", "clustered")
        elif chart_type == "bar":
            base_config["subtype"] = options.get("subtype", "clustered")
        elif chart_type == "line":
            base_config["subtype"] = options.get("subtype", "line")
            base_config["style"]["smooth_lines"] = options.get("smooth_lines", True)
        elif chart_type == "scatter":
            base_config["subtype"] = options.get("subtype", "markers")
        
        return base_config
    
    def suggest_colors(self, count: int = 4) -> List[str]:
        """Suggest a professional color palette."""
        palettes = {
            "corporate": ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5"],
            "modern": ["#00B0F0", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3"],
            "warm": ["#E07A5F", "#3D405B", "#81B29A", "#F2CC8F", "#F4F1DE"],
            "cool": ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
        }
        
        # Default to corporate
        colors = palettes["corporate"]
        return colors[:count] if count <= len(colors) else colors


# Global instance
chart_agent = ChartAgent()
