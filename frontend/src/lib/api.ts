// API client for the AI Office Suite backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GenerationRequest {
  prompt: string;
  output_format?: "excel" | "word" | "powerpoint" | "auto";
  file_ids?: string[];
  options?: Record<string, unknown>;
}

export interface GenerationResponse {
  workflow_id: string;
  status: string;
  message: string;
  download_url?: string;
  preview_data?: {
    filename: string;
    size: number;
    mime_type: string;
  };
  error?: string;
}

export interface FormulaRequest {
  description: string;
  context?: {
    sheet_name?: string;
    columns?: Array<{ name: string; type: string }>;
    data_sample?: unknown[];
  };
  cell_reference?: string;
}

export interface FormulaResponse {
  formula: string;
  explanation: string;
  suggested_named_ranges: Record<string, string>;
  cell_reference?: string;
}

export async function generateDocument(
  request: GenerationRequest
): Promise<GenerationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate document: ${response.statusText}`);
  }

  return response.json();
}

export async function generateFormula(
  request: FormulaRequest
): Promise<FormulaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/formula/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate formula: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadFile(file: File): Promise<{
  file_id: string;
  filename: string;
  size: number;
  mime_type: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  return response.json();
}

export interface PreviewResponse {
  filename: string;
  mime_type: string;
  size: number;
  format: "word" | "excel" | "powerpoint" | "unknown";
  content_preview?: string;
  structure_preview?: {
    title?: string;
    paragraph_count?: number;
    table_count?: number;
    sections?: Array<{ level: string; text: string }>;
    sheet_count?: number;
    sheets?: Array<{
      name: string;
      row_count: number;
      column_count: number;
      data: string[][];
    }>;
    slide_count?: number;
    slides?: Array<{
      slide_number: number;
      layout: string;
      text: string[];
    }>;
  };
}

export async function getFilePreview(fileId: string): Promise<PreviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/preview/${fileId}`);

  if (!response.ok) {
    throw new Error(`Failed to get file preview: ${response.statusText}`);
  }

  return response.json();
}

export async function getWorkflowStatus(workflowId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/api/workflow/${workflowId}`);

  if (!response.ok) {
    throw new Error(`Failed to get workflow status: ${response.statusText}`);
  }

  return response.json();
}

export function generateDocumentStream(
  request: GenerationRequest,
  onEvent: (event: unknown) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): () => void {
  const eventSource = new EventSource(
    `${API_BASE_URL}/api/generate/stream`,
    { withCredentials: false }
  );

  // For POST requests with EventSource, we need to use fetch with ReadableStream
  // This is a simplified version - in production, use a proper SSE client
  const abortController = new AbortController();

  fetch(`${API_BASE_URL}/api/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to start stream: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onComplete?.();
              return;
            }
            try {
              const event = JSON.parse(data);
              onEvent(event);
            } catch {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }

      onComplete?.();
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        onError?.(error);
      }
    });

  return () => abortController.abort();
}
