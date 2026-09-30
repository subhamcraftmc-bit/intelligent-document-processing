import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

interface DocumentViewerProps {
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl,
  fileType,
  fileName
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const safeFileType = (fileType || '').toLowerCase();
  const safeFileName = fileName || 'Document';
  const safeFileUrl = fileUrl || '';

  const isPdf = safeFileType.includes('pdf') || safeFileName.toLowerCase().endsWith('.pdf');
  const isImage = safeFileType.includes('image') || /\.(png|jpe?g|webp|gif|svg)$/i.test(safeFileName);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div
      className={`flex flex-col h-full bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-950' : 'relative'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          {isPdf ? (
            <FileText className="w-4 h-4 text-brand-400 shrink-0" />
          ) : (
            <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-300 truncate" title={fileName}>
            {fileName}
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
            {isPdf ? 'PDF' : isImage ? 'IMAGE' : 'DOC'}
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="px-2 py-1 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {safeFileUrl && (
            <a
              href={safeFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Document View Canvas */}
      <div className="flex-1 overflow-auto bg-[#05070a] p-4 flex items-center justify-center relative min-h-[480px]">
        {!safeFileUrl ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
            <FileText className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300 mb-1">Document Link Pending</p>
            <p className="text-xs text-slate-500">
              The storage signature or preview URL for this file is currently being generated.
            </p>
          </div>
        ) : isPdf ? (
          <div className="w-full h-full min-h-[550px] flex items-center justify-center">
            <object
              data={`${safeFileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="w-full h-full min-h-[550px] rounded-lg border border-slate-800/80 shadow-2xl bg-white"
            >
              {/* Fallback if browser PDF plugin is disabled */}
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-16 h-16 text-brand-400 mb-4 animate-bounce" />
                <p className="text-sm font-medium text-slate-200 mb-2">PDF Document Ready</p>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Native PDF embedding is disabled or loading. Click below to view the original PDF document.
                </p>
                <a
                  href={safeFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Document PDF
                </a>
              </div>
            </object>
          </div>
        ) : (
          <div
            className="transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={safeFileUrl}
              alt={safeFileName}
              className="max-h-[700px] max-w-full rounded-lg shadow-2xl object-contain border border-slate-800"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
