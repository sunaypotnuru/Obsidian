import logging
import requests  # type: ignore[import-untyped]
import os

logger = logging.getLogger(__name__)

# LibreTranslate configuration
LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "http://libretranslate:5000")

# Languages supported by LibreTranslate
SUPPORTED_LANGUAGES = {
    # Indian Languages (Primary)
    "en": "en",  # English
    "hi": "hi",  # Hindi
    "mr": "mr",  # Marathi
    "ta": "ta",  # Tamil
    "te": "te",  # Telugu
    "bn": "bn",  # Bengali
    "gu": "gu",  # Gujarati
    "kn": "kn",  # Kannada
    "ml": "ml",  # Malayalam
    "pa": "pa",  # Punjabi
    "ur": "ur",  # Urdu
    # International Languages
    "ar": "ar",  # Arabic
    "de": "de",  # German
    "es": "es",  # Spanish
    "fr": "fr",  # French
    "it": "it",  # Italian
    "ja": "ja",  # Japanese
    "ko": "ko",  # Korean
    "pt": "pt",  # Portuguese
    "ru": "ru",  # Russian
    "zh": "zh",  # Chinese
}

# Fallback mapping for unsupported languages (if any)
LANGUAGE_FALLBACKS = {
    "or": "hi",  # Odia -> Hindi (not in LibreTranslate)
    "as": "hi",  # Assamese -> Hindi (not in LibreTranslate)
    "sa": "hi",  # Sanskrit -> Hindi (not in LibreTranslate)
}


def get_effective_language(lang_code: str) -> str:
    """Get the effective language code for translation."""
    if lang_code in SUPPORTED_LANGUAGES:
        return lang_code
    return LANGUAGE_FALLBACKS.get(lang_code, "en")


def is_libretranslate_available() -> bool:
    """Check if LibreTranslate service is available."""
    try:
        response = requests.get(f"{LIBRETRANSLATE_URL}/languages", timeout=5)
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"LibreTranslate not available: {e}")
        return False


def translate_text(text: str, target_lang: str, source_lang: str = "en") -> str:
    """
    Translation service with LibreTranslate integration.

    For supported languages, uses LibreTranslate API.
    For unsupported languages, falls back to Hindi or returns original text.
    Frontend handles UI translations using i18next (static translations).

    This service is primarily for dynamic content translation (user messages, etc.).
    """
    if not text or not text.strip():
        return text

    # Get effective languages (with fallbacks)
    effective_source = get_effective_language(source_lang)
    effective_target = get_effective_language(target_lang)

    # If same language, return original
    if effective_source == effective_target:
        return text

    logger.info(
        f"Translation requested: {source_lang} -> {target_lang} (effective: {effective_source} -> {effective_target})"
    )

    # Try LibreTranslate if available
    if is_libretranslate_available():
        try:
            response = requests.post(
                f"{LIBRETRANSLATE_URL}/translate",
                json={
                    "q": text,
                    "source": effective_source,
                    "target": effective_target,
                    "format": "text",
                },
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()
                translated_text = result.get("translatedText", text)

                # Log fallback usage
                if target_lang != effective_target:
                    logger.info(
                        f"Used fallback language {effective_target} for {target_lang}"
                    )

                return translated_text
            else:
                logger.error(
                    f"LibreTranslate API error: {response.status_code} - {response.text}"
                )

        except Exception as e:
            logger.error(f"LibreTranslate translation error: {e}")

    # Fallback: return original text
    logger.info("Translation service unavailable - returning original text")
    return text


def get_supported_languages() -> dict:
    """Get list of supported languages with fallback information."""
    return {
        "supported": list(SUPPORTED_LANGUAGES.keys()),
        "fallbacks": LANGUAGE_FALLBACKS,
        "service_available": is_libretranslate_available(),
    }
