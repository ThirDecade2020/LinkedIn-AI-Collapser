from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json

app = FastAPI()

# Enable CORS so your extension can make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, you can restrict to your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(request: TextRequest):
    """
    Calls local Qwen 2.5 model via Ollama CLI to get AI likelihood.
    Returns JSON: {"ai_percent": <int>}
    """
    user_text = request.text

    try:
        # Run Ollama CLI and capture output
        result = subprocess.run(
            ["ollama", "run", "qwen2.5-coder", user_text],
            capture_output=True,
            text=True,
            check=True,
        )

        output = result.stdout.strip()
        # Simple heuristic: if Qwen outputs anything, treat it as AI content
        # For more advanced scoring, you can parse the response or use your own metric
        ai_percent = 95 if output else 0

        return {"ai_percent": ai_percent}

    except subprocess.CalledProcessError as e:
        print("Error calling Qwen:", e)
        return {"ai_percent": 0}

