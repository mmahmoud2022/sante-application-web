"""
Caching configuration and utilities
"""
import redis.asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from typing import Optional

from app.core.config import settings


async def init_cache():
    """
    Initialize Redis cache backend
    
    Should be called on application startup
    """
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf8",
            decode_responses=True
        )
        FastAPICache.init(RedisBackend(redis_client), prefix="sante-cache:")
        return redis_client
    except Exception as e:
        # Log error but don't fail application startup
        print(f"Warning: Failed to initialize cache: {e}")
        return None


async def clear_cache(pattern: Optional[str] = None):
    """
    Clear cache entries matching a pattern
    
    Args:
        pattern: Redis key pattern (e.g., "sante-cache:doctors:*")
                If None, clears all cache
    """
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL)
        if pattern:
            keys = await redis_client.keys(pattern)
            if keys:
                await redis_client.delete(*keys)
        else:
            await redis_client.flushdb()
    except Exception as e:
        print(f"Error clearing cache: {e}")


# Cache decorators with common configurations
def cache_short(expire: int = 60):
    """Short-term cache (1 minute default) for frequently changing data"""
    return cache(expire=expire)


def cache_medium(expire: int = 300):
    """Medium-term cache (5 minutes default) for moderately stable data"""
    return cache(expire=expire)


def cache_long(expire: int = 3600):
    """Long-term cache (1 hour default) for stable data"""
    return cache(expire=expire)
