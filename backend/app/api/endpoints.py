from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.schemas import UploadDocumentResponse, EvaluateResponse, ParseTextRequest
from app.services.parser import extract_text_from_file, split_into_segments
from app.services.stt import transcribe_audio
from app.services.diff import compute_diff

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """서버 상태 확인용 헬스체크 엔드포인트"""
    return {"status": "ok", "service": "script-memorizer-backend"}

@router.post("/parse-text", response_model=UploadDocumentResponse)
async def parse_text(payload: ParseTextRequest):
    """
    텍스트를 직접 전송받아 문단 > 문장 계층 구조로 분할하여 반환합니다.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="대본 텍스트 내용이 비어 있습니다.")

    segments = split_into_segments(payload.text)
    if not segments:
        raise HTTPException(status_code=400, detail="유효한 문장을 찾을 수 없습니다.")

    title = payload.title.strip() if payload.title and payload.title.strip() else "직접 입력한 대본"
    return UploadDocumentResponse(
        filename=title,
        total_segments=len(segments),
        segments=segments
    )

@router.post("/upload-document", response_model=UploadDocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    대본 문서(.pdf, .docx, .txt, .md)를 업로드 받아 텍스트를 추출하고
    문단 > 문장 계층 구조로 분할하여 반환합니다.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 올바르지 않습니다.")

    # 지원 확장자 검증 (.md, .markdown 추가)
    allowed_extensions = {"pdf", "docx", "doc", "txt", "md", "markdown"}
    ext = file.filename.lower().split(".")[-1]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다 (.{ext}). pdf, docx, txt, md 파일만 업로드할 수 있습니다."
        )

    try:
        content_bytes = await file.read()
        extracted_text = extract_text_from_file(file.filename, content_bytes)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="파일에서 텍스트를 추출할 수 없거나 내용이 비어 있습니다.")

        segments = split_into_segments(extracted_text)
        return UploadDocumentResponse(
            filename=file.filename,
            total_segments=len(segments),
            segments=segments
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"문서 처리 중 오류가 발생했습니다: {str(e)}")

@router.post("/evaluate-audio", response_model=EvaluateResponse)
async def evaluate_audio(
    audio: UploadFile = File(..., description="녹음된 오디오 파일 (.webm, .wav 등)"),
    original_text: str = Form(..., description="사용자가 암기하고자 한 원본 텍스트"),
    live_transcribed_text: Optional[str] = Form(None, description="브라우저 실시간 Web Speech STT 전사 텍스트")
):
    """
    사용자가 녹음한 음성 파일을 STT 변환하고, 원본 텍스트와 비교(Diff)하여
    누락되거나 잘못 말한 부분의 시각화 피드백 및 정확도 점수를 반환합니다.
    """
    if not original_text.strip():
        raise HTTPException(status_code=400, detail="평가할 원본 텍스트가 전달되지 않았습니다.")

    try:
        audio_bytes = await audio.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="오디오 파일 데이터가 비어 있습니다.")

        # 1. STT 변환 (Whisper API 또는 실시간 Web Speech STT 활용)
        transcribed_text = transcribe_audio(
            audio_bytes=audio_bytes,
            filename=audio.filename or "recording.webm",
            original_text=original_text,
            live_transcribed_text=live_transcribed_text
        )

        # 2. 순수 음절 단위 Diff 비교 및 정확도 산출
        diff_chunks, accuracy = compute_diff(
            original_text=original_text.strip(),
            transcribed_text=transcribed_text.strip()
        )

        return EvaluateResponse(
            original_text=original_text.strip(),
            transcribed_text=transcribed_text.strip(),
            accuracy=accuracy,
            diffs=diff_chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"음성 평가 처리 중 오류가 발생했습니다: {str(e)}")
