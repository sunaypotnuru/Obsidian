"""
Mental Health Chatbot - Industrial Level (FREE)
Uses Ollama (FREE, local LLM) for conversational AI
Based on Llama 3.2 or Mistral models
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from datetime import datetime
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mental Health Chatbot API",
    description="FREE conversational AI for mental health support using Ollama",
    version="1.0.0"
)

# Configure CORS - use environment variable for production
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8080"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Environment-based for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS configured for origins: {allowed_origins}")

# Ollama configuration (FREE, runs locally)
OLLAMA_URL = "http://localhost:11434"  # Default Ollama port
DEFAULT_MODEL = "llama3.2:3b"  # Fast, 3B parameter model (or use "mistral:7b")

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = DEFAULT_MODEL
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 500

class ChatResponse(BaseModel):
    response: str
    model: str
    timestamp: str
    tokens_used: Optional[int] = None

# System prompt for mental health support
MENTAL_HEALTH_SYSTEM_PROMPT = """You are a compassionate mental health support assistant. Your role is to:

1. Listen empathetically to users' concerns
2. Provide emotional support and validation
3. Suggest evidence-based coping strategies
4. Recognize crisis situations and provide appropriate resources
5. Encourage professional help when needed

IMPORTANT GUIDELINES:
- You are NOT a replacement for professional therapy
- Always encourage users to seek professional help for serious concerns
- If you detect crisis keywords (suicide, self-harm), immediately provide crisis hotlines
- Be warm, non-judgmental, and supportive
- Use simple, clear language
- Provide actionable advice

CRISIS HOTLINES (always mention if crisis detected):
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- SAMHSA National Helpline: 1-800-662-4357

Remember: You're here to support, not diagnose or treat."""

async def check_ollama_available():
    """Check if Ollama is running"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
            return response.status_code == 200
    except (httpx.TimeoutException, httpx.ConnectError, Exception):
        return False

async def chat_with_ollama(messages: List[Message], model: str, temperature: float, max_tokens: int):
    """
    Chat with Ollama (FREE local LLM)
    
    Ollama supports:
    - llama3.2:3b (fast, 3B params)
    - llama3.2:1b (very fast, 1B params)
    - mistral:7b (good quality, 7B params)
    - phi3:mini (fast, 3.8B params)
    """
    try:
        # Prepare messages with system prompt
        formatted_messages = [
            {"role": "system", "content": MENTAL_HEALTH_SYSTEM_PROMPT}
        ]
        
        for msg in messages:
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Call Ollama API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": model,
                    "messages": formatted_messages,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    }
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Ollama API error")
            
            result = response.json()
            return result.get("message", {}).get("content", "")
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama request timeout")
    except Exception as e:
        logger.error(f"Ollama error: {e}")
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")

def detect_crisis_in_response(user_message: str, ai_response: str) -> dict:
    """
    Detect if crisis intervention is needed
    Returns crisis info if detected
    """
    crisis_keywords = [
        'kill myself', 'suicide', 'end my life', 'want to die',
        'self-harm', 'cut myself', 'hurt myself', 'no reason to live',
        'hopeless', 'can\'t go on', 'better off dead'
    ]
    
    text_lower = user_message.lower()
    
    for keyword in crisis_keywords:
        if keyword in text_lower:
            return {
                'crisis_detected': True,
                'message': 'I\'m very concerned about what you\'re sharing. Please reach out for immediate help.',
                'hotlines': [
                    {
                        'name': 'National Suicide Prevention Lifeline',
                        'number': '988',
                        'description': '24/7 free and confidential support'
                    },
                    {
                        'name': 'Crisis Text Line',
                        'number': 'Text HOME to 741741',
                        'description': '24/7 text support'
                    }
                ]
            }
    
    return {'crisis_detected': False}

@app.get("/")
async def root():
    """Root endpoint"""
    ollama_available = await check_ollama_available()
    
    return {
        "service": "Mental Health Chatbot API",
        "version": "1.0.0",
        "status": "running",
        "ollama_available": ollama_available,
        "ollama_url": OLLAMA_URL,
        "default_model": DEFAULT_MODEL,
        "features": [
            "Conversational AI (Ollama)",
            "Crisis detection",
            "Empathetic responses",
            "Coping strategies",
            "Resource recommendations"
        ],
        "cost": "FREE - Runs locally with Ollama"
    }

@app.get("/health")
async def health():
    """Health check"""
    ollama_available = await check_ollama_available()
    
    return {
        "status": "ok" if ollama_available else "degraded",
        "ollama_available": ollama_available,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/models")
async def list_models():
    """List available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "models": data.get("models", []),
                    "recommended": [
                        "llama3.2:3b - Fast, good quality",
                        "llama3.2:1b - Very fast, smaller",
                        "mistral:7b - Best quality, slower",
                        "phi3:mini - Fast, efficient"
                    ]
                }
            else:
                raise HTTPException(status_code=500, detail="Could not fetch models")
    except (httpx.RequestError, httpx.HTTPStatusError, Exception):
        raise HTTPException(status_code=503, detail="Ollama not available")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for mental health support
    
    Uses Ollama (FREE local LLM) for responses
    """
    try:
        # Check if Ollama is available
        if not await check_ollama_available():
            raise HTTPException(
                status_code=503,
                detail="Ollama not available. Please install and start Ollama: https://ollama.ai"
            )
        
        # Get user's last message for crisis detection
        user_message = ""
        if request.messages:
            user_message = request.messages[-1].content
        
        # Get AI response from Ollama
        logger.info(f"Generating response with model: {request.model}")
        ai_response = await chat_with_ollama(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Detect crisis
        crisis_info = detect_crisis_in_response(user_message, ai_response)
        
        # If crisis detected, append hotlines to response
        if crisis_info['crisis_detected']:
            ai_response += "\n\n🚨 **IMMEDIATE HELP AVAILABLE:**\n"
            for hotline in crisis_info['hotlines']:
                ai_response += f"\n• **{hotline['name']}**: {hotline['number']}\n  {hotline['description']}"
        
        return ChatResponse(
            response=ai_response,
            model=request.model,
            timestamp=datetime.now().isoformat(),
            tokens_used=len(ai_response.split())  # Approximate
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/quick-support")
async def quick_support(message: str):
    """
    Quick support endpoint for simple queries
    Returns pre-defined responses for common concerns
    """
    message_lower = message.lower()
    
    # Pre-defined responses for common concerns (no LLM needed)
    responses = {
        'anxiety': {
            'response': "I hear that you're feeling anxious. Here are some quick techniques:\n\n1. **Box Breathing**: Inhale 4 seconds, hold 4, exhale 4, hold 4. Repeat 5 times.\n2. **5-4-3-2-1 Grounding**: Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.\n3. **Progressive Muscle Relaxation**: Tense and relax each muscle group.\n\nIf anxiety persists, please consider talking to a mental health professional.",
            'keywords': ['anxious', 'anxiety', 'worried', 'panic', 'nervous']
        },
        'depression': {
            'response': "I'm sorry you're feeling this way. Depression is real and treatable. Here are some steps:\n\n1. **Reach out**: Talk to someone you trust\n2. **Small steps**: Do one small thing you enjoy today\n3. **Movement**: Even a 10-minute walk can help\n4. **Professional help**: Consider therapy or counseling\n\nYou don't have to face this alone. Help is available.",
            'keywords': ['depressed', 'depression', 'sad', 'hopeless', 'empty']
        },
        'stress': {
            'response': "Stress is overwhelming, but manageable. Try these:\n\n1. **Prioritize**: List tasks, tackle one at a time\n2. **Breaks**: Take 5-minute breaks every hour\n3. **Say no**: It's okay to set boundaries\n4. **Self-care**: Sleep, nutrition, exercise\n\nIf stress is affecting your daily life, consider professional support.",
            'keywords': ['stressed', 'stress', 'overwhelmed', 'pressure', 'burnout']
        },
        'sleep': {
            'response': "Sleep issues are common. Here's what can help:\n\n1. **Routine**: Same bedtime/wake time daily\n2. **Environment**: Dark, cool, quiet room\n3. **Avoid**: Screens 1 hour before bed\n4. **Relax**: Reading, meditation, warm bath\n\nIf insomnia persists, consult a healthcare provider.",
            'keywords': ['sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep']
        }
    }
    
    # Find matching response
    for concern, data in responses.items():
        for keyword in data['keywords']:
            if keyword in message_lower:
                return {
                    'response': data['response'],
                    'concern': concern,
                    'timestamp': datetime.now().isoformat()
                }
    
    # Default response
    return {
        'response': "Thank you for reaching out. I'm here to listen. Could you tell me more about what you're experiencing?",
        'concern': 'general',
        'timestamp': datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Mental Health Chatbot API...")
    logger.info(f"Ollama URL: {OLLAMA_URL}")
    logger.info(f"Default model: {DEFAULT_MODEL}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8006,  # Note: 8004 is reserved for parkinsons-voice service
        reload=True,
        log_level="info"
    )
