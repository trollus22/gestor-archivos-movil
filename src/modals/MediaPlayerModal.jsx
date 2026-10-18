import React from 'react';
import { X, Download } from 'lucide-react';

export default function MediaPlayerModal({ filePath, fileName, isVideo, onClose }) {
  const mediaUrl = `/api/download/file?path=${encodeURIComponent(filePath)}&inline=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none">
      {/* Cabecera */}
      <div className="w-full flex items-center justify-between text-white text-xs px-4 py-2">
        <span className="font-semibold truncate max-w-md">{fileName}</span>
        <div className="flex items-center space-x-2">
          <a
            href={mediaUrl}
            download={fileName}
            className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors"
            title="Descargar"
          >
            <Download size={16} />
          </a>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Reproductor */}
      <div className="flex-1 w-full flex items-center justify-center p-4">
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[75vh] max-w-[85vw] rounded-xl shadow-2xl bg-black"
          />
        ) : (
          <div className="bg-white/10 p-6 rounded-2xl flex flex-col items-center shadow-xl">
            <div className="text-4xl mb-4">🎵</div>
            <span className="text-white font-medium text-sm mb-4">{fileName}</span>
            <audio src={mediaUrl} controls autoPlay className="w-80" />
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}
