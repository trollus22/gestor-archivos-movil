# Gestor de Archivos · Móvil

Gestor de archivos para servidor Linux, en **versión móvil**: interfaz táctil, **PWA** instalable y
envoltorio nativo con **Capacitor 7** para generar **APK (Android)** e **IPA (iOS)**.

Réplica móvil del gestor de escritorio (`dashboard-gestion`), con backend propio en Express y UI
rediseñada para uso con el pulgar: lista, barra inferior, FAB de subida, acciones por pulsación
larga y menús contextuales.

## Stack

- **Backend:** Node 22 + Express (43 endpoints) — auth por sesión (cookie HttpOnly), CSRF, bcrypt, rate limiting
- **Frontend:** React 18 + Vite + Tailwind + lucide-react
- **Nativo:** Capacitor 7 (`@capacitor/camera`, `filesystem`, `share`, `status-bar`, `haptics`)
- **PWA:** `manifest.webmanifest` + service worker + iconos 192/512

## Requisitos

```bash
npm ci
cp .env.example .env      # y rellena SESSION_SECRET y ADMIN_PASSWORD
npm run dev               # servidor en http://127.0.0.1:3899
```

El servidor **no arranca** si faltan `SESSION_SECRET` o las credenciales de administrador.
No hay valores por defecto: este repositorio es público y no debe contener secretos.

## Build

```bash
npm run build             # web → dist/
npx cap sync android      # y/o: npx cap sync ios
```

## Descargar APK e IPA

Los instalables **no se compilan a mano**: los genera GitHub Actions en cada push a `main`
([`.github/workflows/build.yml`](.github/workflows/build.yml)).

1. Pestaña **Actions** → workflow **Build APK + IPA** → ejecución más reciente
2. Baja hasta **Artifacts** y descarga:
   - **`GestorArchivos-APK`** → `GestorArchivos.apk` (Android, depuración)
   - **`GestorArchivos-IPA-sin-firmar`** → `GestorArchivos.ipa` (iOS)

El APK es de depuración y se instala directamente. El **IPA va sin firmar**: para instalarlo en un
iPhone hay que firmarlo con un certificado de desarrollador (Sideloadly, AltStore, Xcode o un
servicio de firma). Sin firma no lo instala iOS.

## Estructura

```
server/          API Express (rutas, auth, uploads por trozos, papelera, archivos comprimidos)
src/mobile/      Componentes de la interfaz móvil
src/components/  Componentes compartidos / escritorio
public/          Iconos y service worker de la PWA
android/         Proyecto Android (Capacitor)
ios/             Proyecto iOS (Capacitor)
```

## Licencia

Uso privado. Sin licencia de distribución.
