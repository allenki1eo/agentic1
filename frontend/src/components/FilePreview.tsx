"use client";

import { Download, FileSpreadsheet, FileText, Presentation, X } from "lucide-react";

interface FilePreviewProps {
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  onClose?: () => void;
}

export default function FilePreview({
  filename,
  mimeType,
  size,
  downloadUrl,
  onClose,
}: FilePreviewProps) {
  const getFileIcon = () => {
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return <FileSpreadsheet className="w-12 h-12 text-green-600" />;
    }
    if (mimeType.includes("wordprocessing") || mimeType.includes("word")) {
      return <FileText className="w-12 h-12 text-blue-600" />;
    }
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      return <Presentation className="w-12 h-12 text-orange-600" />;
    }
    return <FileText className="w-12 h-12 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {getFileIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">{filename}</h3>
            <p className="text-sm text-gray-500">{formatFileSize(size)}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="mt-4 flex gap-2">
        <a
          href={downloadUrl}
          download={filename}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>
    </div>
  );
}
