"use client";

import React from "react";
import { ScriptSegment as ScriptSegmentType } from "@/types";
import { Eye, EyeOff } from "lucide-react";

interface ScriptSegmentProps {
  segment: ScriptSegmentType;
  isSelected: boolean;
  isBlind: boolean;
  onSelect: (segment: ScriptSegmentType) => void;
}

export const ScriptSegment: React.FC<ScriptSegmentProps> = ({
  segment,
  isSelected,
  isBlind,
  onSelect,
}) => {
  const isSelectedAndBlind = isSelected && isBlind;

  return (
    <div
      onClick={() => onSelect(segment)}
      className={`relative group p-3 my-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-400"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* 텍스트 영역 (블라인드 모드 시 블러 및 텍스트 선택 방지) */}
        <p
          className={`text-slate-800 leading-relaxed break-keep transition-all duration-300 ${
            isSelectedAndBlind
              ? "filter blur-md select-none bg-slate-200/60 rounded text-transparent"
              : ""
          }`}
        >
          {segment.content}
        </p>

        {/* 상태 태그 / 아이콘 */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {isSelected && (
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
              선택됨
            </span>
          )}
          {isSelectedAndBlind && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"
              title="블라인드 모드 활성화 중"
            >
              <EyeOff className="w-3 h-3" /> 블라인드
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
