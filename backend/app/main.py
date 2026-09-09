from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.endpoints import router as api_router

# .env 로드
load_dotenv()

app = FastAPI(
    title="Script Memorization API",
    description="대본 암기 훈련 및 STT 음성 비교 피드백 백엔드 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 localhost:3000 및 모든 개발 환경 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Script Memorization API is running",
        "docs": "/docs"
    }
