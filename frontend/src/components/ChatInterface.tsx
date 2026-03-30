"use client";

import { useState, useRef } from "react";
import { Send, FileUp, Download, Loader2, Sparkles, Table, FileText, Presentation, Eye, X } from "lucide-react";
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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI office assistant. I can help you create Excel spreadsheets, Word documents, and PowerPoint presentations. What would you like to create?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [generatedFile, setGeneratedFile] = useState<GeneratedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setUploadedFiles((prev) => [...prev, ...files]),
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/csv": [".csv"],
      "application/pdf": [".pdf"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input;
    setInput("");
    setGeneratedFile(null);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isLoading: true },
    ]);

    setIsGenerating(true);
    setTasks([]);

    try {
      // Upload files first if any
      const fileIds: string[] = [];
      
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileIds.push(uploadData.file_id);
        }
      }

      console.log("Sending request:", { prompt: userMessage, file_ids: fileIds });
      
      // Send generation request
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          file_ids: fileIds,
          output_format: "auto",
        }),
      });

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      const data = JSON.parse(responseText);
      console.log("Parsed data:", data);

      if (data.status === "completed") {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: data.message || "Your document has been generated successfully!",
          };
          return newMessages;
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
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: `Error: ${data.error || "Failed to generate document"}`,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Frontend error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        };
        return newMessages;
      });
    } finally {
      setIsGenerating(false);
      setUploadedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <Table className="w-5 h-5 text-green-600" />;
    }
    if (mimeType.includes("wordprocessing") || mimeType.includes("word")) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return <Presentation className="w-5 h-5 text-orange-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handlePreview = async () => {
    if (!generatedFile?.file_id) return;
    
    setIsPreviewLoading(true);
    try {
      const preview = await getFilePreview(generatedFile.file_id);
      setPreviewData(preview);
    } catch (error) {
      console.error("Failed to load preview:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewData(null);
  };

  const renderPreviewContent = () => {
    if (!previewData) return null;

    if (previewData.format === "word" && previewData.content_preview) {
      return (
        <div className="space-y-4">
          {previewData.structure_preview && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Document Structure</h4>
              <p className="text-xs text-slate-600">{previewData.structure_preview.paragraph_count} paragraphs</p>
              {previewData.structure_preview.sections && previewData.structure_preview.sections.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {previewData.structure_preview.sections.map((section, idx) => (
                    <li key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{section.level}</span>
                      <span className="truncate">{section.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Content Preview</h4>
            <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
                {previewData.content_preview}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (previewData.format === "excel" && previewData.structure_preview?.sheets) {
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-700">Excel Workbook</h4>
            <p className="text-xs text-slate-600">{previewData.structure_preview.sheet_count} sheets</p>
          </div>
          {previewData.structure_preview.sheets.map((sheet, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700">{sheet.name}</span>
                <span className="text-xs text-slate-500 ml-2">({sheet.row_count} rows × {sheet.column_count} cols)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <tbody>
                    {sheet.data.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 border-b border-slate-100 text-slate-700">
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
      );
    }

    if (previewData.format === "powerpoint" && previewData.structure_preview?.slides) {
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-700">Presentation</h4>
            <p className="text-xs text-slate-600">{previewData.structure_preview.slide_count} slides</p>
          </div>
          <div className="grid gap-3">
            {previewData.structure_preview.slides.map((slide, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                    Slide {slide.slide_number}
                  </span>
                  <span className="text-xs text-slate-500">{slide.layout}</span>
                </div>
                {slide.text.map((text, textIdx) => (
                  <p key={textIdx} className="text-xs text-slate-700 mt-1 line-clamp-2">{text}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-slate-500">
        <p>No preview available for this file type.</p>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Agent Progress */}
      {tasks.length > 0 && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Agent Progress</h3>
          <div className="space-y-2">
            {tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    task.status === "completed"
                      ? "bg-green-500"
                      : task.status === "in_progress"
                      ? "bg-blue-500 animate-pulse"
                      : "bg-slate-300"
                  }`}
                />
                <span className="text-sm text-slate-600">{task.agent_name}</span>
                {task.status === "in_progress" && (
                  <span className="text-xs text-slate-400">{task.progress_percent}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-4">
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating your document...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {/* Generated File Card */}
          {generatedFile && (
            <div className="flex justify-start">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center gap-3 mb-3">
                  {getFileIcon(generatedFile.mime_type)}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{generatedFile.filename}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(generatedFile.size)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {isPreviewLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    Preview
                  </button>
                  <a
                    href={generatedFile.download_url}
                    download={generatedFile.filename}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Area */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs"
                >
                  <FileUp className="w-3 h-3" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() =>
                      setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-slate-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create... (e.g., 'Create a sales report with Q4 data')"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                disabled={isGenerating}
              />
              
              {/* Drop Zone */}
              <div
                {...getRootProps()}
                className={`mt-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <FileUp className="w-4 h-4" />
                  <span>
                    {isDragActive
                      ? "Drop files here..."
                      : "Drag & drop files, or click to select"}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 mr-2">Try:</span>
            {[
              "Create a sales spreadsheet with Q4 data",
              "Generate a project proposal document",
              "Make a monthly report presentation",
              "Build a budget tracker with formulas",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                disabled={isGenerating}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
          <Table className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Excel Spreadsheets</h3>
          <p className="text-sm text-slate-600 mt-1">
            Generate spreadsheets with formulas, charts, and professional formatting
          </p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
          <FileText className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold text-slate-900">Word Documents</h3>
          <p className="text-sm text-slate-600 mt-1">
            Create reports, letters, and professional documents with proper styling
          </p>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
          <Presentation className="w-8 h-8 text-orange-600 mb-2" />
          <h3 className="font-semibold text-slate-900">PowerPoint Decks</h3>
          <p className="text-sm text-slate-600 mt-1">
            Build presentations with slides, charts, and consistent design
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Document Preview</h3>
                <p className="text-sm text-slate-500">{previewData.filename}</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {renderPreviewContent()}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={closePreview}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              {generatedFile && (
                <a
                  href={generatedFile.download_url}
                  download={generatedFile.filename}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
