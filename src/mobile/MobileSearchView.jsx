import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Loader2,
  Folder,
  FileText,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { getFileIcon, formatBytes, formatDate } from '../utils/formatters.jsx';
import { triggerHaptic } from './native-bridge.js';

export default function MobileSearchView({
  currentPath = '/',
  onOpenItem,
  onNavigateToFolder,
}) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | folders | images | documents
  const [scope, setScope] = useState('current'); // current | root
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const abortControllerRef = useRef(null);

  const filterChips = [
    { id: 'all', label: 'Todos' },
    { id: 'folders', label: 'Carpetas' },
    { id: 'images', label: 'Imágenes' },
    { id: 'documents', label: 'Documentos' },
  ];

  const handleSearch = (searchTerm, searchScope = scope) => {
    const q = searchTerm.trim();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setResults([]);
    setIsSearching(true);
    setSearchDone(false);

    const basePath = searchScope === 'root' ? '/' : currentPath;
    const url = `/api/search?path=${encodeURIComponent(basePath)}&query=${encodeURIComponent(q)}`;

    // Use fetch with SSE stream reading
    fetch(url, {
      signal: controller.signal,
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Error al buscar');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep last incomplete line

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'item') {
                  setResults((prev) => [...prev, parsed.data]);
                } else if (parsed.type === 'done') {
                  setSearchDone(true);
                  setIsSearching(false);
                }
              } catch (e) {}
            }
          }
        }
        setIsSearching(false);
        setSearchDone(true);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error buscando:', err);
          setIsSearching(false);
        }
      });
  };

  const filteredResults = results.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'folders') return item.isDirectory;
    const ext = (item.name || '').split('.').pop().toLowerCase();
    if (filterType === 'images') {
      return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
    }
    if (filterType === 'documents') {
      return ['pdf', 'txt', 'doc', 'docx', 'md', 'json'].includes(ext);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111318]">
      {/* Top Search Bar */}
      <div className="p-3 bg-[#161820] border-b border-white/10 pt-[max(0.75rem,env(safe-area-inset-top))] space-y-2.5">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              handleSearch(val, scope);
            }}
            placeholder="Buscar por nombre de archivo..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all touch-target"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                triggerHaptic();
                setQuery('');
                setResults([]);
              }}
              className="absolute right-2 p-1.5 text-gray-400 hover:text-white rounded-lg touch-target flex items-center justify-center"
              aria-label="Borrar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Scope selector & Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => {
              triggerHaptic();
              const newScope = scope === 'current' ? 'root' : 'current';
              setScope(newScope);
              handleSearch(query, newScope);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors touch-target flex items-center gap-1 ${
              scope === 'current'
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            <span>{scope === 'current' ? 'En carpeta actual' : 'En todo el servidor'}</span>
          </button>

          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                triggerHaptic();
                setFilterType(chip.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-target ${
                filterType === chip.id
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-white/5 text-gray-400 active:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results or Empty State */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] pb-24">
        {isSearching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
            <p className="text-xs">Buscando archivos...</p>
          </div>
        )}

        {!isSearching && query && filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-3">
              <Search size={24} />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Sin resultados</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              No se han encontrado archivos que coincidan con "{query}".
            </p>
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 text-gray-500">
            <Search size={36} className="mb-2 opacity-30" />
            <p className="text-sm">Escribe algo para empezar a buscar</p>
            <p className="text-xs text-gray-600 mt-0.5">Búsqueda rápida en tiempo real con SSE</p>
          </div>
        )}

        {filteredResults.map((item) => (
          <div
            key={item.path}
            onClick={() => {
              triggerHaptic();
              onOpenItem(item);
            }}
            className="flex items-center min-h-[64px] px-3.5 py-2.5 active:bg-white/5 transition-colors touch-target select-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
              {getFileIcon(item, 24)}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-white truncate">{item.name}</p>
              <p className="text-xs text-gray-500 font-mono truncate">{item.path}</p>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                <span>{item.isDirectory ? 'Carpeta' : formatBytes(item.size)}</span>
                <span>•</span>
                <span>{formatDate(item.mtime)}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic();
                // Navigate to directory containing this item
                const parent = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
                onNavigateToFolder(parent);
              }}
              className="p-2 text-gray-400 hover:text-blue-400 rounded-lg touch-target flex items-center justify-center"
              title="Ir a carpeta contenedora"
              aria-label="Ir a carpeta"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
