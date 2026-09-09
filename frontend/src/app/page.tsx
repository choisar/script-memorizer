"use client";

import React, { useRef, useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  Mic,
  Keyboard,
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
    allUnits,
    currentIndex,
    hasPrev,
    hasNext,
    goToPrev,
    goToNext,
    handleRetry,
    isRetry,
    resetEvaluation,
  } = useScript();


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [directTitle, setDirectTitle] = useState("");
  const [directText, setDirectText] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [isHoldingRawText, setIsHoldingRawText] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  // 글로벌 키보드 단축키 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 직접 입력 폼이나 input 등에 포커스가 있을 때는 단축키 무시
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Space: 녹음 시작 / 완료 / 다시하기
      if (e.code === "Space") {
        e.preventDefault();
        const btn = document.getElementById("main-record-btn");
        if (btn) {
          btn.click();
        }
        return;
      }

      // 2. 방향키 Left (←): 이전 문장/문단
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (hasPrev) {
          goToPrev();
        }
        return;
      }

      // 3. 방향키 Right (→): 다음 문장/문단
      if (e.code === "ArrowRight") {
        e.preventDefault();
        if (hasNext) {
          goToNext();
        }
        return;
      }

      // 4. B 키 (한/영 ㅠ): 블라인드 모드 토글
      if (e.key === "b" || e.key === "B" || e.key === "ㅠ") {
        e.preventDefault();
        toggleBlindMode();
        return;
      }

      // 5. ? 키: 단축키 안내 팝업 토글
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcutModal((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, goToPrev, goToNext, toggleBlindMode]);


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
            <button
              onClick={() => setShowShortcutModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 shadow-sm"
              title="단축키 안내 (단축키: ?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>단축키 안내</span>
            </button>

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
              {/* 선택된 구간 및 암기 테스트 패널 (사용자 요청 통합 카드 UI) */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-5">
                {/* 상단 헤더 영역 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedSegment?.type === "paragraph"
                        ? "문단 암기 모드"
                        : "문장 암기 모드"}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">
                      테스트 대상 구간
                      {allUnits.length > 0 && currentIndex >= 0 && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          ({currentIndex + 1} / {allUnits.length})
                        </span>
                      )}
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

                {/* 1. 현재 원본 대본 내용 박스 */}
                <div className="relative min-h-[84px] p-4 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center">
                  <p
                    className={`text-slate-800 leading-relaxed break-keep font-medium text-base w-full transition-all duration-300 ${
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

                {/* 2. STT 비교 결과 (Diff) 박스 - 평가 결과가 있을 때 바로 표시 */}
                {evaluationResult && (
                  <div className="relative p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">발화 비교 분석</span>
                        <button
                          type="button"
                          onMouseDown={() => setIsHoldingRawText(true)}
                          onMouseUp={() => setIsHoldingRawText(false)}
                          onMouseLeave={() => setIsHoldingRawText(false)}
                          onTouchStart={() => setIsHoldingRawText(true)}
                          onTouchEnd={() => setIsHoldingRawText(false)}
                          onTouchCancel={() => setIsHoldingRawText(false)}
                          className={`select-none text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isHoldingRawText
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                          }`}
                          title="누르고 있는 동안 사용자가 입력한 발화 원문을 보여줍니다"
                        >
                          <Mic className="w-3 h-3" />
                          {isHoldingRawText ? "누르는 중: 발화 원문 표시 중" : "꾹 눌러서 내 발화 원문 보기"}
                        </button>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-xs shadow-sm ${
                          evaluationResult.accuracy >= 90
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : evaluationResult.accuracy >= 70
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        일치율 {evaluationResult.accuracy}%
                      </span>
                    </div>

                    {/* Diff 하이라이팅 또는 누르고 있는 동안 발화 원문 표시 */}
                    <div
                      className="select-none cursor-pointer transition-all duration-150"
                      onMouseDown={() => setIsHoldingRawText(true)}
                      onMouseUp={() => setIsHoldingRawText(false)}
                      onMouseLeave={() => setIsHoldingRawText(false)}
                      onTouchStart={() => setIsHoldingRawText(true)}
                      onTouchEnd={() => setIsHoldingRawText(false)}
                      onTouchCancel={() => setIsHoldingRawText(false)}
                      title="누르고 있으면 내가 말한 원본을 보여주고 떼면 원래대로 돌아옵니다"
                    >
                      {isHoldingRawText ? (
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-1 animate-fadeIn shadow-inner">
                          <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold">
                            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                            <span>사용자 음성 입력 원본 (손을 떼면 분석 결과로 복귀)</span>
                          </div>
                          <p className="text-slate-900 leading-relaxed break-keep font-medium text-base">
                            {evaluationResult.transcribed_text || "(인식된 음성 발화 텍스트가 없습니다)"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-800 leading-relaxed break-keep font-medium text-base">
                          {evaluationResult.diffs.map((chunk, index) => {
                            if (chunk.type === "equal") {
                              return (
                                <span key={index} className="text-slate-800 font-normal">
                                  {chunk.text}
                                </span>
                              );
                            } else if (chunk.type === "delete") {
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
                        </p>
                      )}
                    </div>

                    {/* 범례 토글 및 STT 음성 원문 */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => setShowLegend((prev) => !prev)}
                        className="hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
                      >
                        범례: {showLegend ? "접기" : "펼치기"}
                      </button>

                      {evaluationResult.transcribed_text && (
                        <span
                          className="text-[11px] text-slate-400 italic truncate max-w-[220px]"
                          title={evaluationResult.transcribed_text}
                        >
                          "{evaluationResult.transcribed_text}"
                        </span>
                      )}
                    </div>

                    {/* 펼쳐진 범례 안내 */}
                    {showLegend && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block"></span>
                          <span>정확함</span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-600">
                          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                          <span className="line-through">빠뜨린 부분</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
                          <span className="underline">추가/오답</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. 통합 제어 버튼 바: [ 이전 ]  [ 블라인드 암기 테스트 시작 / 다시하기 ]  [ 다음 ] */}
                <RecordButton
                  disabled={!selectedSegment}
                  isEvaluating={isEvaluating}
                  isRetry={isRetry}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  onPrev={goToPrev}
                  onNext={goToNext}
                  onStartBlindTest={() => {
                    // 다시하기/새 테스트 시작 시 기존 음성 인식 텍스트 및 Diff 결과 즉시 제거
                    resetEvaluation();
                    if (!isBlindMode) toggleBlindMode();
                  }}
                  onEvaluate={evaluate}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 화면 하단 슬림 플로팅 단축키 안내 바 (대본 로드 시 표시) */}
      {segments.length > 0 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-slate-200 px-4 py-2 rounded-full shadow-2xl border border-slate-700/70 backdrop-blur transition-all flex items-center gap-3 sm:gap-4 text-xs select-none">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono text-indigo-300 font-bold shadow-sm">Space</kbd>
            <span className="font-medium text-slate-300">녹음 / 완료</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono text-indigo-300 font-bold shadow-sm">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono text-indigo-300 font-bold shadow-sm">→</kbd>
            <span className="font-medium text-slate-300">이전 / 다음</span>
          </div>
          <span className="text-slate-700 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[11px] font-mono text-indigo-300 font-bold shadow-sm">B</kbd>
            <span className="font-medium text-slate-300">블라인드</span>
          </div>
          <button
            type="button"
            onClick={() => setShowShortcutModal(true)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline pl-1"
          >
            전체 보기
          </button>
        </div>
      )}

      {/* 키보드 단축키 상세 안내 모달 */}
      {showShortcutModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowShortcutModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-scaleUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">키보드 단축키 안내</h3>
                  <p className="text-xs text-slate-500">키보드로 마우스 없이 빠르게 훈련하세요</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-700 shadow-sm min-w-[56px] text-center">
                    Space
                  </kbd>
                  <span className="text-slate-700 font-medium">녹음 시작 / 녹음 완료 / 다시하기</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-700 shadow-sm min-w-[28px] text-center">
                      ←
                    </kbd>
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-700 shadow-sm min-w-[28px] text-center">
                      →
                    </kbd>
                  </div>
                  <span className="text-slate-700 font-medium">이전 구간 / 다음 구간 이동</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-700 shadow-sm min-w-[28px] text-center">
                    B
                  </kbd>
                  <span className="text-slate-700 font-medium">블라인드 모드 On / Off (흐림 효과 토글)</span>
                </div>
                <span className="text-[11px] text-slate-400">한글 'ㅠ' 지원</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-700 shadow-sm min-w-[28px] text-center">
                    ?
                  </kbd>
                  <span className="text-slate-700 font-medium">이 단축키 도움말 창 열기 / 닫기</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowShortcutModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                확인하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
