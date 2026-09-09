# 대본 암기 훈련 웹 애플리케이션 (Script Memorizer)

배우, 아나운서, 발표자 등이 대본을 효과적으로 암기할 수 있도록 돕는 웹 기반 애플리케이션입니다.

- **문서 업로드 및 계층 파싱:** `.pdf`, `.docx`, `.txt` 파일을 문단과 문장 단위로 자동 분할
- **블라인드 모드:** 테스트 대상 문장/문단을 블러(Blur) 처리하여 시각적 차단
- **🎙️ 실시간 음성인식 (Live STT):** 사용자가 녹음하며 말하는 음성이 **실시간 스트리밍으로 화면에 즉시 텍스트 출력**
- **정밀 STT 및 순수 음절 단위 Diff 비교:**
  - Whisper API 및 브라우저 실시간 음성 전사 지원
  - 띄어쓰기/문장부호 오차를 최소화한 순수 음절 단위 `difflib` 정밀 비교 및 일치도 산출
- **직관적 오답 피드백 UI:**
  - 정확히 말한 부분: 기본 텍스트
  - 빠뜨린 대본: **빨간색 + 취소선**
  - 추가/잘못 말한 발화: **파란색 + 밑줄**

---

## 🚀 빠른 시작 (Docker Compose)

```bash
# 저장소 루트에서 도커 컨테이너 빌드 및 실행
docker compose up --build
```

실행 후 브라우저에서 접속:
- **프론트엔드 (웹 UI):** [http://localhost:3000](http://localhost:3000)
- **백엔드 (API Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚙️ 환경변수 설정 (`.env`)

프로젝트 루트의 `.env` 파일에서 Whisper API 키와 Mock 모드를 설정할 수 있습니다.

```env
# OpenAI Whisper API 키 (선택 사항: 비워둘 시 브라우저 실시간 음성인식 또는 Mock 모드 동작)
OPENAI_API_KEY=

# Mock STT 모드 강제 여부 (true/false)
MOCK_STT=true

# 프론트엔드에서 바라보는 백엔드 URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Tip:** 브라우저 내장 Web Speech API를 통해 별도의 API 키 없이도 크롬/엣지 등에서 **실시간 한국어 음성 인식**이 즉시 동작합니다.

---

## 📁 프로젝트 구조

```
대본외우기/
├── docker-compose.yml          # 전체 컨테이너 오케스트레이션
├── .env                        # 환경변수 설정
├── sample_script.txt           # 테스트용 샘플 대본
│
├── frontend/                   # Next.js 14 + TypeScript + TailwindCSS
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/                # 메인 페이지 및 레이아웃
│   │   ├── components/         # ScriptViewer, ScriptSegment, RecordButton (Live STT 탑재), DiffHighlighter
│   │   ├── hooks/              # useMediaRecorder (Web Speech + MediaRecorder), useScript
│   │   ├── services/           # api.ts
│   │   └── types/              # index.ts
│   └── package.json
│
└── backend/                    # Python 3.11 + FastAPI
    ├── Dockerfile
    ├── app/
    │   ├── main.py             # FastAPI 엔트리포인트 & CORS
    │   ├── api/                # endpoints.py (/upload-document, /evaluate-audio)
    │   ├── services/           # parser.py (문서 파싱), stt.py (Whisper/Live/Mock), diff.py (difflib)
    │   └── models/             # schemas.py (Pydantic 모델)
    ├── tests/                  # 단위 테스트 (pytest)
    └── requirements.txt
```
