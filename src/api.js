// Cliente de API con soporte para credenciales de sesión y cabecera CSRF

let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  // Adjuntar token CSRF si no es GET/HEAD y existe token
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  // Si el cuerpo es un objeto plano y no FormData, convertir a JSON
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, {
    ...options,
    method,
    headers,
    body,
    credentials: 'include',
  });

  if (response.status === 401) {
    const error = new Error('No autenticado');
    error.status = 401;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const msg = (data && data.error) || response.statusText || 'Error en la petición';
    const error = new Error(msg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
