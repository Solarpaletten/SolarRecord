import os
import requests
from typing import Optional

# DeepSeek API Configuration
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

def translate_text(
    text: str,
    source_lang: str = "auto",
    target_lang: str = "ru",
    use_deepseek: bool = True
) -> str:
    """
    Translate text using DeepSeek API or fallback method
    
    Args:
        text: Text to translate
        source_lang: Source language code
        target_lang: Target language code
        use_deepseek: Whether to use DeepSeek API
    
    Returns:
        Translated text
    """
    if use_deepseek and DEEPSEEK_API_KEY:
        return translate_with_deepseek(text, source_lang, target_lang)
    else:
        # Fallback: return original text with note
        return f"[Translation unavailable - DeepSeek API key not configured]\n\n{text}"

def translate_with_deepseek(
    text: str,
    source_lang: str,
    target_lang: str
) -> str:
    """
    Translate using DeepSeek API
    """
    try:
        # Language mapping
        lang_names = {
            "en": "English",
            "ru": "Russian",
            "lt": "Lithuanian",
            "de": "German",
            "fr": "French",
            "es": "Spanish",
            "uk": "Ukrainian",
            "pl": "Polish"
        }
        
        source_name = lang_names.get(source_lang, source_lang)
        target_name = lang_names.get(target_lang, target_lang)
        
        # Prepare prompt
        if source_lang == "auto":
            prompt = f"Translate the following text to {target_name}. Preserve formatting and structure:\n\n{text}"
        else:
            prompt = f"Translate from {source_name} to {target_name}. Preserve formatting and structure:\n\n{text}"
        
        # API Request
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional translator. Translate accurately while preserving the original tone and structure."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 4000
        }
        
        response = requests.post(
            DEEPSEEK_API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            translated = result["choices"][0]["message"]["content"]
            return translated.strip()
        else:
            error_msg = f"DeepSeek API error: {response.status_code}"
            print(error_msg)
            return f"[Translation failed: {error_msg}]\n\n{text}"
            
    except Exception as e:
        print(f"Translation error: {str(e)}")
        return f"[Translation error: {str(e)}]\n\n{text}"

def translate_with_local_model(
    text: str,
    source_lang: str,
    target_lang: str
) -> str:
    """
    Fallback: Simple translation using local model (if available)
    This is a placeholder for future implementation
    """
    # Could integrate Helsinki-NLP models or similar
    return f"[Local translation not implemented]\n\n{text}"

def get_available_languages() -> dict:
    """Get available translation languages"""
    return {
        "en": "English",
        "ru": "Russian",
        "lt": "Lithuanian",
        "de": "German",
        "fr": "French",
        "es": "Spanish",
        "uk": "Ukrainian",
        "pl": "Polish",
        "it": "Italian"
    }
