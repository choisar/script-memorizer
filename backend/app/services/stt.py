import os
import io
import random
from typing import Optional
from openai import OpenAI

def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    original_text: Optional[str] = None,
    live_transcribed_text: Optional[str] = None
) -> str:
    """
    오디오 데이터를 텍스트로 변환합니다.
    - 실제 OPENAI_API_KEY가 설정되어 있고 MOCK_STT!=true 인 경우: OpenAI Whisper API 호출
    - 그 외(API 키 없음/Mock 모드):
      - 사용자가 실시간 발화한 텍스트(live_transcribed_text)가 있으면 이를 우선 사용하여 실제 음성 전사 반영
      - 없으면 시뮬레이션된 Mock 텍스트 반환
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    mock_mode = os.getenv("MOCK_STT", "false").lower() in ("true", "1", "yes")

    # 실제 Whisper API 호출 가능한 경우
    if api_key and not mock_mode:
        try:
            client = OpenAI(api_key=api_key)
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename if filename else "audio.webm"

            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ko"
            )
            return response.text.strip()
        except Exception as e:
            # Whisper API 호출 실패 시 live_transcribed_text 또는 mock으로 graceful fallback
            print(f"Whisper API 호출 실패, fallback 적용: {e}")

    # 브라우저 실시간 음성 인식이 전달된 경우 이를 사용 (가장 정확한 실제 사용자 발화)
    if live_transcribed_text and live_transcribed_text.strip():
        return live_transcribed_text.strip()

    # 둘 다 없는 경우 모의 텍스트 반환
    return generate_mock_transcription(original_text)

def generate_mock_transcription(original_text: Optional[str]) -> str:
    """
    개발 및 테스트를 위해 원본 텍스트를 약간 변형한 모의(Mock) STT 결과를 생성합니다.
    예: 일부 단어 누락, 일부 조사 변경, 또는 85% 일치율 시뮬레이션
    """
    if not original_text or not original_text.strip():
        return "테스트 발화 내용입니다."

    words = original_text.split()
    if len(words) <= 2:
        return original_text

    simulated_words = list(words)
    change_idx = random.randint(0, len(simulated_words) - 1)
    
    scenario = random.choice(["typo", "skip", "add"])
    if scenario == "typo":
        simulated_words[change_idx] = simulated_words[change_idx] + "요"
    elif scenario == "skip" and len(simulated_words) > 3:
        simulated_words.pop(change_idx)
    elif scenario == "add":
        simulated_words.insert(change_idx, "음...")

    return " ".join(simulated_words)
