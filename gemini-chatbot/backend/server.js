const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { GoogleGenAI } = require('@google/genai');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// System prompt guiding the assistant's behavior and tone
const SYSTEM_INSTRUCTION = `You are a helpful, intelligent, friendly AI assistant.
Give accurate and useful answers.
Explain complicated topics clearly.
When providing programming examples, provide clean and practical code.
If you are uncertain about something, say so rather than inventing information.
Use concise answers by default, but provide detailed explanations when needed.`;

// In-memory conversation store for multi-turn chat sessions
// Map<sessionId, { chat: ChatInstance, lastActive: number }>
const chatSessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Periodically clean up stale sessions to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of chatSessions.entries()) {
    if (now - session.lastActive > SESSION_TTL_MS) {
      chatSessions.delete(sessionId);
    }
  }
}, 15 * 60 * 1000); // Check every 15 minutes

// Initialize Gemini Client
let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Retrieves an existing Gemini chat session or creates a new one.
 * @param {string|null} sessionId
 * @returns {{ sessionId: string, chat: any }}
 */
function getOrCreateChatSession(sessionId) {
  if (!genAI) {
    // Re-attempt initialization if environment changed
    const currentKey = process.env.GEMINI_API_KEY;
    if (currentKey && currentKey !== 'YOUR_GEMINI_API_KEY') {
      genAI = new GoogleGenAI({ apiKey: currentKey });
    } else {
      throw new Error('API_KEY_MISSING');
    }
  }

  const activeSessionId = sessionId && chatSessions.has(sessionId) ? sessionId : crypto.randomUUID();

  if (!chatSessions.has(activeSessionId)) {
    const chat = genAI.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    chatSessions.set(activeSessionId, {
      chat,
      lastActive: Date.now(),
    });
  } else {
    // Update last activity timestamp
    chatSessions.get(activeSessionId).lastActive = Date.now();
  }

  return {
    sessionId: activeSessionId,
    chat: chatSessions.get(activeSessionId).chat,
  };
}

// ----------------------------------------------------
// Middlewares
// ----------------------------------------------------

// Enable CORS for frontend clients
app.use(cors({
  origin: true, // Allow all local / frontend origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Handle JSON parsing errors gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON format in request body.',
    });
  }
  next(err);
});

// ----------------------------------------------------
// Routes
// ----------------------------------------------------

/**
 * GET /
 * Server health check endpoint
 */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Gemini chatbot backend is running',
  });
});

/**
 * POST /api/chat
 * Primary chatbot endpoint with multi-turn conversation support
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body || {};

    // Validate message content
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required and cannot be empty.',
      });
    }

    const trimmedMessage = message.trim();

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      console.error('[Configuration Error] GEMINI_API_KEY is missing or unconfigured in .env');
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in backend/.env',
      });
    }

    // Retrieve or create chat session
    let session;
    try {
      session = getOrCreateChatSession(sessionId);
    } catch (sessionErr) {
      if (sessionErr.message === 'API_KEY_MISSING') {
        return res.status(500).json({
          error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in backend/.env',
        });
      }
      throw sessionErr;
    }

    // Send message to Gemini chat session
    const response = await session.chat.sendMessage({
      message: trimmedMessage,
    });

    const reply = response.text || "I'm sorry, I was unable to generate a response at this time.";

    return res.status(200).json({
      reply,
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error('[Gemini API Server Error]:', error);

    // Handle specific Gemini API error patterns
    const errorMessage = error?.message || '';
    const errorStatus = error?.status || error?.statusCode;

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
      return res.status(401).json({
        error: 'The provided Gemini API key is invalid. Please verify your GEMINI_API_KEY in backend/.env',
      });
    }

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorStatus === 429 || errorMessage.includes('rate limit')) {
      return res.status(429).json({
        error: 'Gemini API rate limit or quota exceeded. Please wait a moment before trying again.',
      });
    }

    if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
      return res.status(400).json({
        error: 'The response was blocked by Gemini safety filters. Please try rephrasing your request.',
      });
    }

    if (errorMessage.includes('model not found') || errorMessage.includes('is not supported')) {
      return res.status(400).json({
        error: `The specified Gemini model (${GEMINI_MODEL}) is unavailable or not supported. Check GEMINI_MODEL in backend/.env.`,
      });
    }

    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Unable to connect to Google Gemini API servers. Please check your internet connection.',
      });
    }

    // Generic safe internal error response
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your request. Please try again later.',
    });
  }
});

/**
 * POST /api/chat/clear
 * Clears/resets the conversation history for a session
 */
app.post('/api/chat/clear', (req, res) => {
  try {
    const { sessionId } = req.body || {};

    if (sessionId && chatSessions.has(sessionId)) {
      chatSessions.delete(sessionId);
    } else if (!sessionId) {
      // If no sessionId specified, clear all active sessions
      chatSessions.clear();
    }

    return res.status(200).json({
      status: 'ok',
      message: 'Conversation history cleared successfully.',
    });
  } catch (error) {
    console.error('[Clear Chat Error]:', error);
    return res.status(500).json({
      error: 'Failed to clear conversation history.',
    });
  }
});

// ----------------------------------------------------
// 404 & Global Error Handling
// ----------------------------------------------------

// Handle unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (prevent unhandled crashes & hide internal traces)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Exception]:', err);
  res.status(500).json({
    error: 'Internal server error.',
  });
});

// ----------------------------------------------------
// Start Server
// ----------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Gemini AI Chatbot Server Running!`);
  console.log(`  URL:   http://localhost:${PORT}`);
  console.log(`  Model: ${GEMINI_MODEL}`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

module.exports = app;
