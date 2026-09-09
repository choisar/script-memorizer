"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderStatus = "idle" | "recording" | "stopping";

interface UseMediaRecorderReturn {
  status: RecorderStatus;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  liveTranscript: string;
  interimTranscript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ blob: Blob | null; transcript: string }>;
  resetRecording: () => void;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [duration, setDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>("");

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);
    setLiveTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("현재 브라우저 환경에서 마이크 녹음을 지원하지 않습니다.");
      }

      // 1. Web Speech API (실시간 음성 텍스트 변환) 초기화
      const windowObj = typeof window !== "undefined" ? (window as any) : null;
      const SpeechRecognitionClass =
        windowObj?.SpeechRecognition || windowObj?.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "ko-KR";

          recognition.onresult = (event: any) => {
            let finalStr = "";
            let interimStr = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptPiece = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalStr += transcriptPiece + " ";
              } else {
                interimStr += transcriptPiece;
              }
            }

            if (finalStr) {
              accumulatedTranscriptRef.current = (
                accumulatedTranscriptRef.current + " " + finalStr
              ).trim();
              setLiveTranscript(accumulatedTranscriptRef.current);
            }
            setInterimTranscript(interimStr);
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition warning:", event.error);
          };

          recognition.onend = () => {
            // 녹음 중인데 예기치 않게 recognition이 종료된 경우 재시작 시도
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                recognition.start();
              } catch (e) {
                // ignore
              }
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (recognitionErr) {
          console.warn("SpeechRecognition 초기화 실패 (MediaRecorder로 계속 진행):", recognitionErr);
        }
      }

      // 2. MediaRecorder (오디오 파일 생성) 초기화
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const selectedMimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200); // 200ms 단위 수집
      setStatus("recording");

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("녹음 시작 실패:", err);
      const message =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해주세요."
          : err.message || "마이크 녹음을 시작할 수 없습니다.";
      setError(message);
      setStatus("idle");
    }
  }, []);

  const stopRecording = useCallback((): Promise<{ blob: Blob | null; transcript: string }> => {
    return new Promise((resolve) => {
      // 실시간 음성 인식 중지
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        speechRecognitionRef.current = null;
      }

      const finalTrans = (accumulatedTranscriptRef.current + " " + interimTranscript).trim();

      if (!mediaRecorderRef.current || status !== "recording") {
        resolve({ blob: null, transcript: finalTrans });
        return;
      }

      setStatus("stopping");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recorder = mediaRecorderRef.current;

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setStatus("idle");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        resolve({ blob, transcript: finalTrans });
      };

      recorder.stop();
    });
  }, [status, interimTranscript]);

  const resetRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioBlob(null);
    setDuration(0);
    setLiveTranscript("");
    setInterimTranscript("");
    accumulatedTranscriptRef.current = "";
    setStatus("idle");
    setError(null);
  }, []);

  return {
    status,
    duration,
    audioBlob,
    error,
    liveTranscript,
    interimTranscript,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
