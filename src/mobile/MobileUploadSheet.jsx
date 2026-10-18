import React from 'react';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  FolderPlus,
  FilePlus,
  X,
} from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobileUploadSheet({
  isOpen,
  onClose,
  onTakePhoto,
  onPickGallery,
  onPickFiles,
  onCreateFolder,
  onCreateFile,
}) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'camera',
      icon: Camera,
      title: 'Tomar foto con la cámara',
      subtitle: 'Capturar y subir imagen inmediatamente',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      onClick: onTakePhoto,
    },
    {
      id: 'gallery',
      icon: ImageIcon,
      title: 'Subir desde la Galería',
      subtitle: 'Fotos y vídeos guardados en el dispositivo',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      onClick: onPickGallery,
    },
    {
      id: 'files',
      icon: Upload,
      title: 'Subir archivos del dispositivo',
      subtitle: 'Documentos, zip, apk, pdf o cualquier fichero',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      onClick: onPickFiles,
    },
    {
      id: 'folder',
      icon: FolderPlus,
      title: 'Nueva carpeta',
      subtitle: 'Crear directorio en la ruta actual',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      onClick: onCreateFolder,
    },
    {
      id: 'file',
      icon: FilePlus,
      title: 'Nuevo archivo de texto',
      subtitle: 'Crear archivo vacío para editar en pantalla',
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      onClick: onCreateFile,
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-[#181a24] border-t border-white/10 rounded-t-3xl p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between px-2 mb-3">
          <h2 className="text-base font-semibold text-white">Añadir a esta carpeta</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-full touch-target flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  triggerHaptic();
                  onClose();
                  act.onClick();
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl active:bg-white/5 transition-colors touch-target text-left"
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${act.color}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100">{act.title}</p>
                  <p className="text-xs text-gray-400 truncate">{act.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
