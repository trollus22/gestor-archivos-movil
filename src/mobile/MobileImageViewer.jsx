import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { triggerHaptic, shareFile } from './native-bridge.js';

export default function MobileImageViewer({
  item,
  onClose,
  onDownload,
  imagesInFolder = [],
  onNavigateImage,
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  const containerRef = useRef(null);
  const initialDistance = useRef(null);
  const initialScale = useRef(1);
  const panStart = useRef(null);
  const lastTap = useRef(0);
  const swipeDownStart = useRef(null);

  if (!item) return null;

  const downloadUrl = `/api/download/file?path=${encodeURIComponent(item.path)}`;

  // Gestos táctiles
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinza (zoom)
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistance.current = dist;
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      // Doble toque para zoom
      if (now - lastTap.current < 300) {
        triggerHaptic();
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      if (scale > 1) {
        panStart.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        };
      } else {
        swipeDownStart.current = touch.clientY;
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialDistance.current;
      const newScale = Math.min(Math.max(initialScale.current * ratio, 0.8), 4);
      setScale(newScale);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (scale > 1 && panStart.current) {
        setPosition({
          x: touch.clientX - panStart.current.x,
          y: touch.clientY - panStart.current.y,
        });
      } else if (scale === 1 && swipeDownStart.current) {
        const diffY = touch.clientY - swipeDownStart.current;
        if (diffY > 120) {
          // Deslizar hacia abajo para cerrar
          triggerHaptic();
          onClose();
        }
      }
    }
  };

  const handleTouchEnd = () => {
    initialDistance.current = null;
    panStart.current = null;
    swipeDownStart.current = null;
    if (scale < 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleRotate = () => {
    triggerHaptic();
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Controls Bar */}
      <div className="z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={() => {
            triggerHaptic();
            onClose();
          }}
          className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full touch-target flex items-center justify-center"
          aria-label="Cerrar visor de imagen"
        >
          <X size={22} />
        </button>

        <div className="text-center px-2 flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <p className="text-[11px] text-gray-400">Pellizca para zoom • Desliza hacia abajo para cerrar</p>
        </div>

        <div className="w-10" />
      </div>

      {/* Main Image Area with Transforms */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <img
          src={downloadUrl}
          alt={item.name}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: panStart.current || initialDistance.current ? 'none' : 'transform 0.15s ease-out',
          }}
          className="max-h-full max-w-full object-contain pointer-events-none"
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className="z-10 flex items-center justify-around p-3 bg-gradient-to-t from-black/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          onClick={handleRotate}
          className="flex flex-col items-center gap-1 text-gray-300 hover:text-white p-2 touch-target"
          aria-label="Girar"
        >
          <RotateCw size={22} />
          <span className="text-[10px]">Girar</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            shareFile(item.name, 'Imagen compartida', window.location.origin + downloadUrl);
          }}
          className="flex flex-col items-center gap-1 text-gray-300 hover:text-white p-2 touch-target"
          aria-label="Compartir"
        >
          <Share2 size={22} />
          <span className="text-[10px]">Compartir</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onDownload(item);
          }}
          className="flex flex-col items-center gap-1 text-gray-300 hover:text-white p-2 touch-target"
          aria-label="Descargar"
        >
          <Download size={22} />
          <span className="text-[10px]">Descargar</span>
        </button>
      </div>
    </div>
  );
}
