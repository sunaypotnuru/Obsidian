# 🔌 MCP Integration Complete Guide for Netra AI

**Model Context Protocol (MCP) Integration**  
**For Prompt Opinion Hackathon**  
**Date**: April 2026

---

## 📋 Table of Contents

1. [MCP Pricing & Plans](#1-mcp-pricing--plans)
2. [Your Current API Response Formats](#2-your-current-api-response-formats)
3. [Your Database Schema](#3-your-database-schema)
4. [Deployment Options](#4-deployment-options)
5. [Authentication Setup](#5-authentication-setup)
6. [Frontend Integration](#6-frontend-integration)
7. [Hackathon Requirements](#7-hackathon-requirements)
8. [Your Current Setup](#8-your-current-setup)
9. [Complete MCP Server Code](#9-complete-mcp-server-code)
10. [Testing & Deployment](#10-testing--deployment)
11. [Quick Response Template](#11-quick-response-template)

---

## 1. MCP Pricing & Plans

### 🎉 Great News: MCP is 100% FREE!

**Model Context Protocol (MCP) is an open-source standard** - there are NO paid plans or upgrades!

### Key Facts About MCP

**Created by**: Anthropic (November 2024)  
**License**: Open Source (MIT License)  
**Cost**: **$0 - Completely FREE**  
**Governance**: Linux Foundation's Agentic AI Foundation (as of December 2025)

### What "Open Source" Means for You

✅ **No subscription fees** - Use forever, no limits  
✅ **No API costs** - Protocol is free to implement  
✅ **No usage limits** - Unlimited requests, unlimited servers  
✅ **No enterprise pricing** - Same for everyone  
✅ **Community-driven** - Backed by Anthropic, OpenAI, Google, Microsoft, AWS

### MCP Adoption (2026 Stats)

According to recent industry reports:
- **97 million+** monthly SDK downloads
- **2,300+** public MCP servers available
- **10,000+** total MCP servers deployed
- **80%** of Fortune 500 companies using MCP
- **200+** tools support MCP natively (Claude, Cursor, VS Code, etc.)

### What You Pay For (Not MCP Itself)

While MCP is free, you may pay for:

1. **Hosting Your MCP Server**:
   - ngrok: Free tier (perfect for hackathons)
   - Render.com: Free tier available
   - Fly.io: Free tier available
   - Your own VPS: Variable cost

2. **AI Models** (if using external APIs):
   - Claude API: Pay per token
   - OpenAI API: Pay per token
   - **Your case**: You're using local models (FREE!)

3. **Infrastructure**:
   - Supabase: Free tier (50,000 rows)
   - Docker: Free
   - Your services: Running locally (FREE!)

### Why MCP is Free

**MCP is a protocol, not a service**. Think of it like:
- **HTTP** - Free protocol for web communication
- **USB-C** - Free standard for device connections
- **MCP** - Free standard for AI-to-tool connections

**Analogy**: MCP is like USB-C for AI. You don't pay for the USB-C standard, you just use it!

### No Upgrade Path Needed

**There are no "MCP plans" to upgrade to** because:
- ✅ Protocol is open and free
- ✅ No premium features
- ✅ No rate limits from MCP itself
- ✅ No enterprise vs. free tiers

**What you CAN upgrade**:
- Your hosting (ngrok free → ngrok pro)
- Your AI models (local → cloud APIs)
- Your infrastructure (free tier → paid tier)

### For Your Hackathon

**Perfect setup (all FREE)**:
- ✅ MCP Protocol: FREE
- ✅ Your AI models: Local (FREE)
- ✅ ngrok: Free tier (sufficient)
- ✅ Docker: FREE
- ✅ Supabase: Free tier (sufficient)

**Total cost**: **$0** 🎉

### Future of MCP

**Governed by Linux Foundation** (like Linux, Kubernetes, Node.js):
- Will remain open source
- Community-driven development
- No vendor lock-in
- Industry-wide adoption

### Resources

- **Official Docs**: https://docs.anthropic.com/en/docs/agents-and-tools/mcp
- **GitHub**: https://github.com/modelcontextprotocol
- **Announcement**: https://www.anthropic.com/news/model-context-protocol
- **Spec**: Open standard, publicly available

---

## 2. Your Current API Response Formats

### ✅ Cataract Service (Port 8005)

**Endpoint**: `POST /predict-with-xai`

**Response Format**:
```json
{
  "status": "Early" | "Normal",
  "confidence": 0.94,
  "cataract_probability": 0.94,
  "prediction": "CATARACT DETECTED" | "NO CATARACT",
  "threshold": 0.5,
  "processing_time_ms": 1234.56,
  "xai_processing_time_ms": 567.89,
  "model_info": {
    "architecture": "Swin-Base Transformer",
    "expected_performance": {
      "sensitivity": 0.96,
      "specificity": 0.902
    }
  },
  "quality_check": {
    "is_valid": true,
    "size": [512, 512],
    "mean_intensity": 123.45,
    "std_intensity": 45.67
  },
  "heatmap_base64": "data:image/png;base64,...",
  "attention_regions": [
    {
      "region_id": 1,
      "location": "center",
      "intensity": 0.85,
      "description": "High attention area"
    }
  ],
  "xai_metadata": {
    "method": "Grad-CAM",
    "target_layer": "swin.layers.3"
  },
  "xai_enabled": true
}
```

---

### ✅ Diabetic Retinopathy Service (Port 8002)

**Endpoint**: `POST /predict-with-xai`

**Response Format**:
```json
{
  "grade": 2,
  "grade_name": "Moderate NPDR",
  "description": "Moderate non-proliferative diabetic retinopathy",
  "confidence": 0.87,
  "referable": true,
  "recommendation": "Refer to ophthalmologist within 1 month",
  "probabilities": {
    "No DR": 0.05,
    "Mild NPDR": 0.08,
    "Moderate NPDR": 0.87,
    "Severe NPDR": 0.00,
    "Proliferative DR": 0.00
  },
  "xai_enabled": true,
  "heatmap_base64": "data:image/png;base64,...",
  "attention_regions": [
    {
      "region_id": 1,
      "location": "macula",
      "intensity": 0.92,
      "description": "Microaneurysms detected"
    }
  ],
  "xai_metadata": {
    "method": "Grad-CAM",
    "target_layer": "efficientnet_b5.blocks.6"
  },
  "xai_processing_time_ms": 456.78
}
```

---

### ✅ Anemia Service (Port 8001)

**Endpoint**: `POST /predict`

**Response Format**:
```json
{
  "success": true,
  "prediction": "anemic" | "normal",
  "is_anemic": true,
  "probability": 0.85,
  "confidence": 0.85,
  "severity": "moderate",
  "hemoglobin_level": 10.5,
  "recommendation": "Please consult a doctor for a definitive diagnosis."
}
```

---

### ✅ Mental Health Service (Port 8003)

**Endpoint**: `POST /analyze`

**Response Format**:
```json
{
  "transcription": "I've been feeling really down lately...",
  "transcription_confidence": 0.95,
  "depression_score": 0.75,
  "anxiety_score": 0.68,
  "stress_score": 0.72,
  "confidence": 0.88,
  "crisis_detected": false,
  "risk_level": "moderate",
  "risk_score": 65,
  "coping_strategy": "Consider mindfulness exercises and talking to a counselor",
  "crisis_message": null,
  "hotlines": null,
  "immediate_steps": null,
  "facial_emotions": {
    "sad": 0.65,
    "neutral": 0.20,
    "happy": 0.10,
    "angry": 0.05
  },
  "dominant_emotion": "sad",
  "timestamp": "2026-04-15T10:30:00Z",
  "processing_time_seconds": 3.45
}
```

---

## 3. Your Database Schema

### ✅ Supabase Tables

**Table Name**: `scans` (unified table for all scan types)

**Columns**:
```sql
CREATE TABLE public.scans (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,  -- References auth.users(id)
    appointment_id UUID,       -- Optional
    image_url TEXT NOT NULL,
    prediction TEXT,           -- "CATARACT DETECTED", "Moderate NPDR", "anemic", etc.
    confidence FLOAT,          -- 0.0 to 1.0
    hemoglobin_estimate FLOAT, -- For anemia scans
    diagnosis TEXT,            -- Detailed diagnosis
    severity TEXT,             -- 'normal', 'mild', 'moderate', 'severe'
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Table Name**: `mental_health_screenings`

**Columns**:
```sql
CREATE TABLE public.mental_health_screenings (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    screening_type TEXT NOT NULL,  -- "voice_analysis", "questionnaire", etc.
    score INTEGER,                 -- 0-100
    severity TEXT,                 -- "low", "moderate", "high"
    responses JSONB,               -- Full analysis results
    recommendations TEXT,
    created_at TIMESTAMPTZ
);
```

**Row Level Security (RLS)**: ✅ Enabled  
- Patients can only see their own records
- Doctors can see their patients' records
- Admins can see all records

---

## 4. Deployment Options

### Option A: ngrok (Recommended for Hackathon) ⭐

**Pros**:
- ✅ Fastest setup (5 minutes)
- ✅ No deployment needed
- ✅ Works with your existing Docker setup
- ✅ Perfect for demos

**Cons**:
- ⚠️ Temporary URL (changes on restart)
- ⚠️ 2-hour session limit (free tier)

**Setup**:
```bash
# Already installed at C:\ngrok\ngrok.exe
# Start MCP server on port 8006
C:\ngrok\ngrok.exe http 8006
```

---

### Option B: Render.com (Free Tier)

**Pros**:
- ✅ Permanent URL
- ✅ Free tier available
- ✅ Auto-deploy from GitHub

**Cons**:
- ⚠️ Requires GitHub push
- ⚠️ Takes 5-10 minutes to deploy
- ⚠️ Spins down after inactivity (cold starts)

**Setup**:
1. Push MCP server code to GitHub
2. Connect Render to your repo
3. Deploy as Web Service

---

### Option C: Fly.io (Free Tier)

**Pros**:
- ✅ Fast deployment
- ✅ Good free tier
- ✅ Global CDN

**Cons**:
- ⚠️ Requires Fly CLI installation
- ⚠️ Credit card required (not charged)

---

### 🎯 Recommendation for Hackathon

**Use ngrok** for the fastest setup. You can deploy to Render/Fly later if needed.

---

## 5. Authentication Setup

### For Hackathon Demo

**Recommendation**: **No authentication** (open access)

**Why**:
- ✅ Easier for judges to test
- ✅ Faster development
- ✅ No auth complexity
- ✅ Demo credentials already exist

**For Production** (post-hackathon):
- Use API Key authentication
- Add Bearer token support
- Integrate with Supabase auth

---

## 6. Frontend Integration

### Current Setup

**Your frontend uses**:
- Direct `fetch`/`axios` calls to each service
- Unified API gateway at port 8000 (backend)
- Image upload to Supabase storage first

**Example** (from your code):
```typescript
// Current approach
const response = await fetch('http://localhost:8005/predict-with-xai', {
  method: 'POST',
  body: formData
});
```

### MCP Client Integration (Optional)

**If you want to add MCP client** (more impressive for hackathon):

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Initialize MCP client
const transport = new StdioClientTransport({
  command: "node",
  args: ["path/to/mcp-server.js"]
});

const client = new Client({
  name: "netra-ai-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// Use MCP resources
const result = await client.callTool({
  name: "analyze_cataract",
  arguments: {
    image_url: "https://...",
    patient_id: "uuid"
  }
});
```

**Recommendation**: **Keep existing HTTP calls** for hackathon (simpler, less changes). Add MCP client later if time permits.

---

## 7. Hackathon Requirements

### SHARP Extension Specs

**Question**: Does Prompt Opinion require SHARP/FHIR integration?

**Answer**: Check the hackathon documentation. If required:

**SHARP (Secure Healthcare AI Resource Protocol)**:
- Pass `patient_id` in MCP context
- Handle FHIR tokens for EHR integration
- Implement healthcare-specific security

**FHIR (Fast Healthcare Interoperability Resources)**:
- Standard for healthcare data exchange
- Required for EHR integration
- Not needed for standalone demo

**For Hackathon Demo**:
- ✅ Pass `patient_id` in requests (already doing this)
- ⚠️ FHIR integration only if explicitly required
- ✅ Focus on working demo first

---

### Submission Deadline

**Important**: Affects deployment choice

- **< 2 days**: Use ngrok (fastest)
- **2-5 days**: Deploy to Render/Fly (more robust)
- **> 5 days**: Full production setup

---

### Test Images

**You need sample images for demo**:

**Cataract**: `C:\Netra Ai Training Data\AI-Models\2-Cataract-Detection\02_DATASETS\archive\ODIR-5K\ODIR-5K\Testing Images\988_left.jpg`

**DR**: Same eye images work

**Anemia**: Any conjunctiva/eye image

**Mental Health**: Sample audio recording

---

## 8. Your Current Setup

### ✅ Docker Compose

**Status**: Fully functional  
**Services**: 7 containers running  
**Ports**: 3000 (frontend), 8000 (backend), 8001-8005 (AI services)

### ✅ Python Version

**Check your version**:
```powershell
python --version
```

**MCP SDK requires**: Python 3.10+

### ✅ Operating System

**Your system**: Windows  
**Shell**: bash  
**Docker**: Running

### ✅ ngrok

**Status**: Installed at `C:\ngrok\ngrok.exe`  
**Authenticated**: Yes  
**Ready to use**: Yes

---

## 9. Complete MCP Server Code

### File: `mcp_server.py`

```python
"""
Netra AI - MCP Server
Model Context Protocol server for healthcare AI services
"""

import asyncio
import httpx
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp import types
import base64
from typing import Any
import os

# Service URLs (update these based on deployment)
CATARACT_SERVICE = os.getenv("CATARACT_SERVICE_URL", "http://localhost:8005")
DR_SERVICE = os.getenv("DR_SERVICE_URL", "http://localhost:8002")
ANEMIA_SERVICE = os.getenv("ANEMIA_SERVICE_URL", "http://localhost:8001")
MENTAL_HEALTH_SERVICE = os.getenv("MENTAL_HEALTH_SERVICE_URL", "http://localhost:8003")

# Initialize MCP server
server = Server("netra-ai-mcp")

@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    """
    List available healthcare AI resources
    """
    return [
        types.Resource(
            uri="netra://cataract/analyze",
            name="Cataract Analysis",
            description="Analyze fundus images for cataract detection with XAI",
            mimeType="application/json",
        ),
        types.Resource(
            uri="netra://dr/analyze",
            name="Diabetic Retinopathy Analysis",
            description="Analyze retinal images for DR grading (0-4) with XAI",
            mimeType="application/json",
        ),
        types.Resource(
            uri="netra://anemia/analyze",
            name="Anemia Detection",
            description="Analyze conjunctiva images for anemia screening",
            mimeType="application/json",
        ),
        types.Resource(
            uri="netra://mental-health/analyze",
            name="Mental Health Voice Analysis",
            description="Analyze voice recordings for mental health screening",
            mimeType="application/json",
        ),
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """
    Read resource documentation
    """
    docs = {
        "netra://cataract/analyze": """
# Cataract Analysis Resource

Analyzes fundus images for cataract detection using Swin-Base Transformer.

## Performance
- Sensitivity: 96%
- Specificity: 90.2%
- Accuracy: 90.8%

## Input
- image_url: URL to fundus image (JPG/PNG)
- patient_id: Patient UUID (optional)

## Output
- status: "Early" or "Normal"
- confidence: 0.0 to 1.0
- heatmap_base64: XAI visualization
- attention_regions: Areas of interest

## Example
```json
{
  "image_url": "https://storage.supabase.co/...",
  "patient_id": "uuid"
}
```
        """,
        "netra://dr/analyze": """
# Diabetic Retinopathy Analysis Resource

Analyzes retinal images for DR grading using EfficientNet-B5.

## Grades
- 0: No DR
- 1: Mild NPDR
- 2: Moderate NPDR (referable)
- 3: Severe NPDR (referable)
- 4: Proliferative DR (urgent)

## Input
- image_url: URL to retinal image
- patient_id: Patient UUID (optional)

## Output
- grade: 0-4
- grade_name: Human-readable name
- referable: Boolean
- recommendation: Clinical action
- heatmap_base64: XAI visualization

## Example
```json
{
  "image_url": "https://storage.supabase.co/...",
  "patient_id": "uuid"
}
```
        """,
        "netra://anemia/analyze": """
# Anemia Detection Resource

Analyzes conjunctiva images for anemia screening.

## Input
- image_url: URL to conjunctiva/eye image
- patient_id: Patient UUID (optional)

## Output
- is_anemic: Boolean
- severity: "normal", "mild", "moderate", "severe"
- hemoglobin_level: Estimated Hb (g/dL)
- recommendation: Clinical advice

## Example
```json
{
  "image_url": "https://storage.supabase.co/...",
  "patient_id": "uuid"
}
```
        """,
        "netra://mental-health/analyze": """
# Mental Health Voice Analysis Resource

Analyzes voice recordings for mental health screening.

## Features
- Speech-to-text (Whisper)
- Mental health analysis (MentalBERT)
- Acoustic feature extraction
- Crisis detection

## Input
- audio_url: URL to audio file (WebM/MP3/WAV)
- patient_id: Patient UUID (optional)

## Output
- depression_score: 0.0 to 1.0
- anxiety_score: 0.0 to 1.0
- stress_score: 0.0 to 1.0
- crisis_detected: Boolean
- risk_level: "low", "moderate", "high", "critical"
- coping_strategy: Recommendations

## Example
```json
{
  "audio_url": "https://storage.supabase.co/...",
  "patient_id": "uuid"
}
```
        """
    }
    
    return docs.get(uri, "Resource not found")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List available AI analysis tools
    """
    return [
        types.Tool(
            name="analyze_cataract",
            description="Analyze fundus image for cataract detection with XAI heatmap",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_url": {
                        "type": "string",
                        "description": "URL to fundus image (JPG/PNG, max 10MB)"
                    },
                    "patient_id": {
                        "type": "string",
                        "description": "Patient UUID (optional)"
                    }
                },
                "required": ["image_url"]
            },
        ),
        types.Tool(
            name="analyze_dr",
            description="Analyze retinal image for diabetic retinopathy grading (0-4) with XAI",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_url": {
                        "type": "string",
                        "description": "URL to retinal fundus image"
                    },
                    "patient_id": {
                        "type": "string",
                        "description": "Patient UUID (optional)"
                    }
                },
                "required": ["image_url"]
            },
        ),
        types.Tool(
            name="analyze_anemia",
            description="Analyze conjunctiva image for anemia screening",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_url": {
                        "type": "string",
                        "description": "URL to conjunctiva/eye image"
                    },
                    "patient_id": {
                        "type": "string",
                        "description": "Patient UUID (optional)"
                    }
                },
                "required": ["image_url"]
            },
        ),
        types.Tool(
            name="analyze_mental_health",
            description="Analyze voice recording for mental health screening",
            inputSchema={
                "type": "object",
                "properties": {
                    "audio_url": {
                        "type": "string",
                        "description": "URL to audio file (WebM/MP3/WAV)"
                    },
                    "patient_id": {
                        "type": "string",
                        "description": "Patient UUID (optional)"
                    }
                },
                "required": ["audio_url"]
            },
        ),
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict[str, Any] | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Execute AI analysis tools
    """
    if not arguments:
        raise ValueError("Missing arguments")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        if name == "analyze_cataract":
            # Download image
            image_url = arguments["image_url"]
            image_response = await client.get(image_url)
            image_response.raise_for_status()
            
            # Send to cataract service
            files = {"file": ("image.jpg", image_response.content, "image/jpeg")}
            response = await client.post(
                f"{CATARACT_SERVICE}/predict-with-xai",
                files=files
            )
            response.raise_for_status()
            result = response.json()
            
            return [
                types.TextContent(
                    type="text",
                    text=f"""Cataract Analysis Results:
                    
Status: {result['status']}
Confidence: {result['confidence']:.2%}
Prediction: {result['prediction']}
Processing Time: {result['processing_time_ms']:.0f}ms

Quality Check:
- Image Size: {result['quality_check']['size']}
- Valid: {result['quality_check']['is_valid']}

XAI Analysis:
- Attention Regions: {len(result.get('attention_regions', []))}
- Method: {result.get('xai_metadata', {}).get('method', 'N/A')}

Recommendation: {'Refer to ophthalmologist' if result['status'] == 'Early' else 'Continue regular screening'}
"""
                ),
                types.ImageContent(
                    type="image",
                    data=result.get('heatmap_base64', '').split(',')[1] if result.get('heatmap_base64') else '',
                    mimeType="image/png"
                )
            ]
        
        elif name == "analyze_dr":
            # Download image
            image_url = arguments["image_url"]
            image_response = await client.get(image_url)
            image_response.raise_for_status()
            
            # Send to DR service
            files = {"file": ("image.jpg", image_response.content, "image/jpeg")}
            response = await client.post(
                f"{DR_SERVICE}/predict-with-xai",
                files=files
            )
            response.raise_for_status()
            result = response.json()
            
            return [
                types.TextContent(
                    type="text",
                    text=f"""Diabetic Retinopathy Analysis Results:

Grade: {result['grade']} - {result['grade_name']}
Description: {result['description']}
Confidence: {result['confidence']:.2%}
Referable: {'Yes' if result['referable'] else 'No'}

Recommendation: {result['recommendation']}

Grade Probabilities:
{chr(10).join(f"  {k}: {v:.2%}" for k, v in result['probabilities'].items())}

XAI Analysis:
- Attention Regions: {len(result.get('attention_regions', []))}
- Method: {result.get('xai_metadata', {}).get('method', 'N/A')}
"""
                ),
                types.ImageContent(
                    type="image",
                    data=result.get('heatmap_base64', '').split(',')[1] if result.get('heatmap_base64') else '',
                    mimeType="image/png"
                )
            ]
        
        elif name == "analyze_anemia":
            # Send image URL to anemia service
            response = await client.post(
                f"{ANEMIA_SERVICE}/predict",
                json={"image_url": arguments["image_url"]}
            )
            response.raise_for_status()
            result = response.json()
            
            return [
                types.TextContent(
                    type="text",
                    text=f"""Anemia Screening Results:

Prediction: {result['prediction'].upper()}
Anemic: {'Yes' if result['is_anemic'] else 'No'}
Confidence: {result['confidence']:.2%}
Severity: {result.get('severity', 'N/A')}
Hemoglobin Level: {result.get('hemoglobin_level', 'N/A')} g/dL

Recommendation: {result['recommendation']}
"""
                )
            ]
        
        elif name == "analyze_mental_health":
            # Download audio
            audio_url = arguments["audio_url"]
            audio_response = await client.get(audio_url)
            audio_response.raise_for_status()
            
            # Send to mental health service
            files = {"file": ("audio.webm", audio_response.content, "audio/webm")}
            response = await client.post(
                f"{MENTAL_HEALTH_SERVICE}/analyze",
                files=files
            )
            response.raise_for_status()
            result = response.json()
            
            crisis_info = ""
            if result['crisis_detected']:
                crisis_info = f"""
⚠️ CRISIS DETECTED ⚠️
Risk Level: {result['risk_level'].upper()}
Risk Score: {result['risk_score']}/100

{result.get('crisis_message', '')}

Immediate Steps:
{chr(10).join(f"  - {step}" for step in result.get('immediate_steps', []))}

Hotlines:
{chr(10).join(f"  - {hotline}" for hotline in result.get('hotlines', []))}
"""
            
            return [
                types.TextContent(
                    type="text",
                    text=f"""Mental Health Voice Analysis Results:

Transcription: "{result['transcription'][:200]}..."
Transcription Confidence: {result['transcription_confidence']:.2%}

Mental Health Scores:
- Depression: {result['depression_score']:.2%}
- Anxiety: {result['anxiety_score']:.2%}
- Stress: {result['stress_score']:.2%}
Overall Confidence: {result['confidence']:.2%}

{crisis_info}

Coping Strategy:
{result['coping_strategy']}

Processing Time: {result['processing_time_seconds']:.2f}s
"""
                )
            ]
        
        else:
            raise ValueError(f"Unknown tool: {name}")

async def main():
    """
    Main entry point for MCP server
    """
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="netra-ai-mcp",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 10. Testing & Deployment

### Local Testing

**1. Install MCP SDK**:
```powershell
pip install mcp httpx
```

**2. Test MCP Server**:
```powershell
python mcp_server.py
```

**3. Test with MCP Inspector**:
```powershell
npx @modelcontextprotocol/inspector python mcp_server.py
```

### Deploy with ngrok

**1. Start MCP Server**:
```powershell
# In terminal 1
python mcp_server.py
```

**2. Expose with ngrok**:
```powershell
# In terminal 2
C:\ngrok\ngrok.exe http 8006
```

**3. Share URL**:
```
https://your-url.ngrok-free.app
```

---

## 11. Quick Response Template

### Fill This Out

```markdown
## Question 1: API Responses
✅ All response formats documented above

## Question 2: Database Schema
✅ Table: `scans` (unified for all scan types)
✅ Table: `mental_health_screenings`
✅ RLS: Enabled

## Question 3: Deployment
- Platform: ngrok (for hackathon demo)
- Microservices: Same machine (Docker)

## Question 4: Authentication
- MCP server auth: none (open for demo)

## Question 5: Frontend
- Modify React: No (keep existing HTTP calls)
- Current API calls: Direct fetch to services

## Question 6: Hackathon
- SHARP/FHIR needed: Check hackathon docs
- Deadline: [YOUR DEADLINE]
- Test images available: Yes

## Question 7: Setup
- Docker working: Yes (all 7 containers running)
- Python version: [Check with: python --version]
- OS: Windows
- ngrok installed: Yes (C:\ngrok\ngrok.exe)
```

---

## 🎯 Next Steps

1. **Check Python version**: `python --version` (need 3.10+)
2. **Install MCP SDK**: `pip install mcp httpx`
3. **Save mcp_server.py** to `Netra-Ai/services/mcp/`
4. **Test locally**: `python mcp_server.py`
5. **Deploy with ngrok** (if needed for remote access)
6. **Test with sample images**
7. **Record demo video**

---

**Questions? Fill out the Quick Response Template above and I'll provide customized code!** 🚀
