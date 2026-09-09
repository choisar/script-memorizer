export type SegmentType = "chapter" | "paragraph" | "sentence";

export interface ScriptSegment {
  id: string;
  type: SegmentType;
  content: string;
  children: ScriptSegment[];
}

export interface UploadDocumentResponse {
  filename: string;
  total_segments: number;
  segments: ScriptSegment[];
}

export type DiffType = "equal" | "insert" | "delete";

export interface DiffChunk {
  type: DiffType;
  text: string;
}

export interface EvaluateResponse {
  original_text: string;
  transcribed_text: string;
  accuracy: number;
  diffs: DiffChunk[];
}
