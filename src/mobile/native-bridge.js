// Bridge unificado para Capacitor 7 y PWA/Navegador móvil

let CameraPlugin = null;
let SharePlugin = null;
let HapticsPlugin = null;

// Cargar dinámicamente plugins de Capacitor si están disponibles
async function initPlugins() {
  try {
    const cam = await import('@capacitor/camera');
    CameraPlugin = cam.Camera;
  } catch (e) {}

  try {
    const sh = await import('@capacitor/share');
    SharePlugin = sh.Share;
  } catch (e) {}

  try {
    const hap = await import('@capacitor/haptics');
    HapticsPlugin = hap.Haptics;
  } catch (e) {}
}

initPlugins();

/**
 * Disparar vibración/haptic suave al pulsar
 */
export async function triggerHaptic(type = 'light') {
  try {
    if (HapticsPlugin) {
      if (type === 'medium') {
        await HapticsPlugin.impact({ style: 'MEDIUM' });
      } else {
        await HapticsPlugin.impact({ style: 'LIGHT' });
      }
      return;
    }
  } catch (e) {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(type === 'medium' ? 25 : 15);
  }
}

/**
 * Abrir cámara nativa o fallback
 */
export async function takePhoto() {
  triggerHaptic();
  if (CameraPlugin) {
    try {
      const photo = await CameraPlugin.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'CAMERA',
      });
      if (photo && photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const file = new File([blob], `foto_${Date.now()}.${photo.format || 'jpg'}`, {
          type: blob.type || 'image/jpeg',
        });
        return file;
      }
    } catch (err) {
      if (err.message && err.message.includes('User cancelled')) {
        return null;
      }
      console.warn('Error en Capacitor Camera, usando fallback web:', err);
    }
  }

  // Fallback web con input file capture
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0] || null;
      resolve(file);
    };
    input.click();
  });
}

/**
 * Abrir selector de galería nativa o fallback
 */
export async function pickFromGallery() {
  triggerHaptic();
  if (CameraPlugin) {
    try {
      const photo = await CameraPlugin.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'uri',
        source: 'PHOTOS',
      });
      if (photo && photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const file = new File([blob], `galeria_${Date.now()}.${photo.format || 'jpg'}`, {
          type: blob.type || 'image/jpeg',
        });
        return file;
      }
    } catch (err) {
      if (err.message && err.message.includes('User cancelled')) {
        return null;
      }
      console.warn('Error en Capacitor Gallery, usando fallback web:', err);
    }
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0] || null;
      resolve(file);
    };
    input.click();
  });
}

/**
 * Abrir selector de archivos del sistema
 */
export function pickFiles(multiple = true) {
  triggerHaptic();
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      resolve(files);
    };
    input.click();
  });
}

/**
 * Compartir fichero o enlace mediante la hoja de compartir nativa
 */
export async function shareFile(title, text, url) {
  triggerHaptic();
  if (SharePlugin) {
    try {
      await SharePlugin.share({
        title,
        text,
        url,
        dialogTitle: 'Compartir archivo',
      });
      return true;
    } catch (e) {
      if (e.message && e.message.includes('abort')) return false;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
    }
  }

  // Fallback: copiar al portapapeles
  if (navigator.clipboard && url) {
    await navigator.clipboard.writeText(url);
    return 'copied';
  }

  return false;
}
