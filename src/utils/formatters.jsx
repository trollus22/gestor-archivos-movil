import React from 'react';
import {
  Folder,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  File,
  HardDrive,
  Download,
  Trash2,
  Monitor,
  FolderArchive,
  ExternalLink,
} from 'lucide-react';

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || bytes === '0') return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return bytes + ' B';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
}

export function getFileTypeLabel(item) {
  if (item.isDirectory) return 'Carpeta de archivos';
  if (item.isSymlink) return 'Enlace simbólico';
  const name = item.name || '';
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

  const extMap = {
    pdf: 'Documento PDF',
    txt: 'Documento de texto',
    md: 'Documento Markdown',
    json: 'Archivo JSON',
    js: 'Archivo JavaScript',
    jsx: 'Archivo React JSX',
    ts: 'Archivo TypeScript',
    tsx: 'Archivo React TSX',
    html: 'Documento HTML',
    css: 'Hoja de estilos CSS',
    png: 'Imagen PNG',
    jpg: 'Imagen JPEG',
    jpeg: 'Imagen JPEG',
    gif: 'Imagen GIF',
    svg: 'Gráfico vectorial SVG',
    webp: 'Imagen WebP',
    mp4: 'Vídeo MP4',
    mkv: 'Vídeo MKV',
    webm: 'Vídeo WebM',
    mp3: 'Archivo de audio MP3',
    wav: 'Archivo de audio WAV',
    zip: 'Archivo comprimido ZIP',
    tar: 'Archivo comprimido TAR',
    gz: 'Archivo comprimido GZIP',
    tgz: 'Archivo comprimido TAR.GZ',
    sh: 'Script de Shell',
    py: 'Script de Python',
  };

  return extMap[ext] || (ext ? `Archivo ${ext.toUpperCase()}` : 'Archivo');
}

export function getFileIcon(item, size = 20) {
  if (item.isSymlink) {
    return <ExternalLink size={size} className="text-cyan-600" />;
  }

  if (item.isDirectory) {
    return <Folder size={size} className="text-amber-500 fill-amber-400/30" />;
  }

  const name = (item.name || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return <ImageIcon size={size} className="text-blue-500" />;
  }
  if (['mp4', 'mkv', 'webm', 'avi', 'mov'].includes(ext)) {
    return <VideoIcon size={size} className="text-purple-500" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
    return <MusicIcon size={size} className="text-rose-500" />;
  }
  if (['zip', 'tar', 'gz', 'tgz', 'rar', '7z', 'bz2'].includes(ext)) {
    return <FolderArchive size={size} className="text-amber-600" />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'sh', 'sql', 'php', 'c', 'cpp', 'rs', 'go'].includes(ext)) {
    return <FileCode size={size} className="text-emerald-600" />;
  }
  if (['txt', 'md', 'log', 'rtf', 'doc', 'docx'].includes(ext)) {
    return <FileText size={size} className="text-sky-600" />;
  }
  if (['pdf'].includes(ext)) {
    return <FileText size={size} className="text-red-500" />;
  }

  return <File size={size} className="text-slate-500" />;
}
