"use client";

import React from "react";
import { DiffChunk, EvaluateResponse } from "@/types";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface DiffHighlighterProps {
  evaluation: EvaluateResponse;
}

export const DiffHighlighter: React.FC<DiffHighlighterProps> = ({ evaluation }) => {
  const { original_text, transcribed_text, accuracy, diffs } = evaluation;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6">
      {/* 상단 헤더: 정확도 점수 및 통계 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {accuracy >= 80 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            암기 평가 결과
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            발화된 음성과 원본 대본의 글자 단위 정밀 비교 결과입니다.
          </p>
        </div>

        {/* 정확도 배지 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">일치도</span>
          <div
            className={`px-3.5 py-1.5 rounded-full text-base font-bold shadow-sm ${
              accuracy >= 90
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : accuracy >= 70
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {accuracy}%
          </div>
        </div>
      </div>

      {/* 범례 (Legend) */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
        <span className="text-slate-500 font-semibold">범례:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-700"></span>
          <span className="text-slate-700">정확히 발화함</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
          <span className="text-rose-600 line-through">빠뜨린 부분 (대본에 있음)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
          <span className="text-blue-600 underline">추가/잘못 말한 부분</span>
        </div>
      </div>

      {/* 대본 비교 피드백 (Diff 하이라이팅 영역) */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          대본 피드백 시각화
        </h4>
        <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 text-base leading-relaxed break-keep font-sans">
          {diffs.map((chunk, index) => {
            if (chunk.type === "equal") {
              return (
                <span
                  key={index}
                  className="text-slate-800 font-normal transition-colors"
                >
                  {chunk.text}
                </span>
              );
            } else if (chunk.type === "delete") {
              // 대본에 있지만 말하지 않고 빠뜨린 부분: 빨간색 + 취소선
              return (
                <span
                  key={index}
                  className="text-rose-600 font-semibold line-through bg-rose-50 px-1 py-0.5 rounded mx-0.5 decoration-rose-500 decoration-2"
                  title="빠뜨린 대본"
                >
                  {chunk.text}
                </span>
              );
            } else if (chunk.type === "insert") {
              // 대본에 없는데 추가로 말하거나 잘못 말한 부분: 파란색 + 밑줄
              return (
                <span
                  key={index}
                  className="text-blue-600 font-semibold underline bg-blue-50 px-1 py-0.5 rounded mx-0.5 decoration-blue-500 decoration-2"
                  title="추가 또는 오답 발화"
                >
                  {chunk.text}
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* STT 실제 인식 텍스트 */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          STT 음성 인식 원문
        </h4>
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-sm text-slate-600 italic">
          "{transcribed_text || "(음성이 인식되지 않았습니다)"}"
        </div>
      </div>
    </div>
  );
};
