"""
Redis caching utility for Netra AI
Provides caching decorators and functions to reduce database load
"""

import os
import json
import functools
import logging
from typing import Callable, Optional

try:
    import redis
    from redis import Redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("Redis not installed. Caching will be disabled.")

logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client: Optional[Redis] = None


def init_redis():
    """Initialize Redis connection"""
    global redis_client

    if not REDIS_AVAILABLE:
        logger.warning("Redis not available. Caching disabled.")
        return None

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    try:
        redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,
        )
        # Test connection
        redis_client.ping()
        logger.info(f"Redis connected successfully: {redis_url}")
        return redis_client
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None
        return None


def get_redis_client() -> Optional[Redis]:
    """Get Redis client instance"""
    global redis_client
    if redis_client is None:
        init_redis()
    return redis_client


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
    return ":".join(key_parts)


def cache(ttl: int = 300, prefix: str = "netra"):
    """
    Caching decorator with TTL (time-to-live)

    Args:
        ttl: Time to live in seconds (default: 300 = 5 minutes)
        prefix: Cache key prefix (default: "netra")

    Usage:
        @cache(ttl=600, prefix="doctor")
        async def get_doctor_profile(doctor_id: str):
            # ... expensive database query
            return profile
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            client = get_redis_client()

            # If Redis not available, just call the function
            if client is None:
                return await func(*args, **kwargs)

            # Generate cache key
            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"

            try:
                # Try to get from cache
                cached_value = client.get(key)
                if cached_value is not None:
                    logger.debug(f"Cache HIT: {key}")
                    return json.loads(cached_value)

                # Cache miss - call function
                logger.debug(f"Cache MISS: {key}")
                result = await func(*args, **kwargs)

                # Store in cache
                client.setex(key, ttl, json.dumps(result, default=str))
                return result

            except Exception as e:
                logger.error(f"Cache error for {key}: {e}")
                # On error,
                # On error, just call the function
                return await func(*args, **kwargs)

        return wrapper

    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache keys matching pattern

    Args:
        pattern: Redis key pattern (e.g., "doctor:*", "patient:123:*")

    Usage:
        invalidate_cache("doctor:abc123:*")  # Invalidate all doctor abc123 caches
    """
    client = get_redis_client()
    if client is None:
        return

    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys matching: {pattern}")
    except Exception as e:
        logger.error(f"Failed to invalidate cache pattern {pattern}: {e}")


def clear_all_cache():
    """Clear all cache (use with caution!)"""
    client = get_redis_client()
    if client is None:
        return

    try:
        client.flushdb()
        logger.warning("All cache cleared!")
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")


def get_cache_stats() -> dict:
    """Get Redis cache statistics"""
    client = get_redis_client()
    if client is None:
        return {"status": "unavailable"}

    try:
        info = client.info()
        return {
            "status": "connected",
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "total_commands_processed": info.get("total_commands_processed"),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
            "hit_rate": (
                info.get("keyspace_hits", 0)
                / (info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1))
            )
            * 100,
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return {"status": "error", "error": str(e)}


# Initialize on module import
init_redis()
