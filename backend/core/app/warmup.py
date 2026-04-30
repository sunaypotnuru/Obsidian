"""
Warm-up script to load DeepSeek-R1 into memory on startup.
This eliminates the 10-30s delay on first request.
"""

import logging
import ollama

logger = logging.getLogger(__name__)


async def warmup_deepseek():
    """
    Send a simple request to DeepSeek-R1 to load it into memory.
    This should be called when the FastAPI app starts.
    """
    try:

        logger.info("🔥 Warming up DeepSeek-R1 model...")

        # Simple test request to load model into memory
        _ = ollama.chat(
            model="deepseek-r1:14b",
            messages=[{"role": "user", "content": "Hello, are you ready?"}],
            options={"num_predict": 10},  # Short response for quick warmup
        )

        logger.info("✅ DeepSeek-R1 is warmed up and ready!")
        return True

    except Exception as e:
        logger.warning(f"⚠️ DeepSeek-R1 warmup failed: {e}")
        logger.warning("Model will load on first request (10-30s delay)")
        return False


def warmup_deepseek_sync():
    """Synchronous version for use in startup events."""
    try:

        logger.info("🔥 Warming up DeepSeek-R1 model...")
        _ = ollama.chat(
            model="deepseek-r1:14b",
            messages=[{"role": "user", "content": "Hello, are you ready?"}],
            options={"num_predict": 10},
        )

        logger.info("✅ DeepSeek-R1 is warmed up and ready!")
        return True

    except Exception as e:
        logger.warning(f"⚠️ DeepSeek-R1 warmup failed: {e}")
        return False
