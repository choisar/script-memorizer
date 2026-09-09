import re
import difflib
from typing import List, Tuple
from app.models.schemas import DiffChunk

# 정규화 시 제거할 특수문자 및 공백 패턴
PUNCTUATION_AND_SPACE_REGEX = re.compile(r'[\s\.,\?!~:;"\'“‘”’\(\)\[\]\{\}\-_/·…]+')

def normalize_text_with_mapping(text: str) -> Tuple[str, List[int]]:
    """
    텍스트에서 공백과 문장부호를 제거하고,
    정규화된 각 문자가 원본 문자열에서 어떤 인덱스에 있었는지 매핑 정보를 함께 반환합니다.
    """
    normalized_chars = []
    index_map = []  # normalized_chars[i] -> original text index
    
    for idx, char in enumerate(text):
        if not PUNCTUATION_AND_SPACE_REGEX.match(char):
            normalized_chars.append(char)
            index_map.append(idx)
            
    return "".join(normalized_chars), index_map

def compute_diff(original_text: str, transcribed_text: str) -> Tuple[List[DiffChunk], float]:
    """
    원본 텍스트와 STT 전사 텍스트를 순수 음절 단위로 비교하여
    'equal', 'insert', 'delete' 조각과 정확도(0~100%)를 반환합니다.
    
    - equal: 정확히 발화함 (원본 텍스트 기준 표시)
    - delete: 대본에 있으나 누락됨 (빨간색 + 취소선)
    - insert: 대본에 없거나 잘못 발음/추가됨 (파란색 + 밑줄)
    """
    norm_orig, orig_map = normalize_text_with_mapping(original_text)
    norm_trans, trans_map = normalize_text_with_mapping(transcribed_text)

    if not norm_orig and not norm_trans:
        return [DiffChunk(type="equal", text=original_text)], 100.0

    if not norm_orig:
        return [DiffChunk(type="insert", text=transcribed_text)], 0.0

    if not norm_trans:
        return [DiffChunk(type="delete", text=original_text)], 0.0

    matcher = difflib.SequenceMatcher(None, norm_orig, norm_trans)
    diff_chunks: List[DiffChunk] = []

    last_orig_end_idx = 0
    equal_norm_char_count = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            # 원본 텍스트에서의 실제 슬라이스 범위 복원 (공백 및 특수문자 포함)
            orig_start = orig_map[i1]
            orig_end = orig_map[i2 - 1] + 1
            
            # 중간에 건너뛴 원본 공백/부호가 있다면 포함
            if orig_start > last_orig_end_idx:
                prefix = original_text[last_orig_end_idx:orig_start]
                if prefix.strip():
                    diff_chunks.append(DiffChunk(type="delete", text=prefix))
                else:
                    # 공백만 있는 경우 직전 chunk나 현재 chunk에 자연스럽게 흡수
                    diff_chunks.append(DiffChunk(type="equal", text=prefix))

            equal_text = original_text[orig_start:orig_end]
            diff_chunks.append(DiffChunk(type="equal", text=equal_text))
            last_orig_end_idx = orig_end
            equal_norm_char_count += (i2 - i1)

        elif tag == "delete":
            orig_start = orig_map[i1]
            orig_end = orig_map[i2 - 1] + 1
            deleted_text = original_text[orig_start:orig_end]
            diff_chunks.append(DiffChunk(type="delete", text=deleted_text))
            last_orig_end_idx = orig_end

        elif tag == "insert":
            trans_start = trans_map[j1]
            trans_end = trans_map[j2 - 1] + 1
            inserted_text = transcribed_text[trans_start:trans_end]
            diff_chunks.append(DiffChunk(type="insert", text=inserted_text))

        elif tag == "replace":
            # replace는 원본의 누락(delete)과 발화의 잘못된 추가(insert)로 분할
            orig_start = orig_map[i1]
            orig_end = orig_map[i2 - 1] + 1
            deleted_text = original_text[orig_start:orig_end]
            
            trans_start = trans_map[j1]
            trans_end = trans_map[j2 - 1] + 1
            inserted_text = transcribed_text[trans_start:trans_end]

            diff_chunks.append(DiffChunk(type="delete", text=deleted_text))
            diff_chunks.append(DiffChunk(type="insert", text=inserted_text))
            last_orig_end_idx = orig_end

    # 남아있는 원본 끝부분 처리
    if last_orig_end_idx < len(original_text):
        remaining = original_text[last_orig_end_idx:]
        if remaining.strip():
            diff_chunks.append(DiffChunk(type="delete", text=remaining))
        else:
            diff_chunks.append(DiffChunk(type="equal", text=remaining))

    # 연속된 동일 타입의 Chunk 병합
    merged_chunks: List[DiffChunk] = []
    for chunk in diff_chunks:
        if not chunk.text:
            continue
        if merged_chunks and merged_chunks[-1].type == chunk.type:
            merged_chunks[-1] = DiffChunk(
                type=chunk.type,
                text=merged_chunks[-1].text + chunk.text
            )
        else:
            merged_chunks.append(chunk)

    # 정확도 계산: (일치한 순수 음절 수 / 원본 순수 음절 수) * 100
    accuracy = round((equal_norm_char_count / len(norm_orig)) * 100.0, 1) if norm_orig else 0.0

    return merged_chunks, accuracy
