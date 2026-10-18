import React, { useRef, useState } from 'react';
import { X, Download, Play, Pause, Volume2, Music, Video as VideoIcon } from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobileMediaViewer({ item, type = 'video', onClose, onDownload }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef(null);

  if (!item) return null;
  const mediaUrl = `/api/download/file?path=${encodeURIComponent(item.path)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => {
            triggerHaptic();
            onClose();
          }}
          className="p-2.5 bg-white/10 text-white rounded-full touch-target flex items-center justify-center"
          aria-label="Cerrar reproductor"
        >
          <X size={22} />
        </button>
        <div className="text-center px-3 flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <p className="text-[11px] text-gray-400">{type === 'video' ? 'Vídeo' : 'Audio'}</p>
        </div>
        <button
          onClick={() => {
            triggerHaptic();
            onDownload(item);
          }}
          className="p-2.5 bg-white/10 text-white rounded-full touch-target flex items-center justify-center"
          aria-label="Descargar"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {type === 'video' ? (
          <video
            ref={mediaRef}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[75dvh] max-w-full rounded-xl shadow-2xl"
          />
        ) : (
          <div className="w-full max-w-sm bg-[#1a1d26] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Music size={40} />
            </div>
            <h3 className="text-base font-semibold text-white truncate max-w-full mb-1">{item.name}</h3>
            <p className="text-xs text-gray-400 mb-6 font-mono">Reproducción de audio del servidor</p>
            <audio
              ref={mediaRef}
              src={mediaUrl}
              controls
              autoPlay
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Bottom Safe area buffer */}
      <div className="pb-[max(1rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
