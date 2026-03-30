"""Data Agent - Handles data generation, fetching, and processing."""
import json
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.core.openrouter_client import openrouter_client
from langchain_core.messages import HumanMessage, SystemMessage
import logging

logger = logging.getLogger(__name__)


class DataAgent:
    """Agent that generates and processes data."""
    
    async def generate_sample_data(
        self,
        description: str,
        row_count: int = 100,
        schema: Dict[str, str] = None
    ) -> List[Dict[str, Any]]:
        """Generate sample data based on description."""
        
        schema = schema or {}
        
        # If schema provided, generate accordingly
        if schema:
            return self._generate_from_schema(schema, row_count)
        
        # Use LLM to understand and generate
        prompt = f"""Generate {row_count} rows of realistic sample data for: {description}

Provide as a JSON array of objects. Each object should have consistent keys.
Example for "sales data": [
  {{"date": "2024-01-01", "product": "Widget", "region": "North", "revenue": 1200}},
  ...
]

Generate diverse, realistic data with variety in values."""
        
        messages = [
            SystemMessage(content="You are a data generation expert."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await openrouter_client.complete(
                messages=messages,
                model_preference="reasoning",
                temperature=0.7,
                max_tokens=4000
            )
            
            # Try to parse JSON
            try:
                data = json.loads(response)
                if isinstance(data, list):
                    return data[:row_count]
            except json.JSONDecodeError:
                pass
            
            # Fallback to extraction
            return self._extract_data_from_text(response, row_count)
            
        except Exception as e:
            logger.error(f"Data generation failed: {e}")
            return self._generate_generic_data(row_count)
    
    def _generate_from_schema(
        self,
        schema: Dict[str, str],
        row_count: int
    ) -> List[Dict[str, Any]]:
        """Generate data from a schema definition."""
        data = []
        
        for i in range(row_count):
            row = {}
            for col, col_type in schema.items():
                row[col] = self._generate_value_for_type(col, col_type, i)
            data.append(row)
        
        return data
    
    def _generate_value_for_type(self, col_name: str, col_type: str, index: int) -> Any:
        """Generate a value based on column type."""
        col_lower = col_name.lower()
        type_lower = col_type.lower()
        
        # Dates
        if "date" in col_lower or type_lower == "date":
            start_date = datetime(2024, 1, 1)
            days_offset = index % 365
            return (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        # Categories
        if col_lower in ["region", "area", "territory"]:
            regions = ["North", "South", "East", "West", "Central"]
            return regions[index % len(regions)]
        
        if col_lower in ["product", "item", "sku"]:
            products = ["Widget A", "Widget B", "Gadget", "Tool", "Device"]
            return products[index % len(products)]
        
        if col_lower in ["department", "dept", "team"]:
            depts = ["Sales", "Marketing", "Engineering", "Support", "HR"]
            return depts[index % len(depts)]
        
        if col_lower in ["status", "state"]:
            statuses = ["Active", "Pending", "Completed", "On Hold"]
            return statuses[index % len(statuses)]
        
        # Numbers
        if type_lower in ["number", "int", "integer", "float", "currency", "money", "amount"]:
            base = (index + 1) * 100
            variance = random.randint(-20, 50)
            value = base + variance
            if "currency" in type_lower or "money" in type_lower:
                return round(value, 2)
            return value
        
        # Text
        if type_lower in ["text", "string", "varchar", "name"]:
            return f"Item {index + 1}"
        
        # Boolean
        if type_lower in ["bool", "boolean"]:
            return index % 2 == 0
        
        return f"Value {index + 1}"
    
    def _extract_data_from_text(self, text: str, row_count: int) -> List[Dict[str, Any]]:
        """Extract data from LLM text response."""
        try:
            # Look for JSON array
            start = text.find("[")
            end = text.rfind("]")
            if start != -1 and end != -1:
                data = json.loads(text[start:end+1])
                if isinstance(data, list):
                    return data[:row_count]
        except Exception:
            pass
        
        return self._generate_generic_data(row_count)
    
    def _generate_generic_data(self, row_count: int) -> List[Dict[str, Any]]:
        """Generate generic sample data."""
        data = []
        regions = ["North", "South", "East", "West"]
        products = ["Product A", "Product B", "Product C"]
        
        for i in range(row_count):
            data.append({
                "ID": i + 1,
                "Date": (datetime(2024, 1, 1) + timedelta(days=i % 365)).strftime("%Y-%m-%d"),
                "Region": regions[i % 4],
                "Product": products[i % 3],
                "Quantity": random.randint(10, 100),
                "Revenue": round(random.uniform(1000, 5000), 2)
            })
        
        return data
    
    def process_uploaded_file(self, file_path: str, mime_type: str) -> List[Dict[str, Any]]:
        """Process an uploaded file and extract data."""
        # This is a placeholder - full implementation would use pandas, etc.
        logger.info(f"Processing file: {file_path} ({mime_type})")
        return []
    
    def analyze_data(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform basic analysis on data."""
        if not data:
            return {"error": "No data to analyze"}
        
        analysis = {
            "row_count": len(data),
            "columns": list(data[0].keys()),
            "numeric_summary": {}
        }
        
        # Analyze numeric columns
        for col in analysis["columns"]:
            values = [row.get(col) for row in data if row.get(col) is not None]
            if values and all(isinstance(v, (int, float)) for v in values[:10]):
                numeric_vals = [v for v in values if isinstance(v, (int, float))]
                if numeric_vals:
                    analysis["numeric_summary"][col] = {
                        "sum": sum(numeric_vals),
                        "avg": sum(numeric_vals) / len(numeric_vals),
                        "min": min(numeric_vals),
                        "max": max(numeric_vals)
                    }
        
        return analysis


# Global instance
data_agent = DataAgent()
