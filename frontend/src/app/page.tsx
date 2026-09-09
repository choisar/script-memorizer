"use client";

import React, { useRef, useState } from "react";
import { useScript } from "@/hooks/useScript";
import { ScriptViewer } from "@/components/ScriptViewer";
import { RecordButton } from "@/components/RecordButton";
import { DiffHighlighter } from "@/components/DiffHighlighter";
import {
  Upload,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Edit3,
  Check,
  X,
} from "lucide-react";

export default function Home() {
  const {
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
    evaluate,
    clearScript,
  } = useScript();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [directTitle, setDirectTitle] = useState("");
  const [directText, setDirectText] = useState("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // 동일 파일 재선택 시에도 onChange가 동작하도록 초기화
    e.target.value = "";
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directText.trim()) return;
    handleDirectText(directText, directTitle.trim() || undefined);
    setShowDirectInput(false);
    setDirectText("");
    setDirectTitle("");
  };

  // 빠른 테스트를 위한 샘플 대본 생성 함수
  const loadSampleScript = () => {
    const sampleText = `[제 1장: 운명적인 만남]
어느 날 갑자기 찾아온 바람처럼, 그 사람의 목소리가 들려왔다.
세상이 멈춘 것만 같았고 아무 생각도 나지 않았다.

[제 2장: 결심]
이제 더 이상 물러설 곳은 없다.
우리는 반드시 우리가 꿈꾸던 그곳에 도달할 것이다.`;

    const blob = new Blob([sampleText], { type: "text/plain;charset=utf-8" });
    const sampleFile = new File([blob], "셰익스피어_명대사_샘플.txt", {
      type: "text/plain",
    });
    handleUpload(sampleFile);
  };

  return (
    <main className="min-h-screen pb-16">
      {/* 글로벌 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                대본 암기 훈련소 <span className="text-indigo-600">ScriptMaster</span>
              </h1>
              <p className="text-xs text-slate-500">
                대본 분할 · 블라인드 테스트 · STT 음성 비교 & 실시간 오답 피드백
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {segments.length > 0 && (
              <button
                onClick={clearScript}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 대본 초기화
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 에러 메시지 알림 */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {/* 문서 업로드 섹션 (대본이 없을 때 대형 배너, 있을 때는 축소 상단바) */}
        {segments.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              대본 문서를 업로드하거나 텍스트를 입력하세요
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              PDF, Word(.docx), 텍스트(.txt), 마크다운(.md) 문서를 지원합니다. 자동으로 문단과
              문장으로 분할됩니다.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".pdf,.docx,.doc,.txt,.md,.markdown"
              className="hidden"
            />

            {!showDirectInput ? (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "파일 파싱 중..." : "대본 파일 선택하기 (.md, .txt, .pdf, .docx)"}
                </button>

                <button
                  onClick={() => setShowDirectInput(true)}
                  disabled={isUploading}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-indigo-700 font-semibold rounded-xl border border-indigo-200 shadow-sm transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  직접 텍스트 붙여넣기
                </button>

                <button
                  onClick={loadSampleScript}
                  disabled={isUploading}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  샘플 대본으로 바로 체험하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleDirectSubmit} className="mt-6 max-w-2xl mx-auto text-left space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    직접 대본 텍스트 입력
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDirectInput(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    대본 제목 (선택사항)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 행정절차법 핵심 요약, 햄릿 독백 등"
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    대본 내용 (마크다운, 대화문, 줄글 모두 가능)
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="암기할 대본이나 요약 텍스트를 여기에 직접 붙여넣으세요..."
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDirectInput(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !directText.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    {isUploading ? "파싱 중..." : "대본 파싱 및 암기 시작"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>현재 파일:</span>
              <strong className="text-slate-800">{filename}</strong>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                다른 파일 올리기
              </button>
              <button
                onClick={() => {
                  clearScript();
                  setShowDirectInput(true);
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                텍스트 직접 붙여넣기
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".pdf,.docx,.doc,.txt,.md,.markdown"
              className="hidden"
            />
          </div>
        )}

        {/* 대본이 로드되었을 때 2-컬럼 작업 공간 */}
        {segments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 좌측 컬럼: 대본 계층 뷰어 (문단 / 문장) */}
            <div className="lg:col-span-6 xl:col-span-7">
              <ScriptViewer
                segments={segments}
                filename={filename}
                selectedSegment={selectedSegment}
                isBlindMode={isBlindMode}
                onSelectSegment={selectSegment}
              />
            </div>

            {/* 우측 컬럼: 테스트 제어판 & Diff 피드백 결과 */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-6">
              {/* 선택된 구간 및 암기 테스트 패널 */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedSegment?.type === "paragraph"
                        ? "문단 암기 모드"
                        : "문장 암기 모드"}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">
                      테스트 대상 구간
                    </h3>
                  </div>

                  {/* 수동 블라인드 토글 버튼 */}
                  <button
                    onClick={toggleBlindMode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isBlindMode
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isBlindMode ? (
                      <>
                        <EyeOff className="w-4 h-4" /> 블라인드 켜짐
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> 블라인드 끄기
                      </>
                    )}
                  </button>
                </div>

                {/* 현재 선택된 대본 내용 */}
                <div className="relative min-h-[90px] p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p
                    className={`text-slate-800 leading-relaxed break-keep font-medium transition-all duration-300 ${
                      isBlindMode
                        ? "filter blur-md select-none bg-slate-200 text-transparent"
                        : ""
                    }`}
                  >
                    {selectedSegment?.content || "암기할 문장을 좌측에서 클릭해 주세요."}
                  </p>
                  {isBlindMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-slate-800/80 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                        블라인드 처리됨 (음성으로 읊어보세요!)
                      </span>
                    </div>
                  )}
                </div>

                {/* 녹음 시작/중지 및 자동 평가 트리거 */}
                <RecordButton
                  disabled={!selectedSegment}
                  isEvaluating={isEvaluating}
                  onStartBlindTest={() => {
                    // 녹음 시작 시 자동으로 대본을 가림
                    if (!isBlindMode) toggleBlindMode();
                  }}
                  onEvaluate={evaluate}
                />
              </div>

              {/* STT 비교 결과 및 시각화 피드백 영역 */}
              {evaluationResult && (
                <div className="transition-all duration-300">
                  <DiffHighlighter evaluation={evaluationResult} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
