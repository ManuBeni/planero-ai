[Leer en Español](README.es.md)

# Planero-ai

Planero-ai is a local-first CLI tool that helps you create actionable plans using AI. It generates contextual planning questions, collects your responses, and outputs a Markdown checklist with tasks and subtasks to achieve any goal.

---

## 🧠 Features

- Generate contextual planning questions based on your goal and desired detail level (Simple, Medium, Complex)
- Interactive CLI for collecting your answers
- Generates an actionable checklist in Markdown format (`- [ ]`)
- Supports both OpenAI and Google Gemini models (via API key)
- All data is saved in structured folders for each plan
- Multi-language support: English and Spanish

---

## 📂 Folder Structure

```
plans/
└── <plan-folder>/
    ├── <plan-folder>.md           # Final checklist (Markdown)
    └── q&a/
        ├── user_responses.json   # Your answers to planning questions
        # (Other intermediate .json files may be added here in the future)
```

- `<plan-folder>`: A short, safe folder name generated from your goal (lowercase, dashes, max 40 chars)
- All intermediate files are stored in the `q&a/` subfolder
- The final checklist is saved as `<plan-folder>.md` in the plan's root folder

---

## 🚀 How It Works

1. **Choose language**: Select English or Spanish at startup
2. **Enter your goal**: Describe what you want to plan
3. **Select detail level**: Choose Simple, Medium, or Complex
4. **AI generates questions**: The tool creates 5-10 tailored planning questions
5. **Answer interactively**: Respond to each question in the CLI (you can leave some blank)
6. **Checklist generation**: AI creates a step-by-step Markdown checklist based on your answers
7. **All files saved**: Everything is saved in a dedicated folder under `plans/`

---

## 🛠️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file:

```env
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key
LLM_PROVIDER=openai # or "google"
```

### 3. Run the CLI

```bash
node index.js # or npm start
```

---

## 🔄 Switching Models

Change `.env`:

```env
LLM_PROVIDER=google  # or "openai"
```

---

## 📦 Dependencies

- Node.js + ESModules
- OpenAI or Google Generative AI
- dotenv, fs-extra, slugify, readline
