"""Core configuration and settings for the AI Office Suite."""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenRouter Configuration
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Model Configuration - Free model configurations from OpenRouter
    PRIMARY_MODEL: str = "arcee-ai/trinity-large-preview:free"
    CODING_MODEL: str = "arcee-ai/trinity-large-preview:free"
    REASONING_MODEL: str = "arcee-ai/trinity-large-preview:free"
    FALLBACK_MODELS: List[str] = [
        "google/gemini-2.0-flash-exp:free",
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3.3-70b-instruct:free"
    ]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 20
    RATE_LIMIT_REQUESTS_PER_DAY: int = 200
    
    # Application Settings
    APP_NAME: str = "AI Office Suite"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    # File Storage
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt", ".pdf", ".csv", ".txt", ".json"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
