"use client";

import React, { useState } from "react";
import {
  Mic,
  Square,
  Loader2,
  Volume2,
  AlertCircle,
  Radio,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

interface RecordButtonProps {
  disabled: boolean;
  isEvaluating: boolean;
  isRetry?: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onStartBlindTest: () => void;
  onEvaluate: (audioBlob: Blob, liveText?: string) => Promise<void>;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  disabled,
  isEvaluating,
  isRetry = false,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  onStartBlindTest,
  onEvaluate,
}) => {


  const {
    status,
    duration,
    liveTranscript,
    interimTranscript,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useMediaRecorder();

  const [localError, setLocalError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setLocalError(null);
    onStartBlindTest(); // 블라인드 모드 자동 활성화
    try {
      await startRecording();
    } catch (err: any) {
      setLocalError("마이크 녹음을 시작하지 못했습니다.");
    }
  };

  const handleStop = async () => {
    try {
      const { blob, transcript } = await stopRecording();
      if (blob && blob.size > 0) {
        await onEvaluate(blob, transcript);
      } else {
        setLocalError("녹음된 오디오 데이터가 없습니다.");
      }
    } catch (err: any) {
      setLocalError("오디오 전송 중 오류가 발생했습니다.");
    }
  };

  const isRecording = status === "recording";
  const hasSpokenText = liveTranscript || interimTranscript;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 녹음 중일 때 나타나는 실시간 음성 인식 텍스트 디스플레이 박스 */}
      {isRecording && (
        <div className="w-full bg-slate-900 text-white p-4 rounded-xl border border-indigo-500/40 shadow-inner space-y-2.5 animate-fadeIn">
          {/* 상태 헤더 */}
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              <span>실시간 음성 인식 (Live STT)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 실시간으로 인식된 음성 텍스트 출력 영역 */}
          <div className="min-h-[56px] text-sm leading-relaxed max-h-36 overflow-y-auto font-sans">
            {hasSpokenText ? (
              <p className="break-keep">
                <span className="text-slate-100 font-medium">{liveTranscript} </span>
                {interimTranscript && (
                  <span className="text-indigo-300 italic underline decoration-dotted decoration-indigo-400">
                    {interimTranscript}
                  </span>
                )}
                <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
              </p>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 italic text-xs h-full py-3">
                <Volume2 className="w-4 h-4 text-indigo-400 animate-bounce shrink-0" />
                <span>마이크에 대고 대사를 말씀하시면 실시간으로 여기에 텍스트가 표시됩니다...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3단 버튼 바: [ 이전 ]  [ 녹음/다시하기 버튼 ]  [ 다음 ] */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full pt-3 border-t border-slate-100">
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev || isRecording || isEvaluating}
            className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none shadow-md shadow-indigo-100 transition-all shrink-0 min-w-[80px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전</span>
          </button>
        )}

        {/* 녹음 제어 버튼 (1회차: 시작 / 2회차 이상: 다시하기 / 녹음중: 완료) */}
        {isRecording ? (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all duration-200 flex-1 min-w-[140px]"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>녹음 완료 및 평가</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={disabled || isEvaluating}
            className={`flex items-center justify-center gap-2 px-5 py-3 font-bold rounded-xl shadow-lg transition-all duration-200 flex-1 min-w-[140px] ${
              disabled || isEvaluating
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-200"
            }`}
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>STT 분석 중...</span>
              </>
            ) : isRetry ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>다시하기</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>블라인드 암기 테스트 시작</span>
              </>
            )}
          </button>
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext || isRecording || isEvaluating}
            className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none shadow-md shadow-indigo-100 transition-all shrink-0 min-w-[80px]"
          >
            <span>다음</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>



      {/* 에러 메시지 알림 */}
      {(recorderError || localError) && (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 w-full justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recorderError || localError}</span>
        </div>
      )}
    </div>
  );
};
