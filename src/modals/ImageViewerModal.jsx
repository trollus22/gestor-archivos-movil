import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, Download } from 'lucide-react';

export default function ImageViewerModal({ filePath, fileName, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const imageUrl = `/api/download/file?path=${encodeURIComponent(filePath)}&inline=true`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none">
      {/* Barra superior */}
      <div className="w-full flex items-center justify-between text-white text-xs px-4 py-2">
        <span className="font-semibold truncate max-w-md">{fileName}</span>
        <div className="flex items-center space-x-2">
          <a
            href={imageUrl}
            download={fileName}
            className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors"
            title="Descargar imagen"
          >
            <Download size={16} />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors"
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Imagen centrada */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={fileName}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out',
          }}
          className="max-h-[75vh] max-w-[85vw] object-contain shadow-2xl rounded"
        />
      </div>

      {/* Barra de herramientas flotante inferior */}
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center space-x-4 text-white text-xs shadow-lg mb-4">
        <button onClick={handleZoomOut} className="hover:text-fluent-blue transition-colors" title="Alejar">
          <ZoomOut size={16} />
        </button>
        <span className="font-mono text-[11px] w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="hover:text-fluent-blue transition-colors" title="Acercar">
          <ZoomIn size={16} />
        </button>
        <div className="h-4 w-px bg-white/20" />
        <button onClick={handleRotate} className="hover:text-fluent-blue transition-colors" title="Rotar 90°">
          <RotateCw size={16} />
        </button>
        <button onClick={handleReset} className="hover:text-fluent-blue text-[11px] font-medium" title="Restablecer">
          Restablecer
        </button>
      </div>
    </div>
  );
}
