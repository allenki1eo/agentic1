"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, FileUp, Download, Loader2, Sparkles, Table, FileText,
  Presentation, Eye, X, Bot, User, CheckCircle2, Clock,
  AlertCircle, Edit2, RefreshCw, ChevronDown, Paperclip, Zap,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { getFilePreview, type PreviewResponse } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

interface AgentTask {
  agent_name: string;
  status: string;
  progress_percent: number;
}

interface GeneratedFile {
  filename: string;
  download_url: string;
  mime_type: string;
  size: number;
  file_id?: string;
}

/* ───────────────────────── helpers ───────────────────────── */

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function FileIcon({ mimeType, className = "w-5 h-5" }: { mimeType: string; className?: string }) {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <Table className={`${className} text-emerald-500`} />;
  if (mimeType.includes("wordprocessing") || mimeType.includes("word"))
    return <FileText className={`${className} text-blue-500`} />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return <Presentation className={`${className} text-orange-500`} />;
  return <FileText className={`${className} text-slate-500`} />;
}

/* ───────────────────── typing dots ───────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

/* ─────────────────── agent progress bar ──────────────────── */

function AgentProgressPanel({ tasks }: { tasks: AgentTask[] }) {
  if (!tasks.length) return null;

  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    in_progress: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />,
    failed: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
    pending: <Clock className="w-3.5 h-3.5 text-slate-400" />,
  };

  return (
    <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 animate-fade-in">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Agent Pipeline
      </p>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {icons[task.status] ?? icons.pending}
            <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{task.agent_name}</span>
            {task.status === "in_progress" && (
              <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${task.progress_percent || 30}%` }}
                />
              </div>
            )}
            {task.status === "completed" && (
              <span className="text-[10px] text-emerald-500 font-medium">Done</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── preview modal ──────────────────────── */

function PreviewModal({
  data,
  generatedFile,
  onClose,
}: {
  data: PreviewResponse;
  generatedFile: GeneratedFile | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {generatedFile && <FileIcon mimeType={generatedFile.mime_type} className="w-6 h-6" />}
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Document Preview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{data.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {data.format === "word" && (
            <div className="space-y-4">
              {data.structure_preview && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                    Document Structure
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {data.structure_preview.paragraph_count} paragraphs · {data.structure_preview.table_count ?? 0} tables
                  </p>
                  {data.structure_preview.sections && data.structure_preview.sections.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {data.structure_preview.sections.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-[10px] font-medium">
                            {s.level.replace("Heading ", "H")}
                          </span>
                          {s.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {data.content_preview && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Content
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-80 overflow-y-auto scrollbar-thin">
                    <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {data.content_preview}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {data.format === "excel" && data.structure_preview?.sheets && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
                  Workbook
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {data.structure_preview.sheet_count} sheet{(data.structure_preview.sheet_count ?? 1) > 1 ? "s" : ""}
                </p>
              </div>
              {data.structure_preview.sheets.map((sheet, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <Table className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{sheet.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                      {sheet.row_count} × {sheet.column_count}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <tbody>
                        {sheet.data.map((row, ri) => (
                          <tr
                            key={ri}
                            className={ri === 0
                              ? "bg-slate-50 dark:bg-slate-800 font-semibold"
                              : ri % 2 === 0
                                ? "bg-white dark:bg-slate-800/50"
                                : "bg-slate-50/60 dark:bg-slate-900/40"
                            }
                          >
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="px-3 py-2 border-b border-r border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.format === "powerpoint" && data.structure_preview?.slides && (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">
                  Presentation
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {data.structure_preview.slide_count} slide{(data.structure_preview.slide_count ?? 1) > 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid gap-3">
                {data.structure_preview.slides.map((slide, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-bold">
                        {slide.slide_number}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{slide.layout}</span>
                    </div>
                    {slide.text.map((t, ti) => (
                      <p key={ti} className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mt-1">{t}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.format === "unknown" || (!data.structure_preview && !data.content_preview)) && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <FileText className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No preview available for this file type.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          {generatedFile && (
            <a
              href={generatedFile.download_url}
              download={generatedFile.filename}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── generated file card ─────────────────── */

function GeneratedFileCard({
  file,
  onPreview,
  onEdit,
  isPreviewLoading,
}: {
  file: GeneratedFile;
  onPreview: () => void;
  onEdit: () => void;
  isPreviewLoading: boolean;
}) {
  const isExcel = file.mime_type.includes("spreadsheet") || file.mime_type.includes("excel");
  const isWord = file.mime_type.includes("wordprocessing") || file.mime_type.includes("word");
  const accent = isExcel ? "emerald" : isWord ? "blue" : "orange";

  const accentClasses: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800/60",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800/60",
    orange: "from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800/60",
  };

  return (
    <div
      className={`bg-gradient-to-br ${accentClasses[accent]} border rounded-xl p-4 max-w-sm animate-slide-up`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <FileIcon mimeType={file.mime_type} className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{file.filename}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onPreview}
          disabled={isPreviewLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          {isPreviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
          Preview
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
        <a
          href={file.download_url}
          download={file.filename}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-3 h-3" />
          Download
        </a>
      </div>
    </div>
  );
}

/* ──────────────────────── edit panel ─────────────────────── */

function EditPanel({
  file,
  onSubmit,
  onCancel,
  isEditing,
}: {
  file: GeneratedFile;
  onSubmit: (instructions: string) => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  const [instructions, setInstructions] = useState("");

  return (
    <div className="border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 max-w-xl animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Edit2 className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Edit: <span className="font-normal text-slate-500 dark:text-slate-400">{file.filename}</span>
        </p>
      </div>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Describe your changes… e.g. 'Add a totals row', 'Change title to Q2 Report', 'Add an executive summary section'"
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={3}
        disabled={isEditing}
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => instructions.trim() && onSubmit(instructions.trim())}
          disabled={!instructions.trim() || isEditing}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Apply Changes
        </button>
        <button
          onClick={onCancel}
          disabled={isEditing}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ───────────────────── main component ────────────────────── */

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI office assistant. I can create Excel spreadsheets, Word documents, and PowerPoint presentations. What would you like to build today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [generatedFile, setGeneratedFile] = useState<GeneratedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<GeneratedFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages, generatedFile]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setUploadedFiles((prev) => [...prev, ...files]),
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
    },
    maxSize: 50 * 1024 * 1024,
    noClick: false,
  });

  const runGenerate = async (prompt: string, fileIds: string[] = []) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt },
      { role: "assistant", content: "", isLoading: true },
    ]);
    setIsGenerating(true);
    setTasks([]);
    setGeneratedFile(null);

    try {
      // Upload any pending files
      const uploadedIds = [...fileIds];
      for (const file of uploadedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const d = await res.json();
          uploadedIds.push(d.file_id);
        }
      }
      setUploadedFiles([]);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, file_ids: uploadedIds, output_format: "auto" }),
      });

      const data = await response.json();

      if (data.status === "completed") {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: data.message || "Your document has been generated successfully!",
          };
          return next;
        });

        if (data.download_url && data.preview_data) {
          const fileId = data.download_url.split("/").pop() || "";
          setGeneratedFile({
            filename: data.preview_data.filename,
            download_url: data.download_url,
            mime_type: data.preview_data.mime_type,
            size: data.preview_data.size,
            file_id: fileId,
          });
        }
      } else {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: `Sorry, I couldn't complete that request: ${data.error || "Unknown error"}`,
          };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please check your connection and try again.",
        };
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;
    setInput("");
    await runGenerate(prompt);
  };

  const handleEdit = async (instructions: string) => {
    if (!editingFile?.file_id) return;
    setIsEditing(true);

    try {
      const response = await fetch(`/api/edit/${editingFile.file_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });

      const data = await response.json();

      if (data.status === "completed" && data.download_url && data.preview_data) {
        const fileId = data.download_url.split("/").pop() || "";
        const newFile: GeneratedFile = {
          filename: data.preview_data.filename,
          download_url: data.download_url,
          mime_type: data.preview_data.mime_type,
          size: data.preview_data.size,
          file_id: fileId,
        };
        setGeneratedFile(newFile);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Document updated successfully: ${data.preview_data.filename}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Edit failed: ${data.error || "Unknown error"}`,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Edit request failed. Please try again." },
      ]);
    } finally {
      setIsEditing(false);
      setEditingFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePreview = async () => {
    if (!generatedFile?.file_id) return;
    setIsPreviewLoading(true);
    try {
      const preview = await getFilePreview(generatedFile.file_id);
      setPreviewData(preview);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const SUGGESTIONS = [
    { label: "Sales spreadsheet Q4", icon: <Table className="w-3 h-3" /> },
    { label: "Project proposal document", icon: <FileText className="w-3 h-3" /> },
    { label: "Monthly report presentation", icon: <Presentation className="w-3 h-3" /> },
    { label: "Budget tracker with formulas", icon: <Zap className="w-3 h-3" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Agent Progress */}
      <AgentProgressPanel tasks={tasks} />

      {/* Chat Window */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
        {/* Chat header bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Office Assistant</span>
          </div>
          <div className="ml-auto flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-[480px] overflow-y-auto p-5 space-y-4 scrollbar-thin relative"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-700"
                    : "bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700"
                }`}
              >
                {msg.role === "user"
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-tr-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm"
                }`}
              >
                {msg.isLoading ? <TypingDots /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
            </div>
          ))}

          {/* Generated File */}
          {generatedFile && (
            <div className="flex flex-col gap-3 pl-11 animate-slide-up">
              <GeneratedFileCard
                file={generatedFile}
                onPreview={handlePreview}
                onEdit={() => setEditingFile(generatedFile)}
                isPreviewLoading={isPreviewLoading}
              />
              {editingFile?.file_id === generatedFile.file_id && (
                <EditPanel
                  file={editingFile}
                  onSubmit={handleEdit}
                  onCancel={() => setEditingFile(null)}
                  isEditing={isEditing}
                />
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-40 right-8 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full shadow-md text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all animate-fade-in"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Attached files */}
        {uploadedFiles.length > 0 && (
          <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
            {uploadedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-300"
              >
                <Paperclip className="w-3 h-3 text-slate-400" />
                <span className="max-w-[130px] truncate">{f.name}</span>
                <button
                  onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div
            {...getRootProps()}
            onClick={(e) => e.stopPropagation()}
            className={`flex gap-2 items-end p-2 rounded-xl border-2 transition-all ${
              isDragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 focus-within:border-blue-400 dark:focus-within:border-blue-500"
            }`}
          >
            <input {...getInputProps()} />
            <label
              className="flex-shrink-0 cursor-pointer p-2 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Attach file"
              onClick={(e) => { e.stopPropagation(); (e.currentTarget.previousSibling as HTMLInputElement)?.click(); }}
            >
              <Paperclip className="w-4 h-4" />
            </label>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDragActive ? "Drop files here…" : "Describe what you want to create…"}
              className="flex-1 bg-transparent resize-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none max-h-32 min-h-[40px]"
              rows={1}
              disabled={isGenerating}
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isGenerating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => setInput(s.label)}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Table className="w-7 h-7 text-emerald-500" />,
            title: "Excel Spreadsheets",
            desc: "Generate spreadsheets with formulas, charts, and professional formatting",
            accent: "hover:border-emerald-300 dark:hover:border-emerald-700",
          },
          {
            icon: <FileText className="w-7 h-7 text-blue-500" />,
            title: "Word Documents",
            desc: "Create reports, proposals, and professional documents with styling",
            accent: "hover:border-blue-300 dark:hover:border-blue-700",
          },
          {
            icon: <Presentation className="w-7 h-7 text-orange-500" />,
            title: "PowerPoint Decks",
            desc: "Build presentations with slides, charts, and consistent design",
            accent: "hover:border-orange-300 dark:hover:border-orange-700",
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`p-5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md ${card.accent}`}
          >
            <div className="p-2 w-fit bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-3">{card.icon}</div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{card.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewData && (
        <PreviewModal
          data={previewData}
          generatedFile={generatedFile}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
