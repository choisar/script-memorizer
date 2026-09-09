import { UploadDocumentResponse, EvaluateResponse } from "@/types";

const getApiBase = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  url = url.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

const API_BASE = getApiBase();

/**
 * 대본 문서를 백엔드에 업로드하여 파싱된 계층 구조를 받아옵니다.
 */
export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/upload-document`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "업로드 실패" }));
    throw new Error(errorData.detail || `업로드 오류: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 직접 입력하거나 붙여넣은 텍스트를 백엔드로 전송하여 파싱된 계층 구조를 받아옵니다.
 */
export async function parseText(text: string, title?: string): Promise<UploadDocumentResponse> {
  const response = await fetch(`${API_BASE}/api/parse-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      title: title || "직접 입력한 대본",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "파싱 실패" }));
    throw new Error(errorData.detail || `텍스트 파싱 오류: ${response.statusText}`);
  }

  return response.json();
}


/**
 * 녹음된 오디오 Blob과 원본 텍스트, 그리고 실시간 전사 텍스트를 전송하여 STT + Diff 비교 결과를 받아옵니다.
 */
export async function evaluateAudio(
  audioBlob: Blob,
  originalText: string,
  liveTranscribedText?: string,
  filename: string = "recording.webm"
): Promise<EvaluateResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  formData.append("original_text", originalText);
  if (liveTranscribedText) {
    formData.append("live_transcribed_text", liveTranscribedText);
  }

  const response = await fetch(`${API_BASE}/api/evaluate-audio`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "평가 실패" }));
    throw new Error(errorData.detail || `평가 오류: ${response.statusText}`);
  }

  return response.json();
}
