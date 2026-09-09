# 대본 암기 훈련 앱 (Script Memorization App) — 구현 계획

## 개요

배우/발표자가 대본을 업로드하고, 선택한 구간을 블라인드 처리 후 음성으로 암기를 테스트하면 STT + Diff 알고리즘으로 틀린 부분을 시각적으로 피드백하는 웹 애플리케이션입니다.

**기술 스택:**
- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend:** Python 3.11 + FastAPI
- **인프라:** Docker + Docker Compose

---

## 프로젝트 구조

```
script-memorizer/
├── docker-compose.yml          # 전체 스택 오케스트레이션
├── .env                        # 공통 환경변수 (OPENAI_API_KEY 등)
│
├── frontend/                   # Next.js 14 (App Router) + TypeScript + TailwindCSS
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/                # Next.js App Router (page.tsx, layout.tsx)
│   │   ├── components/
│   │   │   ├── ScriptViewer.tsx       # 대본 전체 렌더링 (챕터→문단→문장)
│   │   │   ├── ScriptSegment.tsx      # 개별 문단/문장 단위 (블라인드 토글)
│   │   │   ├── RecordButton.tsx       # 녹음 시작/종료 버튼
│   │   │   └── DiffHighlighter.tsx    # Diff 결과 색상 강조 렌더러
│   │   ├── hooks/
│   │   │   ├── useMediaRecorder.ts    # MediaRecorder 오디오 제어
│   │   │   └── useScript.ts           # 대본 상태 관리
│   │   ├── services/
│   │   │   └── api.ts                 # FastAPI 연동 (fetch wrapper)
│   │   ├── types/
│   │   │   └── index.ts               # 공통 TypeScript 타입
│   │   └── utils/
│   │       └── diffFormatter.ts       # Diff JSON → React 노드 변환
│   └── package.json
│
└── backend/                    # Python 3.11 + FastAPI
    ├── Dockerfile
    ├── app/
    │   ├── main.py                    # 엔트리포인트, CORS, 라우터 등록
    │   ├── api/
    │   │   └── endpoints.py           # /upload-document, /evaluate-audio
    │   ├── services/
    │   │   ├── parser.py              # PDF/DOCX/TXT 파싱 & 계층 분할
    │   │   ├── stt.py                 # Whisper API 호출 + Mock 모드
    │   │   └── diff.py                # difflib 비교 핵심 알고리즘
    │   └── models/
    │       └── schemas.py             # Pydantic 스키마
    ├── requirements.txt
    └── .env.example
```

---

## Docker 구성

### [NEW] `docker-compose.yml`
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app   # 개발 시 hot-reload
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app  # 개발 시 hot-reload
      - /app/node_modules
    depends_on:
      - backend
```

### [NEW] `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
```

### [NEW] `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

---

## 구현 단계

### Phase 1 — 백엔드 핵심 로직 (FastAPI)

#### [NEW] `backend/app/main.py`
- FastAPI 앱 초기화
- CORS 설정 (`localhost:3000` 허용)
- `/api` 라우터 포함

#### [NEW] `backend/app/models/schemas.py`
- `ScriptSegment`: `{ id, type, content, children }`
- `DiffChunk`: `{ type: "equal" | "insert" | "delete", text: str }`
- `EvaluateResponse`: `{ transcribed_text, diffs: List[DiffChunk] }`

#### [NEW] `backend/app/services/parser.py`
- `parse_pdf(file)` — `pdfplumber`로 텍스트 추출
- `parse_docx(file)` — `python-docx`로 텍스트 추출
- `parse_txt(file)` — 직접 decode
- `split_into_segments(text)` — 문단(`\n\n`) → 문장(`.?!` 정규식, 예외처리 포함) 계층 구조 생성
- 향후 확장: `kiwipiepy` 형태소 분석, G2P(발음 변환) 연동 가능 구조

#### [NEW] `backend/app/services/stt.py`
- `transcribe_audio(audio_bytes, filename)` — OpenAI Whisper API 호출
- `.env`에서 `OPENAI_API_KEY` 로드
- Mock 모드: `MOCK_STT=true`이면 더미 텍스트 반환 (API 키 없이 개발 가능)

#### [NEW] `backend/app/services/diff.py`
- `normalize_text(text)` — 공백·특수문자 제거 (순수 음절 단위 비교)
- `compute_diff(original, transcribed)` — `difflib.SequenceMatcher` 기반
- **인덱스 매핑**: 정규화 후 비교 → 원본 텍스트 위치로 역매핑하여 결과 반환
- 결과: `List[DiffChunk]` (equal / insert / delete)

#### [NEW] `backend/app/api/endpoints.py`
- `POST /api/upload-document` — 파일 업로드, 파싱, 계층 구조 반환
- `POST /api/evaluate-audio` — 오디오 + original_text 수신, STT + diff 결과 반환

#### [NEW] `backend/requirements.txt`
```
fastapi
uvicorn[standard]
python-multipart
pdfplumber
python-docx
openai
python-dotenv
```

---

### Phase 2 — 프론트엔드 (Next.js)

#### [NEW] `frontend/` — Next.js 14 프로젝트
- TypeScript + TailwindCSS + App Router

#### [NEW] `frontend/src/types/index.ts`
- `ScriptSegment`, `DiffChunk`, `EvaluateResponse` 타입 정의

#### [NEW] `frontend/src/services/api.ts`
- `uploadDocument(file: File)` → `ScriptSegment[]`
- `evaluateAudio(audioBlob: Blob, originalText: string)` → `EvaluateResponse`

#### [NEW] `frontend/src/hooks/useMediaRecorder.ts`
- 마이크 권한 요청, `MediaRecorder` 시작/정지
- 녹음 완료 시 `Blob` 콜백 반환
- 상태: `idle | recording | processing`

#### [NEW] `frontend/src/hooks/useScript.ts`
- 업로드된 대본 구조 상태 관리
- 선택된 세그먼트 관리
- 블라인드 토글 상태

#### [NEW] `frontend/src/components/ScriptViewer.tsx`
- `ScriptSegment[]` 계층 구조를 재귀적으로 렌더링
- 문단/문장 클릭 → 선택 상태 토글
- 블라인드 모드: `blur-sm` + `select-none` TailwindCSS 클래스

#### [NEW] `frontend/src/components/RecordButton.tsx`
- `useMediaRecorder` 훅 연결
- 녹음 중 애니메이션 (빨간 점 깜빡임)
- 녹음 완료 후 자동으로 `evaluateAudio` API 호출

#### [NEW] `frontend/src/components/DiffHighlighter.tsx`
- `DiffChunk[]` 배열을 받아 인라인 `<span>` 렌더링
- `equal` → 기본 색상
- `delete` (빠뜨린 부분) → 빨간색 + 취소선 (`line-through`)
- `insert` (잘못 말한 부분) → 파란색 + 밑줄 (`underline`)

#### [NEW] `frontend/src/utils/diffFormatter.ts`
- `DiffChunk[]` → `React.ReactNode[]` 변환 유틸리티

---

## 주요 설계 결정사항

### Python 백엔드 선택 이유 (고도화·확장성)
- **한국어 NLP 고도화:** `kiwipiepy`, `KoNLPy` 형태소 분석으로 동음이의어·조사 처리
- **G2P (발음 변환):** 표기→실제 발음 변환(`ko_pron` 등)으로 발음 기반 비교 가능
- **음성 분석 확장:** `librosa`, `torchaudio`로 발화 속도·억양·끊어 읽기 분석
- **AI 코칭 확장:** LangChain/LlamaIndex 기반 AI 피드백 에이전트 연동 용이

### Docker 개발 환경
- `docker compose up` 한 명령으로 전체 스택 실행
- 볼륨 마운트로 백엔드(`--reload`)·프론트엔드 모두 hot-reload 지원

### 텍스트 정규화 (Diff 정확도 향상)
- 원본과 STT 결과 양쪽 모두 아래를 제거 후 비교:
  - 공백, 줄바꿈
  - 마침표, 쉼표, 느낌표, 물음표 등 특수문자
- 비교 후 원본 텍스트의 원래 위치(인덱스)로 역매핑

### 문장 분할 정규식
```python
# 마침표 다음에 공백이나 줄바꿈이 오는 경우만 분할
# 소수점(3.14), 말줄임표(...) 예외 처리
import re
SENTENCE_SPLIT = re.compile(r'(?<=[^.]{2}[.?!])\s+(?=[A-Z가-힣])')
```

### Mock STT 모드
- `MOCK_STT=true` 환경변수 설정 시 Whisper API 미호출
- 개발/테스트 시 `original_text`를 약간 변형한 더미 결과 반환

---

## Open Questions

> [!IMPORTANT]
> **STT API 키**: OpenAI Whisper API 사용 시 `OPENAI_API_KEY`가 필요합니다. 없을 경우 `MOCK_STT=true`로 먼저 개발하고 나중에 연동합니다.

> [!NOTE]
> **챕터 구분**: 초기 구현에서는 **문단 > 문장** 2단계 계층으로 시작하고, 향후 DOCX 헤딩 스타일이나 `# 제목` 패턴으로 챕터 계층을 확장합니다.

---

## 검증 계획

### 로컬 실행
```bash
# 전체 스택 시작 (백엔드 + 프론트엔드)
docker compose up

# 백엔드 Swagger UI: http://localhost:8000/docs
# 프론트엔드:        http://localhost:3000
```

### 통합 테스트 시나리오
1. `.txt` 파일 업로드 → 문단/문장 계층 구조 확인
2. 특정 문장 클릭 → 블라인드(블러) 처리 확인
3. 녹음 → STT 변환 → Diff 결과 색상 강조 확인
4. `MOCK_STT=true`로 전체 플로우 테스트 (API 키 없이)
