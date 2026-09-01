# Gemini AI Chatbot

A production-grade, full-stack AI Chatbot application powered by the Google Gemini API (`@google/genai` SDK), Node.js, Express, and modern Vanilla JavaScript, CSS3, and HTML5.

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
└── README.md              # Project documentation & setup instructions
```

---

## 🚀 Key Features

- **Decoupled Architecture:** Strict separation of concerns. Backend handles all Gemini AI API interaction; frontend never touches or exposes the API key.
- **Official `@google/genai` SDK:** Built using Google's current unified SDK with modern multi-turn chat sessions (`ai.chats.create`).
- **Multi-Turn Chat Memory:** Retains conversation context and memory across messages within a session.
- **Rich Message Rendering:** Safe, custom Markdown renderer with support for:
  - Multi-line code blocks with syntax styling and one-click "Copy" button.
  - Headings, bold, italics, blockquotes, horizontal rules, and tables.
  - Bulleted and numbered lists.
  - Full XSS protection (HTML sanitization/escaping before token parsing).
- **Modern UI & UX:**
  - Gemini gradient branding and smooth bubble animations.
  - Dark and Light mode toggle with `localStorage` persistence.
  - Dynamic auto-expanding textarea input.
  - Animated 3-dot typing indicator.
  - Real-time backend connectivity status badge.
  - Clear conversation modal with server-side session cleanup.
  - Keyboard shortcuts: `Enter` to send, `Shift + Enter` for new lines.
- **Robust Error Handling:** Sanitized user error messages, rate limit handling, CORS protection, and secure server-side logging.

---

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm**: v9.0.0 or higher.
- **Google Gemini API Key**: Free tier available from [Google AI Studio](https://aistudio.google.com/).

---

## ⚙️ Installation & Setup

### 1. Clone or Navigate to the Project

```bash
cd gemini-chatbot
```

### 2. Install Backend Dependencies

Navigate to the `backend` folder and install the required npm packages:

```bash
cd backend
npm install
```

### 3. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** and create a new key.
4. Copy your API key.

### 4. Configure Environment Variables

Open `backend/.env` (or copy from `backend/.env.example`) and paste your API key:

```env
# backend/.env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```

> **Note on Models:** Supported models include `gemini-2.5-flash` (recommended for speed and quality), `gemini-2.0-flash`, or `gemini-1.5-flash`.

---

## ▶️ Running the Application

### 1. Start the Backend Server

Inside the `backend` directory, run:

```bash
# Production start
npm start

# Or development mode with auto-reload
npm run dev
```

The backend will start at:
```
http://localhost:5000
```

You can verify the backend is running by opening `http://localhost:5000` in your browser or running:

```bash
curl http://localhost:5000/
```

Expected response:
```json
{
  "status": "ok",
  "message": "Gemini chatbot backend is running"
}
```

### 2. Launch the Frontend

For optimal performance and CORS compatibility, open the `frontend` folder using a local HTTP server:

#### Option A: Using VS Code Live Server (Recommended)
1. Open the project in VS Code.
2. Right-click `frontend/index.html`.
3. Click **"Open with Live Server"**.

#### Option B: Using Python built-in server
```bash
cd frontend
python -m http.server 3000
```
Open `http://localhost:3000` in your browser.

#### Option C: Using Node `npx serve` or `npx http-server`
```bash
cd frontend
npx serve .
```

---

## 📡 API Reference

### 1. Health Check
- **Endpoint:** `GET /`
- **Description:** Checks server health and returns status.
- **Response:**
  ```json
  {
    "status": "ok",
    "message": "Gemini chatbot backend is running"
  }
  ```

### 2. Send Chat Message
- **Endpoint:** `POST /api/chat`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "message": "Hello, my name is Alex.",
    "sessionId": "optional-uuid-string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "reply": "Hello Alex! Nice to meet you. How can I help you today?",
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
  ```

### 3. Clear Chat Session
- **Endpoint:** `POST /api/chat/clear`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "message": "Conversation history cleared successfully."
  }
  ```

---

## 🔒 Security Best Practices

1. **API Key Protection:** The Gemini API key is solely managed on the server via `process.env.GEMINI_API_KEY`. It is never transmitted to or embedded in frontend code.
2. **Git Ignored Secrets:** The `.env` file and `node_modules` are included in `backend/.gitignore` to prevent accidental commits to version control.
3. **Input Validation:** Request messages are validated for type, presence, and non-empty content before dispatching to the Gemini API.
4. **XSS Defense:** The frontend parses AI responses safely by escaping all HTML special characters (`&`, `<`, `>`, `"`, `'`) prior to tokenizing markdown constructs.
5. **No Stack Trace Leaks:** Server-side exceptions return user-friendly error messages with appropriate HTTP status codes (400, 401, 429, 500, 503) without exposing internal stack traces.

---

## ❓ Troubleshooting & Common Errors

| Issue / Error | Cause | Solution |
| :--- | :--- | :--- |
| **"Gemini API key is not configured" (500)** | `GEMINI_API_KEY` is empty or missing in `backend/.env`. | Set your valid Gemini API key in `backend/.env` and restart the backend server. |
| **"Invalid API key" (401)** | The key in `.env` is invalid or expired. | Generate a new key from Google AI Studio and update `backend/.env`. |
| **"Could not connect to backend server"** | Backend server is not running or running on a different port. | Run `npm start` in `backend/` and verify `http://localhost:5000/` responds. |
| **"Rate limit or quota exceeded" (429)** | Gemini free-tier RPM/RPD limits reached. | Wait 30-60 seconds before sending another message, or upgrade your Google AI Studio quota. |
| **CORS blocked by browser** | Opening `index.html` via `file://` protocol. | Serve the frontend with Live Server, Python `http.server`, or `npx serve`. |

---

## 📄 License

ISC License - Free for educational and personal use.
