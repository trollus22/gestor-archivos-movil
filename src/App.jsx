import React, { useState, useEffect, useRef, useCallback } from 'react';
import MobileHeader from './mobile/MobileHeader.jsx';
import MobileFileList from './mobile/MobileFileList.jsx';
import MobileBottomNav from './mobile/MobileBottomNav.jsx';
import MobileFAB from './mobile/MobileFAB.jsx';
import MobileUploadSheet from './mobile/MobileUploadSheet.jsx';
import MobileUploadProgress from './mobile/MobileUploadProgress.jsx';
import MobileActionSheet from './mobile/MobileActionSheet.jsx';
import MobileBatchBar from './mobile/MobileBatchBar.jsx';
import MobileSearchView from './mobile/MobileSearchView.jsx';
import MobileTrashView from './mobile/MobileTrashView.jsx';
import MobileSettingsView from './mobile/MobileSettingsView.jsx';
import MobileImageViewer from './mobile/MobileImageViewer.jsx';
import MobileMediaViewer from './mobile/MobileMediaViewer.jsx';
import MobilePdfViewer from './mobile/MobilePdfViewer.jsx';
import MobileTextEditor from './mobile/MobileTextEditor.jsx';
import MobilePinLock from './mobile/MobilePinLock.jsx';
import MobileLoginView from './mobile/MobileLoginView.jsx';
import {
  MobileInputModal,
  MobilePropertiesModal,
  MobileFolderPickerModal,
  MobileConfirmModal,
} from './mobile/MobileModals.jsx';
import {
  takePhoto,
  pickFromGallery,
  pickFiles,
  shareFile,
  triggerHaptic,
} from './mobile/native-bridge.js';
import { apiRequest, setCsrfToken } from './api.js';

export default function App() {
  // Autenticación
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Bloqueo PIN
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('gestor_pin_enabled') === 'true');
  const [pinCode, setPinCode] = useState(() => localStorage.getItem('gestor_pin_code') || '1234');
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Pestaña activa: 'files' | 'search' | 'trash' | 'settings'
  const [activeTab, setActiveTab] = useState('files');

  // Explorador de archivos
  const [currentPath, setCurrentPath] = useState('/');
  const currentPathRef = useRef('/');
  currentPathRef.current = currentPath;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [trashCount, setTrashCount] = useState(0);

  // Ordenación
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'date' | 'size'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Selección múltiple
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState([]);

  // Subidas
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [uploads, setUploads] = useState([]);
  const abortControllersRef = useRef(new Map());

  // Menú de fila activa y modales
  const [actionSheetItem, setActionSheetItem] = useState(null);
  const [activeViewer, setActiveViewer] = useState(null); // { type, item }
  const [inputModal, setInputModal] = useState(null); // { type, title, defaultValue, onConfirm }
  const [propertiesItem, setPropertiesItem] = useState(null);
  const [folderPicker, setFolderPicker] = useState(null); // { mode: 'move'|'copy'|'batchMove'|'batchCopy', items: [...] }
  const [confirmModal, setConfirmModal] = useState(null);

  // Comprobar sesión al inicio
  useEffect(() => {
    apiRequest('/api/auth/me')
      .then((data) => {
        setUser(data.user);
        if (data.csrfToken) setCsrfToken(data.csrfToken);
        setAuthChecked(true);
      })
      .catch(() => {
        setUser(null);
        setAuthChecked(true);
      });
  }, []);

  // Cargar lista de archivos de la ruta actual
  const loadDirectory = useCallback(async (dirPath, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`/api/files/list?path=${encodeURIComponent(dirPath)}`);
      setItems(data.items || []);
      setCurrentPath(dirPath);
    } catch (err) {
      setError(err.message || 'Error al listar el directorio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Escuchar botón atrás del historial nativo
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.path) {
        loadDirectory(e.state.path);
      } else if (currentPath !== '/') {
        const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
        loadDirectory(parent);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath, loadDirectory]);

  // Cargar directorio inicial tras login
  useEffect(() => {
    if (user) {
      loadDirectory('/');
      // Consultar contador de papelera
      apiRequest('/api/trash/list')
        .then((data) => setTrashCount((data.items || []).length))
        .catch(() => {});
    }
  }, [user, loadDirectory]);

  // Navegar a una ruta
  const handleNavigate = (path) => {
    window.history.pushState({ path }, '', window.location.pathname);
    setIsSelectionMode(false);
    setSelectedPaths([]);
    loadDirectory(path);
  };

  useEffect(() => {
    window.__navigateToPath = (p) => handleNavigate(p);
    return () => { delete window.__navigateToPath; };
  }, [loadDirectory]);

  // Subir un nivel en el árbol de carpetas
  const handleGoBack = () => {
    if (currentPath === '/') return;
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    handleNavigate(parent);
  };

  // Abrir elemento (carpeta o visor)
  const handleOpenItem = (item) => {
    if (item.isDirectory) {
      handleNavigate(item.path);
      return;
    }

    const name = (item.name || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';

    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
      setActiveViewer({ type: 'image', item });
    } else if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) {
      setActiveViewer({ type: 'video', item });
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      setActiveViewer({ type: 'audio', item });
    } else if (['pdf'].includes(ext)) {
      setActiveViewer({ type: 'pdf', item });
    } else if (['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'sh', 'log', 'env', 'yml', 'yaml', 'xml'].includes(ext)) {
      setActiveViewer({ type: 'text', item });
    } else {
      // Para otros ficheros, abrir el menú de acciones directamente
      setActionSheetItem(item);
    }
  };

  // Alternar ordenación
  const handleToggleSort = () => {
    const orders = ['name', 'date', 'size'];
    const nextIdx = (orders.indexOf(sortBy) + 1) % orders.length;
    if (nextIdx === 0) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    }
    setSortBy(orders[nextIdx]);
  };

  // Selección múltiple
  const handleToggleSelect = (item) => {
    setSelectedPaths((prev) => {
      if (prev.includes(item.path)) {
        return prev.filter((p) => p !== item.path);
      }
      return [...prev, item.path];
    });
  };

  const handleSelectAll = () => {
    setSelectedPaths(items.map((i) => i.path));
  };

  const handleDeselectAll = () => {
    setSelectedPaths([]);
  };

  // Descarga individual
  const handleDownload = (item) => {
    const url = item.isDirectory
      ? `/api/download/folder?path=${encodeURIComponent(item.path)}`
      : `/api/download/file?path=${encodeURIComponent(item.path)}`;
    window.location.href = url;
  };

  // Compartir
  const handleShare = async (item) => {
    const shareUrl = `${window.location.origin}/api/download/file?path=${encodeURIComponent(item.path)}`;
    const res = await shareFile(item.name, 'Enlace de archivo', shareUrl);
    if (res === 'copied') {
      alert('Enlace copiado al portapapeles');
    }
  };

  // Subida de archivos en trozos (Chunked Upload)
  const uploadSingleFile = async (file) => {
    const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const chunkSize = 2 * 1024 * 1024; // 2 MB por chunk
    const totalChunks = Math.ceil(file.size / chunkSize) || 1;

    const newUpload = {
      id: uploadId,
      name: file.name,
      progress: 0,
      status: 'uploading',
      error: null,
    };

    setUploads((prev) => [...prev, newUpload]);

    try {
      // 1. Inicializar subida
      const initRes = await apiRequest('/api/upload/init', {
        method: 'POST',
        body: {
          fileName: file.name,
          totalSize: file.size,
          chunkSize,
          totalChunks,
          targetDir: currentPath,
        },
      });

      const serverUploadId = initRes.uploadId;
      const controller = new AbortController();
      abortControllersRef.current.set(uploadId, controller);

      // 2. Subir chunks
      for (let i = 0; i < totalChunks; i++) {
        if (controller.signal.aborted) throw new Error('Subida cancelada');

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', serverUploadId);
        formData.append('chunkIndex', String(i));
        formData.append('chunk', chunkBlob, `chunk_${i}`);

        await apiRequest('/api/upload/chunk', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        const pct = Math.round(((i + 1) / totalChunks) * 100);
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: pct } : u))
        );
      }

      // 3. Completar subida
      await apiRequest('/api/upload/complete', {
        method: 'POST',
        body: { uploadId: serverUploadId },
      });

      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'done', progress: 100 } : u))
      );

      // Limpiar de la lista tras 3 segundos y refrescar
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 3000);
      loadDirectory(currentPath, true);
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: err.message } : u))
      );
    } finally {
      abortControllersRef.current.delete(uploadId);
    }
  };

  // Subida desde Cámara
  const handleTakePhoto = async () => {
    const file = await takePhoto();
    if (file) uploadSingleFile(file);
  };

  // Subida desde Galería
  const handlePickGallery = async () => {
    const file = await pickFromGallery();
    if (file) uploadSingleFile(file);
  };

  // Subida desde Selector de Archivos
  const handlePickFiles = async () => {
    const files = await pickFiles(true);
    if (files && files.length > 0) {
      for (const f of files) {
        uploadSingleFile(f);
      }
    }
  };

  // Cancelar subida
  const handleCancelUpload = (id) => {
    const ctrl = abortControllersRef.current.get(id);
    if (ctrl) ctrl.abort();
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  // Crear Carpeta
  const handleCreateFolder = () => {
    const parentDir = currentPathRef.current;
    setInputModal({
      title: 'Nueva carpeta',
      subtitle: `Crear en ${parentDir}`,
      placeholder: 'Nombre de la carpeta',
      confirmLabel: 'Crear',
      onConfirm: async (name) => {
        await apiRequest('/api/files/mkdir', {
          method: 'POST',
          body: { parentDir, name },
        });
        loadDirectory(parentDir, true);
      },
    });
  };

  // Crear Archivo de Texto
  const handleCreateFile = () => {
    const parentDir = currentPathRef.current;
    setInputModal({
      title: 'Nuevo archivo',
      subtitle: `Crear en ${parentDir}`,
      placeholder: 'ejemplo.txt',
      confirmLabel: 'Crear',
      onConfirm: async (name) => {
        await apiRequest('/api/files/create-file', {
          method: 'POST',
          body: { parentDir, name },
        });
        loadDirectory(parentDir, true);
      },
    });
  };

  // Renombrar
  const handleRename = (item) => {
    setInputModal({
      title: 'Renombrar',
      subtitle: `Nombre actual: ${item.name}`,
      defaultValue: item.name,
      confirmLabel: 'Renombrar',
      onConfirm: async (newName) => {
        await apiRequest('/api/files/rename', {
          method: 'POST',
          body: { path: item.path, newName },
        });
        loadDirectory(currentPath, true);
      },
    });
  };

  // Permisos chmod
  const handleChmod = (item) => {
    setInputModal({
      title: 'Cambiar permisos (chmod)',
      subtitle: `Modo octal para ${item.name} (ej. 0755, 0644)`,
      defaultValue: item.permissionsOctal || '0755',
      confirmLabel: 'Aplicar',
      onConfirm: async (mode) => {
        await apiRequest('/api/files/chmod', {
          method: 'POST',
          body: { path: item.path, mode },
        });
        loadDirectory(currentPath, true);
      },
    });
  };

  // Comprimir individual o lote
  const handleCompress = (itemsToCompress) => {
    const targets = Array.isArray(itemsToCompress) ? itemsToCompress : [itemsToCompress];
    const defaultZip = (targets[0].name.split('.')[0] || 'archivo') + '.zip';

    setInputModal({
      title: 'Comprimir a ZIP',
      subtitle: `Se comprimirán ${targets.length} elementos`,
      defaultValue: defaultZip,
      confirmLabel: 'Comprimir',
      onConfirm: async (archiveName) => {
        await apiRequest('/api/archive/compress', {
          method: 'POST',
          body: {
            sources: targets.map((t) => t.path || t),
            targetDir: currentPath,
            archiveName,
            format: 'zip',
          },
        });
        setIsSelectionMode(false);
        setSelectedPaths([]);
        loadDirectory(currentPath, true);
      },
    });
  };

  // Mover a papelera
  const handleDeleteItem = (item) => {
    setConfirmModal({
      title: '¿Mover a la papelera?',
      message: `El elemento "${item.name}" se enviará a la papelera del servidor.`,
      isDanger: true,
      confirmLabel: 'Mover a papelera',
      onConfirm: async () => {
        await apiRequest('/api/files/delete', {
          method: 'POST',
          body: { paths: [item.path], permanent: false },
        });
        loadDirectory(currentPath, true);
        setTrashCount((prev) => prev + 1);
      },
    });
  };

  // Acciones en Lote
  const handleBatchDelete = () => {
    setConfirmModal({
      title: `¿Mover ${selectedPaths.length} elementos a la papelera?`,
      message: 'Los archivos seleccionados se moverán a la papelera.',
      isDanger: true,
      confirmLabel: 'Mover todos',
      onConfirm: async () => {
        await apiRequest('/api/files/delete', {
          method: 'POST',
          body: { paths: selectedPaths, permanent: false },
        });
        setIsSelectionMode(false);
        setSelectedPaths([]);
        loadDirectory(currentPath, true);
        setTrashCount((prev) => prev + selectedPaths.length);
      },
    });
  };

  const handleBatchMove = () => {
    setFolderPicker({
      mode: 'batchMove',
      items: selectedPaths,
    });
  };

  const handleBatchCopy = () => {
    setFolderPicker({
      mode: 'batchCopy',
      items: selectedPaths,
    });
  };

  const handleBatchCompress = () => {
    handleCompress(selectedPaths);
  };

  const handleBatchDownload = async () => {
    // Comprimir en lote y descargar
    const tempZipName = `descarga_lote_${Date.now()}.zip`;
    try {
      const res = await apiRequest('/api/archive/compress', {
        method: 'POST',
        body: {
          sources: selectedPaths,
          targetDir: currentPath,
          archiveName: tempZipName,
          format: 'zip',
        },
      });
      setIsSelectionMode(false);
      setSelectedPaths([]);
      loadDirectory(currentPath, true);
      window.location.href = `/api/download/file?path=${encodeURIComponent(currentPath + '/' + tempZipName)}`;
    } catch (err) {
      alert(`Error al generar descarga en lote: ${err.message}`);
    }
  };

  // Confirmar destino de Mover / Copiar
  const handleSelectFolderDestination = async (targetDir) => {
    if (!folderPicker) return;
    const { mode, items: targetItems } = folderPicker;

    try {
      if (mode === 'move') {
        await apiRequest('/api/files/move', {
          method: 'POST',
          body: { sources: [targetItems.path], targetDir },
        });
      } else if (mode === 'copy') {
        await apiRequest('/api/files/copy', {
          method: 'POST',
          body: { sources: [targetItems.path], targetDir },
        });
      } else if (mode === 'batchMove') {
        await apiRequest('/api/files/move', {
          method: 'POST',
          body: { sources: targetItems, targetDir },
        });
        setIsSelectionMode(false);
        setSelectedPaths([]);
      } else if (mode === 'batchCopy') {
        await apiRequest('/api/files/copy', {
          method: 'POST',
          body: { sources: targetItems, targetDir },
        });
        setIsSelectionMode(false);
        setSelectedPaths([]);
      }
      loadDirectory(currentPath, true);
    } catch (err) {
      alert(`Error al procesar: ${err.message}`);
    } finally {
      setFolderPicker(null);
    }
  };

  // Desbloqueo PIN
  const handleUnlockPin = () => {
    setIsPinUnlocked(true);
  };

  const handleTogglePin = () => {
    const next = !pinEnabled;
    setPinEnabled(next);
    localStorage.setItem('gestor_pin_enabled', String(next));
  };

  const handleChangePin = () => {
    setInputModal({
      title: 'Nuevo código PIN',
      subtitle: 'Introduce 4 dígitos numéricos',
      defaultValue: '',
      placeholder: '4 dígitos (ej. 1234)',
      confirmLabel: 'Guardar PIN',
      onConfirm: async (val) => {
        if (/^\d{4}$/.test(val)) {
          setPinCode(val);
          localStorage.setItem('gestor_pin_code', val);
          alert('Código PIN actualizado correctamente');
        } else {
          throw new Error('El PIN debe tener exactamente 4 dígitos numéricos');
        }
      },
    });
  };

  // Cerrar Sesión
  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
    setIsPinUnlocked(false);
  };

  // 1. Pantalla de carga inicial
  if (!authChecked) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#111318] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-gray-400">Iniciando Gestor de Archivos...</p>
      </div>
    );
  }

  // 2. Pantalla de Login si no está autenticado
  if (!user) {
    return <MobileLoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  // 3. Pantalla de Bloqueo por PIN si está activo y no se ha desbloqueado
  if (pinEnabled && !isPinUnlocked) {
    return <MobilePinLock correctPin={pinCode} onUnlock={handleUnlockPin} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#111318] text-[#f3f3f3] select-none">
      {/* 1. Vista Explorador de Archivos */}
      {activeTab === 'files' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <MobileHeader
            currentPath={currentPath}
            onNavigate={handleNavigate}
            onGoBack={handleGoBack}
            canGoBack={currentPath !== '/'}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedPaths.length}
            totalCount={items.length}
            onToggleSelectionMode={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedPaths([]);
            }}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onRefresh={() => loadDirectory(currentPath, true)}
            isRefreshing={refreshing}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onToggleSort={handleToggleSort}
          />

          <MobileFileList
            items={items}
            loading={loading}
            error={error}
            currentPath={currentPath}
            isSelectionMode={isSelectionMode}
            selectedPaths={selectedPaths}
            onToggleSelect={handleToggleSelect}
            onOpenItem={handleOpenItem}
            onActionMenu={(item) => setActionSheetItem(item)}
            onQuickDelete={handleDeleteItem}
            onQuickShare={handleShare}
            onQuickDownload={handleDownload}
            onRefresh={() => loadDirectory(currentPath, true)}
            sortBy={sortBy}
            sortDirection={sortDirection}
          />

          {/* Botón Flotante para Subir/Crear */}
          <MobileFAB
            onClick={() => setIsUploadSheetOpen(true)}
            isVisible={!isSelectionMode}
          />

          {/* Barra de Acciones en Lote (cuando hay selección) */}
          {isSelectionMode && (
            <MobileBatchBar
              selectedCount={selectedPaths.length}
              onBatchDelete={handleBatchDelete}
              onBatchMove={handleBatchMove}
              onBatchCopy={handleBatchCopy}
              onBatchCompress={handleBatchCompress}
              onBatchDownload={handleBatchDownload}
            />
          )}
        </div>
      )}

      {/* 2. Vista de Búsqueda Rápida */}
      {activeTab === 'search' && (
        <MobileSearchView
          currentPath={currentPath}
          onOpenItem={handleOpenItem}
          onNavigateToFolder={(folder) => {
            setActiveTab('files');
            handleNavigate(folder);
          }}
        />
      )}

      {/* 3. Vista de Papelera */}
      {activeTab === 'trash' && (
        <MobileTrashView onTrashCountChange={(cnt) => setTrashCount(cnt)} />
      )}

      {/* 4. Vista de Ajustes */}
      {activeTab === 'settings' && (
        <MobileSettingsView
          user={user}
          onLogout={handleLogout}
          pinEnabled={pinEnabled}
          onTogglePin={handleTogglePin}
          onChangePin={handleChangePin}
        />
      )}

      {/* Barra de Navegación Inferior (Archivos, Buscar, Papelera, Ajustes) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setIsSelectionMode(false);
          setSelectedPaths([]);
          setActiveTab(tab);
        }}
        trashCount={trashCount}
      />

      {/* Subidas de Archivos en Progreso */}
      <MobileUploadProgress
        uploads={uploads}
        onCancelUpload={handleCancelUpload}
      />

      {/* Hoja Inferior del FAB: Cámara, Galería, Subir Ficheros, Nueva Carpeta */}
      <MobileUploadSheet
        isOpen={isUploadSheetOpen}
        onClose={() => setIsUploadSheetOpen(false)}
        onTakePhoto={handleTakePhoto}
        onPickGallery={handlePickGallery}
        onPickFiles={handlePickFiles}
        onCreateFolder={handleCreateFolder}
        onCreateFile={handleCreateFile}
      />

      {/* Hoja Inferior de Acciones de Fila (•••) */}
      <MobileActionSheet
        isOpen={Boolean(actionSheetItem)}
        item={actionSheetItem}
        onClose={() => setActionSheetItem(null)}
        onDownload={handleDownload}
        onShare={handleShare}
        onRename={handleRename}
        onMove={(it) => setFolderPicker({ mode: 'move', items: it })}
        onCopy={(it) => setFolderPicker({ mode: 'copy', items: it })}
        onCompress={handleCompress}
        onChmod={handleChmod}
        onProperties={(it) => setPropertiesItem(it)}
        onDelete={handleDeleteItem}
      />

      {/* Visor de Imágenes Pantalla Completa */}
      {activeViewer && activeViewer.type === 'image' && (
        <MobileImageViewer
          item={activeViewer.item}
          onClose={() => setActiveViewer(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Visor de Vídeo y Audio */}
      {activeViewer && (activeViewer.type === 'video' || activeViewer.type === 'audio') && (
        <MobileMediaViewer
          item={activeViewer.item}
          type={activeViewer.type}
          onClose={() => setActiveViewer(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Visor de PDF */}
      {activeViewer && activeViewer.type === 'pdf' && (
        <MobilePdfViewer
          item={activeViewer.item}
          onClose={() => setActiveViewer(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Editor de Texto Móvil */}
      {activeViewer && activeViewer.type === 'text' && (
        <MobileTextEditor
          item={activeViewer.item}
          onClose={() => setActiveViewer(null)}
          onSaveSuccess={() => loadDirectory(currentPath, true)}
        />
      )}

      {/* Modal de Propiedades y Checksums */}
      <MobilePropertiesModal
        isOpen={Boolean(propertiesItem)}
        item={propertiesItem}
        onClose={() => setPropertiesItem(null)}
      />

      {/* Modal Selector de Carpeta Destino (para Mover / Copiar) */}
      <MobileFolderPickerModal
        isOpen={Boolean(folderPicker)}
        title={folderPicker?.mode.includes('Move') || folderPicker?.mode === 'move' ? 'Mover a carpeta...' : 'Copiar en carpeta...'}
        onSelectDir={handleSelectFolderDestination}
        onClose={() => setFolderPicker(null)}
      />

      {/* Diálogo de Entrada (Crear carpeta, Crear archivo, Renombrar, Chmod) */}
      {inputModal && (
        <MobileInputModal
          isOpen={Boolean(inputModal)}
          title={inputModal.title}
          subtitle={inputModal.subtitle}
          defaultValue={inputModal.defaultValue}
          placeholder={inputModal.placeholder}
          confirmLabel={inputModal.confirmLabel}
          onConfirm={inputModal.onConfirm}
          onClose={() => setInputModal(null)}
        />
      )}

      {/* Modal de Confirmación */}
      {confirmModal && (
        <MobileConfirmModal
          isOpen={Boolean(confirmModal)}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          isDanger={confirmModal.isDanger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
