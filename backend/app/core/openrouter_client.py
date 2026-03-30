"""OpenRouter client with automatic model fallback and rate limiting."""
import asyncio
import time
from typing import AsyncGenerator, Optional, List, Dict, Any
from dataclasses import dataclass
from openai import AsyncOpenAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@dataclass
class ModelConfig:
    """Configuration for a single model."""
    name: str
    context_length: int
    priority: int  # Lower = higher priority
    rpm_limit: int = 20
    rpd_limit: int = 200


# Free model configurations from OpenRouter
FREE_MODELS = {
    "arcee-ai/trinity-large-preview:free": ModelConfig("arcee-ai/trinity-large-preview:free", 128000, 1),
    "google/gemini-2.0-flash-exp:free": ModelConfig("google/gemini-2.0-flash-exp:free", 1000000, 2),
    "deepseek/deepseek-r1:free": ModelConfig("deepseek/deepseek-r1:free", 128000, 3),
    "meta-llama/llama-3.3-70b-instruct:free": ModelConfig("meta-llama/llama-3.3-70b-instruct:free", 131072, 4),
}


class RateLimiter:
    """Rate limiter with per-model tracking."""
    
    def __init__(self):
        self._requests: Dict[str, List[float]] = {}  # model -> list of timestamps
        self._lock = asyncio.Lock()
    
    async def check_and_record(self, model: str, rpm: int = 20, rpd: int = 200) -> bool:
        """Check if request is allowed and record if yes."""
        async with self._lock:
            now = time.time()
            
            if model not in self._requests:
                self._requests[model] = []
            
            # Clean old entries (beyond 1 day)
            cutoff_day = now - 86400
            self._requests[model] = [t for t in self._requests[model] if t > cutoff_day]
            
            # Check daily limit
            if len(self._requests[model]) >= rpd:
                return False
            
            # Check per-minute limit
            cutoff_minute = now - 60
            recent = [t for t in self._requests[model] if t > cutoff_minute]
            if len(recent) >= rpm:
                return False
            
            # Record request
            self._requests[model].append(now)
            return True
    
    async def get_wait_time(self, model: str, rpm: int = 20) -> float:
        """Get seconds to wait before next request is allowed."""
        async with self._lock:
            if model not in self._requests or not self._requests[model]:
                return 0
            
            now = time.time()
            cutoff_minute = now - 60
            recent = [t for t in self._requests[model] if t > cutoff_minute]
            
            if len(recent) < rpm:
                return 0
            
            # Wait until oldest request expires
            oldest = min(recent)
            return max(0, (oldest + 60) - now)


class OpenRouterClient:
    """Unified OpenRouter client with automatic model fallback."""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY,
        )
        self.rate_limiter = RateLimiter()
        self._last_model_used: Optional[str] = None
    
    async def _get_available_model(self, preferred_models: List[str]) -> Optional[str]:
        """Get first available model based on rate limits."""
        for model in preferred_models:
            if await self.rate_limiter.check_and_record(
                model, 
                FREE_MODELS[model].rpm_limit if model in FREE_MODELS else 20,
                FREE_MODELS[model].rpd_limit if model in FREE_MODELS else 200
            ):
                return model
        return None
    
    async def _wait_for_available_model(self, preferred_models: List[str]) -> str:
        """Wait until a model becomes available."""
        while True:
            model = await self._get_available_model(preferred_models)
            if model:
                return model
            
            # Find minimum wait time
            min_wait = float('inf')
            for model in preferred_models:
                wait = await self.rate_limiter.get_wait_time(
                    model,
                    FREE_MODELS[model].rpm_limit if model in FREE_MODELS else 20
                )
                min_wait = min(min_wait, wait)
            
            if min_wait == float('inf'):
                min_wait = 3  # Default wait
            
            logger.info(f"Rate limited, waiting {min_wait:.1f}s")
            await asyncio.sleep(min_wait)
    
    async def complete(
        self,
        messages: List[BaseMessage],
        model_preference: str = "primary",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False
    ) -> str:
        """Complete a chat with automatic model selection."""
        
        # Determine model preference order
        if model_preference == "primary":
            preferred = [settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        elif model_preference == "coding":
            preferred = [settings.CODING_MODEL, settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        elif model_preference == "reasoning":
            preferred = [settings.REASONING_MODEL, settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        elif model_preference in FREE_MODELS:
            preferred = [model_preference] + [m for m in FREE_MODELS if m != model_preference]
        else:
            preferred = [settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        
        # Get available model
        model = await self._wait_for_available_model(preferred)
        self._last_model_used = model
        
        # Convert messages to OpenAI format
        openai_messages = []
        for msg in messages:
            role = "system" if isinstance(msg, SystemMessage) else "user"
            if isinstance(msg, HumanMessage) and not isinstance(msg, SystemMessage):
                role = "user"
            openai_messages.append({"role": role, "content": msg.content})
        
        # Build request kwargs
        kwargs = {
            "model": model,
            "messages": openai_messages,
            "temperature": temperature,
        }
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        
        # Add reasoning for Trinity model
        if "trinity" in model.lower():
            kwargs["extra_body"] = {"reasoning": {"enabled": True}}
        
        logger.info(f"Using model: {model}")
        logger.info(f"Request kwargs: {kwargs}")
        
        try:
            response = await self.client.chat.completions.create(**kwargs)
            logger.info(f"Response received from {model}")
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"API call failed for model {model}: {e}")
            raise
    
    async def stream_complete(
        self,
        messages: List[BaseMessage],
        model_preference: str = "primary",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Stream completion with automatic model selection."""
        
        # Determine model preference order
        if model_preference == "primary":
            preferred = [settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        elif model_preference == "coding":
            preferred = [settings.CODING_MODEL, settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        elif model_preference == "reasoning":
            preferred = [settings.REASONING_MODEL, settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        elif model_preference in FREE_MODELS:
            preferred = [model_preference] + [m for m in FREE_MODELS if m != model_preference]
        else:
            preferred = [settings.PRIMARY_MODEL] + settings.FALLBACK_MODELS
        
        # Get available model
        model = await self._wait_for_available_model(preferred)
        self._last_model_used = model
        
        # Convert messages
        openai_messages = []
        for msg in messages:
            role = "system" if isinstance(msg, SystemMessage) else "user"
            if isinstance(msg, HumanMessage) and not isinstance(msg, SystemMessage):
                role = "user"
            openai_messages.append({"role": role, "content": msg.content})
        
        kwargs = {
            "model": model,
            "messages": openai_messages,
            "temperature": temperature,
            "stream": True,
        }
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        
        logger.info(f"Streaming with model: {model}")
        
        stream = await self.client.chat.completions.create(**kwargs)
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def get_last_model(self) -> Optional[str]:
        """Get the last model used."""
        return self._last_model_used
    
    def create_langchain_model(self, model_name: Optional[str] = None, temperature: float = 0.7) -> ChatOpenAI:
        """Create a LangChain-compatible model instance."""
        model = model_name or settings.PRIMARY_MODEL
        return ChatOpenAI(
            model=model,
            openai_api_key=settings.OPENROUTER_API_KEY,
            openai_api_base=settings.OPENROUTER_BASE_URL,
            temperature=temperature,
        )


# Global client instance
openrouter_client = OpenRouterClient()
