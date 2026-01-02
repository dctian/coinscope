"""
CoinScope API - Coin Identification Service

A FastAPI backend that uses Vision Language Models (via LiteLLM) to identify
coins from photos and return detailed information about each coin.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import coins_router

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print(f"🪙 CoinScope API starting...")
    print(f"📡 VLM Model: {os.getenv('VLM_MODEL', 'gpt-4-vision-preview')}")
    yield
    # Shutdown
    print("👋 CoinScope API shutting down...")


# Create FastAPI app
app = FastAPI(
    title="CoinScope API",
    description="Identify coins from photos using AI Vision Language Models",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Flutter web and mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(coins_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "CoinScope API",
        "version": "1.0.0",
        "description": "Identify coins from photos using AI",
        "docs": "/docs",
        "health": "/api/v1/coins/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug
    )

