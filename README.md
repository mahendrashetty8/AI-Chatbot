# Gemini AI Chatbot

A complete, production-grade AI Chatbot application powered by the Google Gemini API (`@google/genai` SDK), Node.js, Express, and Vanilla JavaScript, CSS3, and HTML5.

---

## 📁 Project Structure

```
gemini-chatbot/
│
├── backend/
│   ├── server.js          # Express server with @google/genai SDK & multi-turn memory
│   ├── package.json       # Backend dependencies & npm scripts
│   ├── .env               # Environment secrets (GEMINI_API_KEY, GEMINI_MODEL, PORT)
│   ├── .env.example       # Template for environment configuration
│   └── .gitignore         # Ignores node_modules/ and .env
│
├── frontend/
│   ├── index.html         # Semantic HTML5 chat interface with accessibility features
│   ├── style.css          # Responsive CSS3 styles with Dark/Light theme & markdown styling
│   └── script.js          # Client-side chat logic, safe markdown rendering & API client
│
└── README.md              # Detailed project documentation & setup instructions
```

---

## ⚡ Quick Start Guide

### 1. Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd gemini-chatbot/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend:
   ```bash
   npm start
   ```
   Backend will be running at `http://localhost:5000`.

### 2. Launch the Frontend

Open `gemini-chatbot/frontend` using a local web server (e.g. VS Code Live Server, or Python/Node static server):

```bash
cd gemini-chatbot/frontend
npx serve .
# or
python -m http.server 3000
```

Open `http://localhost:3000` (or the port shown) in your browser.

