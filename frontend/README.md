# Frontend - LXP Flow

Frontend React para el sistema LXP (Learning Experience Platform).

## Stack Tecnológico

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 3
- **Estado**: Zustand 4
- **Routing**: React Router 6

## Requisitos

- Node.js >= 18
- Backend corriendo en puerto 3001

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run preview` | Preview del build de producción |

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   └── ui/           # Componentes UI base (Button, Input, Card, Alert)
│   ├── features/         # Features por dominio
│   │   └── auth/         # Autenticación
│   │       ├── login/    # Página de login
│   │       ├── recover-password/  # Recuperar contraseña
│   │       └── sessions/ # Gestión de sesiones
│   ├── routes/           # Guards y configuración de rutas
│   ├── services/         # Servicios de API
│   ├── store/            # Estado global (Zustand)
│   ├── types/            # Tipos TypeScript
│   ├── App.tsx           # Componente principal con rutas
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globales con Tailwind
├── index.html
├── vite.config.ts        # Configuración de Vite (incluye proxy)
├── tailwind.config.js    # Configuración de Tailwind
└── tsconfig.json         # Configuración TypeScript
```

## Páginas de Autenticación

### Login (`/login`)
- Formulario email/password con validación
- Botón de Google OAuth (requiere configuración de `VITE_GOOGLE_CLIENT_ID`)
- Enlace a recuperación de contraseña
- Redirección automática a `/sessions` después del login

### Recover Password (`/recover-password`)
- Formulario para solicitar reset de contraseña por email
- Mensajes de éxito/error
- Enlace de regreso al login

### Sessions (`/sessions`)
- Lista de sesiones activas del usuario
- Indicador de sesión actual
- Botones para revocar sesiones
- Información de dispositivo, IP y fechas

## Estado Global (Zustand)

El store de autenticación (`src/store/auth.store.ts`) maneja:
- Usuario autenticado
- Token JWT
- Estado de carga y errores
- Persistencia en localStorage

```typescript
// Uso del store
import { use_auth_store } from '@/store';

const { user, is_authenticated, logout } = use_auth_store();
```

## Guards de Rutas

- **AuthGuard**: Protege rutas que requieren autenticación. Redirige a `/login` si no hay sesión válida.
- **GuestGuard**: Protege rutas públicas. Redirige a `/sessions` si ya hay sesión.

## API Service

El servicio de API (`src/services/api.service.ts`) provee:
- Wrapper de fetch con manejo de errores
- Inyección automática de token JWT
- Logout automático en respuestas 401

```typescript
import { api } from '@/services';

// Ejemplo de uso
const response = await api.post('/auth/login', { email, password });
```

## Configuración del Proxy

En desarrollo, Vite proxy las llamadas `/api/*` al backend:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}
```

## Variables de Entorno

Crear archivo `.env` en la raíz del frontend:

```env
# Google OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Convenciones de Código

- **Naming**: snake_case para variables y funciones
- **Componentes**: PascalCase para componentes React
- **Archivos**: kebab-case para nombres de archivos
- **Tipos**: Sufijo `Props` para props de componentes, tipos en `src/types/`

## Health Checks

Antes de hacer PR, verificar que pasen:

```bash
npm run lint      # Sin errores
npm run typecheck # Sin errores de tipos
npm run build     # Build exitoso
```

## Usuarios de Prueba

Una vez configurado el backend con el seed:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@test.com | Admin123! |
| Teacher | teacher@test.com | Teacher123! |
| Student | student@test.com | Student123! |
