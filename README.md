# SkillHub — Buscador de Profesionales del Hogar

Aplicación web para conectar personas que necesitan servicios del hogar con profesionales de rubros como plomería, electricidad, gas, construcción y mecánica.

Desarrollado como proyecto final de la materia **Desarrollo de Software** — Junio 2026.

🔗 **Demo en vivo:** [skillhub-coral.vercel.app](https://skillhub-coral.vercel.app)

---

## ¿Qué hace la app?

Cuenta con dos tipos de usuarios:

- **Buscador:** busca profesionales filtrando por rubro y localidad, ve su perfil completo, portfolio de trabajos y puede dejar una calificación con estrellas y comentario.
- **Profesional:** crea y edita su perfil, sube fotos de sus trabajos (portfolio), indica su disponibilidad y recibe calificaciones de los buscadores.

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React + Vite | Frontend |
| Supabase | Base de datos (PostgreSQL), autenticación y storage de imágenes |
| React Router v6 | Navegación entre pantallas |
| Vercel | Deploy en producción |
| GitHub | Control de versiones |

---

## Requisitos previos

Antes de levantar el proyecto necesitás tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Git](https://git-scm.com/)
- Una cuenta en [Supabase](https://supabase.com/) (gratuita)

---

## Cómo levantar el proyecto en otra PC

### 1. Clonar el repositorio

```bash
git clone https://github.com/cartonero/skillhub.git
cd skillhub/skillhub
```

### 2. Instalar dependencias

> ⚠️ En Windows, usar **Command Prompt (CMD)** en lugar de PowerShell para evitar errores de permisos.

```bash
npm install
```

### 3. Configurar las variables de entorno

Crear un archivo `.env` en la carpeta `skillhub/` copiando el ejemplo:

```bash
cp .env.example .env
```

Luego editar el `.env` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Podés encontrar estos valores en tu proyecto de Supabase en: **Settings → API**

### 4. Configurar Supabase

En tu proyecto de Supabase, crear las siguientes 4 tablas en el **SQL Editor**:

```sql
-- Tabla de perfiles (todos los usuarios)
create table perfiles (
  id uuid primary key references auth.users,
  tipo text,
  nombre text,
  telefono text,
  localidad text,
  provincia text,
  foto_perfil text
);

-- Tabla de profesionales
create table profesionales (
  id uuid primary key references perfiles(id),
  rubro text,
  descripcion text,
  disponible boolean default true
);

-- Tabla de trabajos (portfolio)
create table trabajos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid references profesionales(id),
  foto_url text,
  descripcion text,
  created_at timestamp default now()
);

-- Tabla de reseñas
create table resenias (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid references profesionales(id),
  buscador_id uuid references perfiles(id),
  estrellas int,
  comentario text,
  created_at timestamp default now()
);
```

También crear un **bucket público** en Supabase Storage llamado `trabajos` para las fotos.

> ⚠️ Para entorno de desarrollo, deshabilitar RLS en las 4 tablas:
> ```sql
> alter table perfiles disable row level security;
> alter table profesionales disable row level security;
> alter table trabajos disable row level security;
> alter table resenias disable row level security;
> ```

### 5. Correr el proyecto

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## Estructura del proyecto

```
skillhub/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Registro.jsx
│   │   ├── DashBuscador.jsx
│   │   ├── DashProfesional.jsx
│   │   └── PerfilProfesional.jsx
│   ├── services/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env               ← no subido a GitHub
├── .env.example
├── vercel.json
└── package.json
```

---

## Funcionalidades

- ✅ Registro e inicio de sesión con dos roles (buscador / profesional)
- ✅ Perfil editable del profesional (nombre, rubro, localidad, descripción, disponibilidad)
- ✅ Foto de perfil circular editable
- ✅ Portfolio de trabajos con fotos y descripciones
- ✅ Búsqueda de profesionales con filtro por rubro y localidad
- ✅ Botón de contacto directo por WhatsApp
- ✅ Sistema de calificaciones con estrellas (1 a 5) y comentario
- ✅ Promedio de estrellas visible en la lista de resultados
- ✅ Diseño responsive (celular, tablet y escritorio)
- ✅ Deploy en producción con Vercel

---

## Autor

**Rodrigo Cruz** — Proyecto final Desarrollo de Software — Junio 2026
