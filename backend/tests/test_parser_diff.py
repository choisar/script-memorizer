import pytest
from app.services.parser import split_into_segments, split_into_sentences
from app.services.diff import compute_diff, normalize_text_with_mapping
from app.services.stt import transcribe_audio

def test_sentence_splitting():
    text = "안녕하세요. 저는 배우입니다! 오늘 날씨가 참 좋네요? 3.14는 소수점입니다... 말줄임표도 잘 될까요?"
    sentences = split_into_sentences(text)
    assert len(sentences) >= 4
    # 3.14 소수점에서 끊어지지 않아야 함
    assert any("3.14" in s for s in sentences)

def test_paragraph_and_sentence_segments():
    script = """첫 번째 문단입니다. 첫 번째 문단의 두 번째 문장입니다.

두 번째 문단입니다. 또 다른 문장입니다."""
    segments = split_into_segments(script)
    assert len(segments) == 2
    assert segments[0].id == "p1"
    assert segments[0].type == "paragraph"
    assert len(segments[0].children) == 2
    assert segments[0].children[0].id == "p1-s1"
    assert segments[1].id == "p2"

def test_markdown_and_list_parsing():
    md_script = """## 1. 원 칙(제3조 제1항)
행정절차법은 행정절차에 관한 일반법이다.

### 1) 독립기관 사항
1 국회 또는 지방의회의 의결, 2 법원 등의 재판"""
    segments = split_into_segments(md_script)
    assert len(segments) >= 2
    # 1. 원 칙에서 '1.' 때문에 오분할되지 않아야 함
    first_p = segments[0]
    assert any("1. 원 칙" in s.content for s in first_p.children)
    # 마크다운 헤더 기호(##, ###)는 정제되어야 함
    assert not any(s.content.startswith("##") or s.content.startswith("###") for s in first_p.children)


def test_diff_exact_match():
    original = "죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를"
    transcribed = "죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를"
    diffs, accuracy = compute_diff(original, transcribed)
    assert accuracy == 100.0
    assert all(d.type == "equal" for d in diffs)

def test_diff_with_missed_and_inserted_words():
    original = "동해물과 백두산이 마르고 닳도록"
    transcribed = "동해물과 마르고 닳도록 하느님이"
    diffs, accuracy = compute_diff(original, transcribed)
    
    # 백두산이는 delete(누락) 되어야 함
    delete_texts = [d.text for d in diffs if d.type == "delete"]
    assert any("백두산이" in t for t in delete_texts)
    
    # 하느님이는 insert(추가/오답) 되어야 함
    insert_texts = [d.text for d in diffs if d.type == "insert"]
    assert any("하느님이" in t for t in insert_texts)
    assert accuracy < 100.0

def test_live_stt_fallback():
    # Mock 모드에서 사용자의 실시간 발화 텍스트가 우선 반영되는지 검증
    live_text = "사용자가 직접 말한 실시간 음성 대사입니다"
    result = transcribe_audio(
        audio_bytes=b"fake_audio_bytes",
        original_text="원본 텍스트",
        live_transcribed_text=live_text
    )
    assert result == live_text
