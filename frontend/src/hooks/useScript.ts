"use client";

import { useState, useCallback, useMemo } from "react";
import { ScriptSegment, EvaluateResponse } from "@/types";
import { uploadDocument, parseText, evaluateAudio } from "@/services/api";

export function useScript() {
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [filename, setFilename] = useState<string>("");
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(null);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluateResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSegmentIds, setAttemptedSegmentIds] = useState<Set<string>>(new Set());

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const response = await uploadDocument(file);
      setSegments(response.segments);
      setFilename(response.filename);
      // 첫 번째 문단 혹은 첫 번째 문장 자동 선택
      if (response.segments.length > 0) {
        const first = response.segments[0];
        const firstChild = first.children.length > 0 ? first.children[0] : first;
        setSelectedSegment(firstChild);
      }
      setEvaluationResult(null);
      setIsBlindMode(false);
      setAttemptedSegmentIds(new Set());
    } catch (err: any) {
      setError(err.message || "문서 업로드 실패");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDirectText = useCallback(async (text: string, title?: string) => {
    if (!text.trim()) {
      setError("텍스트를 입력해주세요.");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const response = await parseText(text, title || "직접 입력한 대본");
      setSegments(response.segments);
      setFilename(response.filename);
      if (response.segments.length > 0) {
        const first = response.segments[0];
        const firstChild = first.children.length > 0 ? first.children[0] : first;
        setSelectedSegment(firstChild);
      }
      setEvaluationResult(null);
      setIsBlindMode(false);
      setAttemptedSegmentIds(new Set());
    } catch (err: any) {
      setError(err.message || "텍스트 파싱 실패");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const selectSegment = useCallback((segment: ScriptSegment) => {
    setSelectedSegment(segment);
    setEvaluationResult(null);
  }, []);

  const toggleBlindMode = useCallback(() => {
    setIsBlindMode((prev) => !prev);
  }, []);

  const resetEvaluation = useCallback(() => {
    setEvaluationResult(null);
  }, []);

  const evaluate = useCallback(async (audioBlob: Blob, liveText?: string) => {
    if (!selectedSegment) return;

    setIsEvaluating(true);
    setError(null);
    try {
      const result = await evaluateAudio(audioBlob, selectedSegment.content, liveText);
      setEvaluationResult(result);
      setAttemptedSegmentIds((prev) => new Set(prev).add(selectedSegment.id));
      // 평가가 끝나면 블라인드 해제하여 결과를 바로 볼 수 있게 함
      setIsBlindMode(false);
    } catch (err: any) {
      setError(err.message || "오디오 평가 실패");
    } finally {
      setIsEvaluating(false);
    }
  }, [selectedSegment]);

  const clearScript = useCallback(() => {
    setSegments([]);
    setFilename("");
    setSelectedSegment(null);
    setIsBlindMode(false);
    setEvaluationResult(null);
    setError(null);
    setAttemptedSegmentIds(new Set());
  }, []);


  // 현재 모드(문단 vs 문장)에 따른 전체 탐색 목록
  const allUnits = useMemo(() => {
    if (!selectedSegment) return [];
    if (selectedSegment.type === "paragraph") {
      return segments;
    }
    // 문장 단위 모드: 모든 문단들의 하위 문장 평탄화
    const flattened = segments.flatMap((p) => (p.children.length > 0 ? p.children : [p]));
    return flattened;
  }, [segments, selectedSegment]);

  const currentIndex = useMemo(() => {
    if (!selectedSegment || allUnits.length === 0) return -1;
    return allUnits.findIndex((u) => u.id === selectedSegment.id);
  }, [allUnits, selectedSegment]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allUnits.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setSelectedSegment(allUnits[currentIndex - 1]);
      setEvaluationResult(null);
      setIsBlindMode(false);
    }
  }, [hasPrev, allUnits, currentIndex]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setSelectedSegment(allUnits[currentIndex + 1]);
      setEvaluationResult(null);
      setIsBlindMode(false);
    }
  }, [hasNext, allUnits, currentIndex]);

  const handleRetry = useCallback(() => {
    setEvaluationResult(null);
    setIsBlindMode(true);
  }, []);

  const isRetry = Boolean(selectedSegment && attemptedSegmentIds.has(selectedSegment.id));

  return {
    segments,
    filename,
    selectedSegment,
    isBlindMode,
    evaluationResult,
    isEvaluating,
    isUploading,
    error,
    handleUpload,
    handleDirectText,
    selectSegment,
    toggleBlindMode,
    resetEvaluation,
    evaluate,
    clearScript,
    allUnits,
    currentIndex,
    hasPrev,
    hasNext,
    goToPrev,
    goToNext,
    handleRetry,
    isRetry,
  };
}



