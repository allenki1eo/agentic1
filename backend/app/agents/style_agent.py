"""Style Agent - Applies professional formatting to documents."""
import json
from typing import Dict, Any, List
from app.core.openrouter_client import openrouter_client
from app.prompts.agent_prompts import STYLE_AGENT_PROMPT
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class StyleAgent:
    """Agent that applies professional styling to documents."""
    
    # Professional color palettes
    PALETTES = {
        "corporate": {
            "primary": "#4472C4",
            "secondary": "#ED7D31",
            "accent": "#A5A5A5",
            "background": "#FFFFFF",
            "text": "#000000",
            "header_bg": "#4472C4",
            "header_text": "#FFFFFF",
            "alternating_row": "#D9E1F2"
        },
        "modern": {
            "primary": "#2D3142",
            "secondary": "#4F5D75",
            "accent": "#BFC0C0",
            "background": "#FFFFFF",
            "text": "#2D3142",
            "header_bg": "#2D3142",
            "header_text": "#FFFFFF",
            "alternating_row": "#EFEFD0"
        },
        "minimal": {
            "primary": "#000000",
            "secondary": "#666666",
            "accent": "#CCCCCC",
            "background": "#FFFFFF",
            "text": "#333333",
            "header_bg": "#F5F5F5",
            "header_text": "#000000",
            "alternating_row": "#FAFAFA"
        },
        "warm": {
            "primary": "#E07A5F",
            "secondary": "#3D405B",
            "accent": "#81B29A",
            "background": "#F4F1DE",
            "text": "#3D405B",
            "header_bg": "#E07A5F",
            "header_text": "#FFFFFF",
            "alternating_row": "#F2CC8F"
        },
        "cool": {
            "primary": "#264653",
            "secondary": "#2A9D8F",
            "accent": "#E9C46A",
            "background": "#FFFFFF",
            "text": "#264653",
            "header_bg": "#264653",
            "header_text": "#FFFFFF",
            "alternating_row": "#E9F5F5"
        }
    }
    
    # Font pairings
    FONTS = {
        "corporate": {"header": "Calibri", "body": "Calibri"},
        "modern": {"header": "Segoe UI", "body": "Segoe UI"},
        "traditional": {"header": "Times New Roman", "body": "Calibri"},
        "creative": {"header": "Arial", "body": "Verdana"}
    }
    
    async def style_spreadsheet(
        self,
        purpose: str = "general",
        audience: str = "corporate",
        theme: str = "corporate"
    ) -> Dict[str, Any]:
        """Generate spreadsheet styling configuration."""
        
        theme_config = self._get_theme_config(theme)
        
        return {
            "theme": theme,
            "header_style": {
                "font": {"name": theme_config["fonts"]["header"], "bold": True, "size": 11, "color": theme_config["colors"]["header_text"]},
                "fill": {"type": "solid", "fgColor": {"rgb": theme_config["colors"]["header_bg"].replace("#", "")}},
                "border": {
                    "bottom": {"style": "thin", "color": {"rgb": "000000"}}
                },
                "alignment": {"horizontal": "center", "vertical": "center"}
            },
            "data_style": {
                "font": {"name": theme_config["fonts"]["body"], "size": 10},
                "alignment": {"horizontal": "left", "vertical": "center"}
            },
            "alternating_rows": {
                "enabled": True,
                "fill": {"type": "solid", "fgColor": {"rgb": theme_config["colors"]["alternating_row"].replace("#", "")}}
            },
            "number_format": {
                "currency": '"$"#,##0.00',
                "percentage": '0.00%',
                "date": 'YYYY-MM-DD',
                "number": '#,##0.00'
            },
            "conditional_formatting": [
                {
                    "type": "color_scale",
                    "range": None,  # Apply to all numeric cells
                    "min_color": "FFFFFF",
                    "max_color": theme_config["colors"]["primary"].replace("#", "")
                }
            ],
            "column_widths": "auto",
            "row_heights": {"header": 25, "data": 20}
        }
    
    async def style_document(
        self,
        doc_type: str = "report",
        theme: str = "corporate",
        constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate document styling configuration."""
        
        constraints = constraints or {}
        theme_config = self._get_theme_config(theme)
        
        # Extract font from constraints if specified
        font_name = constraints.get("font", theme_config["fonts"]["body"])
        header_font = constraints.get("header_font", font_name)
        
        # Extract spacing from constraints
        line_spacing = constraints.get("line_spacing", 1.15)
        space_before_h1 = constraints.get("space_before_h1", 12)
        space_after_h1 = constraints.get("space_after_h1", 6)
        
        return {
            "theme": theme,
            "paragraph_styles": {
                "Normal": {
                    "font": font_name,
                    "size": 11,
                    "line_spacing": line_spacing
                },
                "Heading 1": {
                    "font": header_font,
                    "size": 16,
                    "bold": True,
                    "color": theme_config["colors"]["primary"],
                    "space_before": space_before_h1,
                    "space_after": space_after_h1
                },
                "Heading 2": {
                    "font": header_font,
                    "size": 14,
                    "bold": True,
                    "color": theme_config["colors"]["secondary"],
                    "space_before": 10,
                    "space_after": 4
                },
                "Heading 3": {
                    "font": header_font,
                    "size": 12,
                    "bold": True,
                    "color": theme_config["colors"]["text"],
                    "space_before": 8,
                    "space_after": 4
                }
            },
            "table_styles": {
                "default": {
                    "header_fill": theme_config["colors"]["header_bg"],
                    "header_text": theme_config["colors"]["header_text"],
                    "border_color": theme_config["colors"]["accent"],
                    "alternating_fill": theme_config["colors"]["alternating_row"]
                }
            },
            "page_setup": {
                "margin_top": 1.0,
                "margin_bottom": 1.0,
                "margin_left": 1.0,
                "margin_right": 1.0
            }
        }
    
    async def style_presentation(
        self,
        theme: str = "corporate"
    ) -> Dict[str, Any]:
        """Generate presentation styling configuration."""
        
        theme_config = self._get_theme_config(theme)
        
        return {
            "theme": theme,
            "slide_master": {
                "title_font": {"name": theme_config["fonts"]["header"], "size": 44, "bold": True, "color": theme_config["colors"]["primary"]},
                "body_font": {"name": theme_config["fonts"]["body"], "size": 18, "color": theme_config["colors"]["text"]},
                "background_color": theme_config["colors"]["background"],
                "accent_color": theme_config["colors"]["accent"]
            },
            "color_scheme": [
                theme_config["colors"]["primary"],
                theme_config["colors"]["secondary"],
                theme_config["colors"]["accent"],
                "#FFC000",
                "#5B9BD5"
            ],
            "chart_styles": {
                "default_colors": [
                    theme_config["colors"]["primary"],
                    theme_config["colors"]["secondary"],
                    theme_config["colors"]["accent"]
                ]
            }
        }
    
    def _get_theme_config(self, theme: str) -> Dict[str, Any]:
        """Get theme configuration."""
        colors = self.PALETTES.get(theme, self.PALETTES["corporate"])
        fonts = self.FONTS.get(theme, self.FONTS["corporate"])
        
        return {
            "colors": colors,
            "fonts": fonts
        }
    
    def suggest_theme(
        self,
        purpose: str,
        audience: str,
        brand_colors: List[str] = None
    ) -> str:
        """Suggest appropriate theme based on context."""
        
        purpose_lower = purpose.lower()
        audience_lower = audience.lower()
        
        # Financial/Formal → Corporate
        if any(word in purpose_lower for word in ["financial", "report", "quarterly", "audit"]):
            return "corporate"
        
        # Tech/Startup → Modern
        if any(word in purpose_lower for word in ["tech", "startup", "app", "software"]):
            return "modern"
        
        # Education/Training → Warm
        if any(word in purpose_lower for word in ["training", "education", "workshop"]):
            return "warm"
        
        # Healthcare/Science → Cool
        if any(word in purpose_lower for word in ["health", "medical", "science", "research"]):
            return "cool"
        
        # Default based on audience
        if "corporate" in audience_lower or "executive" in audience_lower:
            return "corporate"
        
        if "creative" in audience_lower or "design" in audience_lower:
            return "warm"
        
        return "corporate"


# Global instance
style_agent = StyleAgent()
