# Posts Manager — Frontend

Aplicación web para gestión de posts y comentarios. Construida con Angular 21, PrimeNG y Tailwind CSS.

## Tecnologías

- **Angular 21** — framework frontend con signals y standalone components
- **PrimeNG** — componentes UI (tablas, diálogos, formularios, editor)
- **Tailwind CSS** — estilos utilitarios
- **RxJS** — manejo de flujos asíncronos
- **JWT** — autenticación con interceptores HTTP

## Requisitos previos

- Node.js 18 o superior
- npm
- Backend levantado y corriendo en `http://localhost:3000`

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd posts-manager-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Ajusta el archivo `src/environments/environment.ts` si el backend corre en un puerto distinto:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000'
};
```

### 4. Ejecutar la aplicación

```bash
npm run start
```

La aplicación queda disponible en `http://localhost:4200`.

## Credenciales de prueba

Utiliza cualquier usuario del seed del backend. Ejemplo:

```json
{
  "email": "juanperez@example.com",
  "password": "12345"
}
```

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Login** | Autenticación con JWT, guard de rutas protegidas |
| **Posts** | Listado con búsqueda, paginación, vista tabla y mosaico |
| **Mis posts** | Posts propios con crear, editar, eliminar y carga masiva desde JSON |
| **Detalle del post** | Vista completa con carrusel de imágenes y sección de comentarios |
| **Usuarios** | CRUD completo de usuarios con búsqueda |

## Scripts disponibles

```bash
npm run start          # Desarrollo con hot-reload
npm run build      # Compilar para producción
```
