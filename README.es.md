# Planer0

Planer0 es una herramienta CLI local que te ayuda a crear planes de acción utilizando IA. Genera preguntas de planificación contextualizadas, recopila tus respuestas y produce una checklist en formato Markdown con tareas y subtareas para lograr cualquier objetivo.

---

## 🧠 Características

- Genera preguntas de planificación contextualizadas según tu objetivo y el nivel de detalle deseado (Simple, Medio, Complejo)
- CLI interactivo para recopilar tus respuestas
- Genera una checklist accionable en formato Markdown (`- [ ]`)
- Compatible con modelos de OpenAI y Google Gemini (vía API key)
- Todos los datos se guardan en carpetas estructuradas para cada plan
- Soporte multilenguaje: inglés y español

---

## 📂 Estructura de Carpetas

```
plans/
└── <plan-folder>/
    ├── <plan-folder>.md           # Checklist final (Markdown)
    └── q&a/
        ├── user_responses.json   # Tus respuestas a las preguntas de planificación
        # (Otros archivos .json intermedios pueden agregarse aquí en el futuro)
```

- `<plan-folder>`: Un nombre de carpeta corto y seguro generado a partir de tu objetivo (minúsculas, guiones, máximo 40 caracteres)
- Todos los archivos intermedios se almacenan en la subcarpeta `q&a/`
- La checklist final se guarda como `<plan-folder>.md` en la carpeta raíz del plan

---

## 🚀 ¿Cómo Funciona?

1. **Elige el idioma**: Selecciona inglés o español al iniciar
2. **Ingresa tu objetivo**: Describe lo que deseas planificar
3. **Selecciona el nivel de detalle**: Elige entre Simple, Medio o Complejo
4. **La IA genera preguntas**: La herramienta crea entre 5 y 10 preguntas de planificación personalizadas
5. **Responde de forma interactiva**: Contesta cada pregunta en la CLI (puedes dejar algunas en blanco)
6. **Generación de checklist**: La IA crea una checklist paso a paso en Markdown basada en tus respuestas
7. **Todos los archivos se guardan**: Todo se almacena en una carpeta dedicada dentro de `plans/`

---

## 🛠️ Primeros Pasos

### 1. Instala las dependencias

```bash
npm install
```

### 2. Configura las variables de entorno

Crea un archivo `.env`:

```env
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key
LLM_PROVIDER=openai # o "google"
```

### 3. Ejecuta la CLI

```bash
node index.js # o npm start
```

---

## 🔄 Cambiar de Modelo

Modifica `.env`:

```env
LLM_PROVIDER=google  # o "openai"
```

---

## 📦 Dependencias

- Node.js + ESModules
- OpenAI o Google Generative AI
- dotenv, fs-extra, slugify, readline 
