from __future__ import annotations
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

SegmentType = Literal["chapter", "paragraph", "sentence"]
DiffType = Literal["equal", "insert", "delete"]

class ScriptSegment(BaseModel):
    id: str = Field(..., description="고유 세그먼트 ID (예: p1, p1-s1)")
    type: SegmentType = Field(..., description="세그먼트 유형 (chapter, paragraph, sentence)")
    content: str = Field(..., description="해당 세그먼트의 원본 텍스트 내용")
    children: List[ScriptSegment] = Field(default_factory=list, description="하위 세그먼트 목록")

class ParseTextRequest(BaseModel):
    text: str = Field(..., description="직접 입력한 대본/문서 텍스트")
    title: Optional[str] = Field("직접 입력한 대본", description="문서 제목")

class UploadDocumentResponse(BaseModel):
    filename: str
    total_segments: int
    segments: List[ScriptSegment]

class DiffChunk(BaseModel):
    type: DiffType = Field(..., description="비교 상태 ('equal', 'insert', 'delete')")
    text: str = Field(..., description="텍스트 조각")

class EvaluateResponse(BaseModel):
    original_text: str = Field(..., description="평가 대상 원본 텍스트")
    transcribed_text: str = Field(..., description="STT로 변환된 발화 텍스트")
    accuracy: float = Field(..., description="정확도 점수 (0.0 ~ 100.0%)")
    diffs: List[DiffChunk] = Field(..., description="Diff 결과 조각 목록")

