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

## 2. 적용배제사항(제3조 제2항)
### 1) 헌법상 독립기관 등의 판단을 거친 사항
1 국회 또는 지방의회의 의결, 2 법원 등의 재판
### 2) 법적 성질이 달라 특별한 절차가 필요한 사항
1 형사 관계 법령에 따라 행하는 사항"""
    segments = split_into_segments(md_script)
    assert len(segments) == 2
    
    # 문단 1 검증
    p1 = segments[0]
    assert len(p1.children) == 2
    assert p1.children[0].content == "1. 원 칙(제3조 제1항)"
    assert p1.children[1].content == "행정절차법은 행정절차에 관한 일반법이다."

    # 문단 2 검증 (소제목 ### 1), ### 2) 등이 문단 2 내의 세부 문장으로 귀속됨)
    p2 = segments[1]
    assert len(p2.children) == 5
    assert p2.children[0].content == "2. 적용배제사항(제3조 제2항)"
    assert p2.children[1].content == "1) 헌법상 독립기관 등의 판단을 거친 사항"
    assert "1 국회" in p2.children[2].content
    assert p2.children[3].content == "2) 법적 성질이 달라 특별한 절차가 필요한 사항"
    assert "1 형사" in p2.children[4].content



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
