"use client";

import React, { useState } from "react";
import { ScriptSegment as ScriptSegmentType } from "@/types";
import { ScriptSegment } from "./ScriptSegment";
import { BookOpen, Layers, AlignLeft } from "lucide-react";

interface ScriptViewerProps {
  segments: ScriptSegmentType[];
  filename: string;
  selectedSegment: ScriptSegmentType | null;
  isBlindMode: boolean;
  onSelectSegment: (segment: ScriptSegmentType) => void;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({
  segments,
  filename,
  selectedSegment,
  isBlindMode,
  onSelectSegment,
}) => {
  // 보기 모드: 'sentence' (문장 단위 분할) vs 'paragraph' (문단 단위 통째로)
  const [viewMode, setViewMode] = useState<"sentence" | "paragraph">("sentence");

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
        <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-base font-medium text-slate-600">업로드된 대본이 없습니다.</p>
        <p className="text-xs text-slate-400 mt-1">
          PDF, Word(.docx), TXT 파일을 업로드하여 암기를 시작해보세요.
        </p>
      </div>
    );
  }

  // 총 문장 수 계산
  const totalSentences = segments.reduce((acc, p) => acc + p.children.length, 0);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* 뷰어 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 truncate max-w-[260px]" title={filename}>
            {filename}
          </h3>
          <span className="text-xs text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
            {segments.length}개 문단 · {totalSentences}개 문장
          </span>
        </div>

        {/* 보기 모드 토글 버튼 */}
        <div className="flex items-center bg-slate-200/60 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setViewMode("sentence")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === "sentence"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" /> 문장별
          </button>
          <button
            onClick={() => setViewMode("paragraph")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === "paragraph"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 문단별
          </button>
        </div>
      </div>

      {/* 대본 목록 스크롤 영역 */}
      <div className="p-4 overflow-y-auto space-y-6 max-h-[620px]">
        {segments.map((paragraph, pIdx) => {
          const isParagraphSelected = selectedSegment?.id === paragraph.id;

          if (viewMode === "paragraph") {
            return (
              <div key={paragraph.id} className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">
                  문단 {pIdx + 1}
                </span>
                <ScriptSegment
                  segment={paragraph}
                  isSelected={isParagraphSelected}
                  isBlind={isBlindMode}
                  onSelect={onSelectSegment}
                />
              </div>
            );
          }

          // 문장별 모드인 경우
          return (
            <div
              key={paragraph.id}
              className="border-l-2 border-indigo-200 pl-3.5 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>문단 {pIdx + 1}</span>
                <button
                  onClick={() => onSelectSegment(paragraph)}
                  className="text-indigo-600 hover:underline text-[11px]"
                >
                  문단 전체 선택
                </button>
              </div>

              {paragraph.children.length > 0 ? (
                paragraph.children.map((sentence) => (
                  <ScriptSegment
                    key={sentence.id}
                    segment={sentence}
                    isSelected={selectedSegment?.id === sentence.id}
                    isBlind={isBlindMode}
                    onSelect={onSelectSegment}
                  />
                ))
              ) : (
                <ScriptSegment
                  segment={paragraph}
                  isSelected={isParagraphSelected}
                  isBlind={isBlindMode}
                  onSelect={onSelectSegment}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
