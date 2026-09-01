/**
 * GemiBot 3D AI Assistant - Complete Client Logic
 * Features:
 * - Pinned Chat History on Screen (Instant View, Date Grouping, Search, Delete, Switch, New Chat)
 * - Quick-Access Recent Chats Grid on Welcome Screen
 * - User Name Request & Profile Onboarding
 * - 3D Interactive Particle Matrix Starfield Canvas
 * - Real-Time 3D Mouse & Eye Tracking for Robot Mascot
 * - 3D Card Parallax & Specular Lighting Physics
 * - Multi-turn Conversation Memory with Gemini 3.6 Flash
 * - Speech-to-Text Voice Typing & Text-to-Speech Read Aloud
 * - Web Audio Synthesizer Sound FX
 * - Safe Markdown Renderer with Copyable Code Blocks
 */

(() => {
  'use strict';

  // ==========================================================================
  // Configuration & State
  // ==========================================================================
  const API_BASE_URL = 'http://localhost:5000';
  const STORAGE_KEYS = {
    THEME: 'gemini_chatbot_theme',
    SESSION_ID: 'gemini_chatbot_session_id',
    SOUND_ENABLED: 'gemini_chatbot_sound',
    USER_NAME: 'gemini_chatbot_user_name',
    SESSIONS: 'gemini_chatbot_saved_sessions',
    SIDEBAR_COLLAPSED: 'gemini_chatbot_sidebar_collapsed',
  };

  let userName = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  let activeSessionId = null;
  let savedSessions = []; // Array<{ id, title, messages, createdAt, updatedAt }>
  let isWaitingForResponse = false;
  let isBackendOnline = false;
  let soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
  let isRecording = false;
  let speechRecognition = null;
  let lastUserMessage = '';

  // Prompt suggestions by category
  const PROMPT_CATEGORIES = {
    code: [
      { icon: '💻', title: 'JavaScript Closures', prompt: 'Explain JavaScript closures with clear, practical code examples.' },
      { icon: '⚡', title: 'Python REST API', prompt: 'Write a Python script that fetches data from a REST API and saves it into a JSON file.' },
      { icon: '🎨', title: 'CSS Grid & Flexbox', prompt: 'Show me how to build a responsive navbar and 3D card grid using modern CSS.' },
      { icon: '🛠️', title: 'Debug SQL Query', prompt: 'How do I optimize a slow SQL SELECT query with multiple JOINs?' },
    ],
    creative: [
      { icon: '✍️', title: 'Professional Email', prompt: 'Draft a polite and professional follow-up email after a job interview.' },
      { icon: '📖', title: 'Sci-Fi Short Story', prompt: 'Write an engaging short story about a sentient robot exploring an ancient starship.' },
      { icon: '📝', title: 'Tech Blog Intro', prompt: 'Write an attention-grabbing introduction for a blog post about AI in modern web apps.' },
      { icon: '🎭', title: 'Product Pitch', prompt: 'Create a 30-second elevator pitch for an AI-driven personal developer tool.' },
    ],
    learn: [
      { icon: '🚀', title: 'Web Performance 2026', prompt: 'What are the top web performance optimization techniques and Core Web Vitals best practices?' },
      { icon: '🧠', title: 'Explain Like I\'m 5', prompt: 'Explain how Large Language Models work in simple terms that a 5-year-old can understand.' },
      { icon: '📐', title: 'System Design Basics', prompt: 'Explain the core principles of designing a scalable distributed web application.' },
      { icon: '💡', title: 'Senior Dev Habits', prompt: 'What are the most effective mental models used by senior software engineers?' },
    ],
    science: [
      { icon: '⚛️', title: 'Quantum Computing', prompt: 'Explain quantum superposition and qubits in a straightforward, conceptual way.' },
      { icon: '🧬', title: 'CRISPR Gene Editing', prompt: 'How does CRISPR-Cas9 work and what are its current real-world applications?' },
      { icon: '🌌', title: 'James Webb Telescope', prompt: 'What are the most scientific discoveries made by the JWST so far?' },
      { icon: '🤖', title: 'Neural Networks 101', prompt: 'How do weights, biases, and activation functions work in an artificial neural network?' },
    ],
  };

  function getRobotQuips(name) {
    const greetingName = name || 'Human';
    return [
      `⚡ 3D Spatial sensors locked on! Ready to assist, ${greetingName}!`,
      `🤖 Neural circuits fully charged with Gemini 3.6 Flash!`,
      `🚀 Click any previous chat in the sidebar to review your past conversation!`,
      `👀 I see your cursor! Move around and watch my eyes track you!`,
      `💡 Start a new chat or pick a prompt below to begin!`,
    ];
  }

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const chatMain = document.getElementById('chatMain');
  const messagesList = document.getElementById('messagesList');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const charCount = document.getElementById('charCount');
  const typingIndicator = document.getElementById('typingIndicator');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const exportChatBtn = document.getElementById('exportChatBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const voiceInputBtn = document.getElementById('voiceInputBtn');
  const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
  const clearModalBackdrop = document.getElementById('clearModalBackdrop');
  const cancelClearBtn = document.getElementById('cancelClearBtn');
  const confirmClearBtn = document.getElementById('confirmClearBtn');
  const toastContainer = document.getElementById('toastContainer');
  const robotHeroCard = document.getElementById('robotHeroCard');
  const robotSpeechText = document.getElementById('robotSpeechText');
  const robotSpeech = document.getElementById('robotSpeech');
  const cardShine = document.getElementById('cardShine');
  const categoryTabs = document.querySelectorAll('.tab-btn');
  const suggestionChipsContainer = document.getElementById('suggestionChipsContainer');
  const particleCanvas = document.getElementById('bgParticleCanvas');
  const welcomeUserGreeting = document.getElementById('welcomeUserGreeting');
  const activeChatTitle = document.getElementById('activeChatTitle');
  const recentChatsHero = document.getElementById('recentChatsHero');
  const recentChatsGrid = document.getElementById('recentChatsGrid');

  // History Sidebar Elements
  const historySidebar = document.getElementById('historySidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const historySearchInput = document.getElementById('historySearchInput');
  const historySessionsList = document.getElementById('historySessionsList');
  const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');

  // User Profile & Name Modal Elements
  const userProfileBtn = document.getElementById('userProfileBtn');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const nameModalBackdrop = document.getElementById('nameModalBackdrop');
  const nameForm = document.getElementById('nameForm');
  const userNameInput = document.getElementById('userNameInput');
  const saveNameBtn = document.getElementById('saveNameBtn');
  const skipNameBtn = document.getElementById('skipNameBtn');

  // Robot 3D Tracking Elements
  const eyePupilLeft = document.getElementById('eyePupilLeft');
  const eyePupilRight = document.getElementById('eyePupilRight');
  const eyeHighlightLeft = document.getElementById('eyeHighlightLeft');
  const eyeHighlightRight = document.getElementById('eyeHighlightRight');
  const robotHeadGroup = document.getElementById('robotHeadGroup');

  // ==========================================================================
  // Chat History Manager
  // ==========================================================================
  function loadHistoryFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      savedSessions = stored ? JSON.parse(stored) : [];
    } catch {
      savedSessions = [];
    }
  }

  function saveHistoryToStorage() {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(savedSessions));
  }

  function setupSidebarState() {
    // Keep sidebar open on desktop by default
    const isMobile = window.innerWidth <= 850;
    if (isMobile) {
      historySidebar.classList.add('collapsed');
      sidebarBackdrop.classList.add('hidden');
    } else {
      const isCollapsed = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
      if (isCollapsed) {
        historySidebar.classList.add('collapsed');
      } else {
        historySidebar.classList.remove('collapsed');
      }
      sidebarBackdrop.classList.add('hidden');
    }
  }

  function renderHistorySidebar(filterQuery = '') {
    historySessionsList.innerHTML = '';
    const query = filterQuery.toLowerCase().trim();

    const filtered = query
      ? savedSessions.filter(s => s.title.toLowerCase().includes(query))
      : savedSessions;

    renderRecentChatsHero();

    if (filtered.length === 0) {
      historySessionsList.innerHTML = `
        <div class="empty-history-notice">
          <span class="empty-history-icon">💬</span>
          <p>${query ? 'No matching conversations found.' : 'No previous chats yet.<br>Send a message to save your history!'}</p>
        </div>
      `;
      return;
    }

    // Group sessions by date
    const groups = {
      today: [],
      yesterday: [],
      previous7: [],
      older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;

    filtered.forEach(session => {
      const sessionTime = new Date(session.updatedAt || session.createdAt).getTime();
      if (sessionTime >= todayStart) {
        groups.today.push(session);
      } else if (sessionTime >= yesterdayStart) {
        groups.yesterday.push(session);
      } else if (sessionTime >= weekStart) {
        groups.previous7.push(session);
      } else {
        groups.older.push(session);
      }
    });

    function appendGroup(label, items) {
      if (items.length === 0) return;
      const groupHeader = document.createElement('div');
      groupHeader.className = 'history-group-label';
      groupHeader.textContent = label;
      historySessionsList.appendChild(groupHeader);

      items.forEach(session => {
        const item = document.createElement('div');
        item.className = `history-session-item ${session.id === activeSessionId ? 'active' : ''}`;
        item.setAttribute('data-id', session.id);
        
        const count = session.messages ? session.messages.length : 0;
        const msgLabel = count === 1 ? '1 msg' : `${count} msgs`;

        item.innerHTML = `
          <div class="session-info">
            <span class="session-icon">💬</span>
            <div class="session-text-wrapper">
              <span class="session-title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</span>
              <span class="session-submeta">${msgLabel}</span>
            </div>
          </div>
          <button type="button" class="session-delete-btn" title="Delete conversation" aria-label="Delete chat">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        `;

        item.addEventListener('click', (e) => {
          if (e.target.closest('.session-delete-btn')) {
            e.stopPropagation();
            deleteSession(session.id);
          } else {
            switchToSession(session.id);
          }
        });

        historySessionsList.appendChild(item);
      });
    }

    appendGroup('Today', groups.today);
    appendGroup('Yesterday', groups.yesterday);
    appendGroup('Previous 7 Days', groups.previous7);
    appendGroup('Older Conversations', groups.older);
  }

  function renderRecentChatsHero() {
    if (!recentChatsHero || !recentChatsGrid) return;

    if (savedSessions.length === 0) {
      recentChatsHero.classList.add('hidden');
      return;
    }

    recentChatsHero.classList.remove('hidden');
    recentChatsGrid.innerHTML = '';

    const recents = savedSessions.slice(0, 4);
    recents.forEach(session => {
      const card = document.createElement('div');
      card.className = 'recent-chat-card';
      const msgCount = session.messages ? session.messages.length : 0;
      const dateStr = session.updatedAt ? new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent';

      card.innerHTML = `
        <span class="recent-chat-card-title">${escapeHtml(session.title)}</span>
        <div class="recent-chat-card-meta">
          <span>💬 ${msgCount} messages</span>
          <span>${dateStr}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        switchToSession(session.id);
      });

      recentChatsGrid.appendChild(card);
    });
  }

  function getOrCreateActiveSession(firstMessage = '') {
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID ? crypto.randomUUID() : 'session_' + Date.now();
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, activeSessionId);

      const title = firstMessage.length > 32 ? firstMessage.substring(0, 32) + '...' : firstMessage || 'New Chat';
      const newSession = {
        id: activeSessionId,
        title: title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      savedSessions.unshift(newSession);
      saveHistoryToStorage();
      updateHeaderTitle(title);
      renderHistorySidebar(historySearchInput.value);
      return newSession;
    }

    let current = savedSessions.find(s => s.id === activeSessionId);
    if (!current) {
      const title = firstMessage.length > 32 ? firstMessage.substring(0, 32) + '...' : firstMessage || 'Chat';
      current = {
        id: activeSessionId,
        title: title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      savedSessions.unshift(current);
      saveHistoryToStorage();
      updateHeaderTitle(title);
      renderHistorySidebar(historySearchInput.value);
    }
    return current;
  }

  function saveMessageToActiveSession(msgObj) {
    const session = getOrCreateActiveSession(msgObj.text);
    session.messages.push(msgObj);
    session.updatedAt = new Date().toISOString();

    if (session.messages.length === 1 && msgObj.sender === 'user') {
      session.title = msgObj.text.length > 32 ? msgObj.text.substring(0, 32) + '...' : msgObj.text;
      updateHeaderTitle(session.title);
    }

    saveHistoryToStorage();
    renderHistorySidebar(historySearchInput.value);
  }

  function switchToSession(sessionId) {
    const session = savedSessions.find(s => s.id === sessionId);
    if (!session) return;

    activeSessionId = session.id;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, activeSessionId);
    updateHeaderTitle(session.title);

    // Render messages onto the screen
    messagesList.innerHTML = '';
    welcomeScreen.classList.add('hidden');

    session.messages.forEach(msg => {
      appendMessageToDOM(msg);
    });

    renderHistorySidebar(historySearchInput.value);
    scrollToBottom();
    playSound('click');

    if (window.innerWidth <= 850) {
      closeSidebar();
    }
    showToast(`Loaded "${session.title}"`, 'info');
  }

  function updateHeaderTitle(title) {
    if (activeChatTitle) {
      activeChatTitle.textContent = title || 'New Chat';
    }
  }

  function startNewChat() {
    activeSessionId = null;
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    messagesList.innerHTML = '';
    welcomeScreen.classList.remove('hidden');
    updateHeaderTitle('New Chat');
    updateUserInterfaceName();
    renderHistorySidebar(historySearchInput.value);
    messageInput.focus();
    playSound('click');

    if (window.innerWidth <= 850) {
      closeSidebar();
    }
    showToast('Started a new conversation session.', 'info');
  }

  function deleteSession(sessionId) {
    const idx = savedSessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return;

    savedSessions.splice(idx, 1);
    saveHistoryToStorage();
    playSound('click');

    fetch(`${API_BASE_URL}/api/chat/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});

    if (activeSessionId === sessionId) {
      startNewChat();
    } else {
      renderHistorySidebar(historySearchInput.value);
    }
    showToast('Conversation deleted.', 'info');
  }

  function clearAllHistory() {
    if (savedSessions.length === 0) {
      showToast('History is already empty.', 'info');
      return;
    }

    if (confirm('Are you sure you want to delete ALL saved conversations?')) {
      savedSessions = [];
      saveHistoryToStorage();
      startNewChat();
      showToast('All chat history cleared.', 'info');
    }
  }

  // Sidebar Controls
  function toggleSidebar() {
    historySidebar.classList.toggle('collapsed');
    const isCollapsed = historySidebar.classList.contains('collapsed');
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, isCollapsed);

    if (window.innerWidth <= 850) {
      if (!isCollapsed) {
        sidebarBackdrop.classList.remove('hidden');
      } else {
        sidebarBackdrop.classList.add('hidden');
      }
    }
    playSound('click');
  }

  function openSidebar() {
    historySidebar.classList.remove('collapsed');
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
    if (window.innerWidth <= 850) {
      sidebarBackdrop.classList.remove('hidden');
    }
  }

  function closeSidebar() {
    historySidebar.classList.add('collapsed');
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, true);
    sidebarBackdrop.classList.add('hidden');
  }

  // ==========================================================================
  // 3D Background Particle Matrix Canvas
  // ==========================================================================
  function init3DParticleCanvas() {
    if (!particleCanvas) return;
    const ctx = particleCanvas.getContext('2d');
    if (!ctx) return;

    let width = (particleCanvas.width = window.innerWidth);
    let height = (particleCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = particleCanvas.width = window.innerWidth;
      height = particleCanvas.height = window.innerHeight;
    });

    const FOCAL_LENGTH = 350;
    const PARTICLE_COUNT = 75;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 - 200,
        radius: Math.random() * 2 + 1.2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.5,
        color: i % 3 === 0 ? '#4285F4' : (i % 3 === 1 ? '#9B72CF' : '#00f2fe'),
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - width / 2) * 0.0003;
      mouseY = (e.clientY - height / 2) * 0.0003;
    });

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      targetRotX += (mouseY - targetRotX) * 0.05;
      targetRotY += (mouseX - targetRotY) * 0.05;

      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.z > 600) p.z = -200;
        if (p.z < -200) p.z = 600;
        if (p.x > width * 0.8) p.x = -width * 0.8;
        if (p.x < -width * 0.8) p.x = width * 0.8;
        if (p.y > height * 0.8) p.y = -height * 0.8;
        if (p.y < -height * 0.8) p.y = height * 0.8;

        let rx = p.x * Math.cos(targetRotY) - p.z * Math.sin(targetRotY);
        let rz = p.z * Math.cos(targetRotY) + p.x * Math.sin(targetRotY);
        let ry = p.y * Math.cos(targetRotX) - rz * Math.sin(targetRotX);
        rz = rz * Math.cos(targetRotX) + p.y * Math.sin(targetRotX);

        const depth = rz + FOCAL_LENGTH;
        if (depth > 0) {
          const scale = FOCAL_LENGTH / depth;
          const projX = rx * scale + width / 2;
          const projY = ry * scale + height / 2;
          const alpha = Math.min(1, Math.max(0.1, (1 - rz / 700) * 0.7));

          projected.push({ x: projX, y: projY, scale, alpha, color: p.color, radius: p.radius });

          ctx.beginPath();
          ctx.arc(projX, projY, p.radius * scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.strokeStyle = projected[i].color;
            ctx.globalAlpha = (1 - dist / 110) * 0.22 * projected[i].alpha;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  // ==========================================================================
  // Real-Time 3D Mouse & Eye Tracking for Robot Mascot
  // ==========================================================================
  function setup3DRobotTracking() {
    window.addEventListener('mousemove', (e) => {
      if (!robotHeroCard || welcomeScreen.classList.contains('hidden')) return;

      const rect = robotHeroCard.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - cardCenterX;
      const deltaY = e.clientY - cardCenterY;

      const maxTilt = 14;
      const rotY = Math.max(-maxTilt, Math.min(maxTilt, (deltaX / (window.innerWidth / 2)) * maxTilt));
      const rotX = Math.max(-maxTilt, Math.min(maxTilt, -(deltaY / (window.innerHeight / 2)) * maxTilt));

      robotHeroCard.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

      if (cardShine) {
        const shineX = ((e.clientX - rect.left) / rect.width) * 100;
        const shineY = ((e.clientY - rect.top) / rect.height) * 100;
        cardShine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.16) 0%, transparent 60%)`;
      }

      const maxEyeShift = 5;
      const eyeShiftX = Math.max(-maxEyeShift, Math.min(maxEyeShift, deltaX * 0.018));
      const eyeShiftY = Math.max(-maxEyeShift, Math.min(maxEyeShift, deltaY * 0.018));

      if (eyePupilLeft && eyePupilRight) {
        eyePupilLeft.style.transform = `translate(${eyeShiftX}px, ${eyeShiftY}px)`;
        eyePupilRight.style.transform = `translate(${eyeShiftX}px, ${eyeShiftY}px)`;
      }
      if (eyeHighlightLeft && eyeHighlightRight) {
        eyeHighlightLeft.style.transform = `translate(${eyeShiftX * 0.8}px, ${eyeShiftY * 0.8}px)`;
        eyeHighlightRight.style.transform = `translate(${eyeShiftX * 0.8}px, ${eyeShiftY * 0.8}px)`;
      }

      if (robotHeadGroup) {
        const headShiftX = eyeShiftX * 0.6;
        const headShiftY = eyeShiftY * 0.6;
        robotHeadGroup.style.transform = `translate(${headShiftX}px, ${headShiftY}px)`;
      }
    });

    if (robotHeroCard) {
      robotHeroCard.addEventListener('mouseleave', () => {
        robotHeroCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        if (eyePupilLeft && eyePupilRight) {
          eyePupilLeft.style.transform = `translate(0, 0)`;
          eyePupilRight.style.transform = `translate(0, 0)`;
        }
        if (robotHeadGroup) robotHeadGroup.style.transform = `translate(0, 0)`;
      });
    }
  }

  // ==========================================================================
  // Web Audio Synthesizer (Sound FX)
  // ==========================================================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'receive') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {}
  }

  // ==========================================================================
  // User Name Onboarding & Personalization
  // ==========================================================================
  function setupUserProfile() {
    updateUserInterfaceName();

    if (!userName) {
      setTimeout(() => openNameModal(), 500);
    }

    userProfileBtn.addEventListener('click', () => {
      playSound('click');
      openNameModal();
    });

    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveName();
    });

    saveNameBtn.addEventListener('click', handleSaveName);

    skipNameBtn.addEventListener('click', () => {
      playSound('click');
      closeNameModal();
      if (!userName) {
        userName = 'Friend';
        updateUserInterfaceName();
      }
    });
  }

  function openNameModal() {
    userNameInput.value = userName === 'Friend' || userName === 'Guest' ? '' : userName;
    nameModalBackdrop.classList.remove('hidden');
    setTimeout(() => userNameInput.focus(), 100);
  }

  function closeNameModal() {
    nameModalBackdrop.classList.add('hidden');
    messageInput.focus();
  }

  function handleSaveName() {
    const inputVal = userNameInput.value.trim();
    if (!inputVal) {
      userNameInput.focus();
      return;
    }

    userName = inputVal;
    localStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
    updateUserInterfaceName();
    closeNameModal();
    playSound('success');

    showToast(`Nice to meet you, ${userName}! 🚀`, 'success');
  }

  function updateUserInterfaceName() {
    const displayName = userName || 'Guest';
    const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';

    headerUserName.textContent = displayName;
    headerUserAvatar.textContent = avatarInitial;

    if (welcomeUserGreeting) {
      welcomeUserGreeting.textContent = userName || 'Friend';
    }

    if (robotSpeechText) {
      robotSpeechText.textContent = userName 
        ? `👋 Hello, ${userName}! Select a previous chat or ask me anything!`
        : `👋 Hi! I'm GemiBot 3D. Move your mouse around me or ask me anything!`;
    }
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  function init() {
    init3DParticleCanvas();
    loadHistoryFromStorage();
    setupSidebarState();
    setupTheme();
    setupSoundToggle();
    setupVoiceRecognition();
    setupCategoryTabs();
    setupUserProfile();
    setupEventListeners();
    setup3DRobotTracking();
    renderSuggestions('code');
    renderHistorySidebar();
    checkBackendHealth();
    
    setInterval(checkBackendHealth, 20000);
    messageInput.focus();
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================
  function setupTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    playSound('click');
  }

  // ==========================================================================
  // Sound FX UI Toggle
  // ==========================================================================
  function setupSoundToggle() {
    updateSoundIcons();
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, soundEnabled);
      updateSoundIcons();
      if (soundEnabled) playSound('click');
      showToast(soundEnabled ? '🔊 Sound effects enabled' : '🔇 Sound effects muted', 'info');
    });
  }

  function updateSoundIcons() {
    const soundOn = soundToggleBtn.querySelector('.sound-on-icon');
    const soundOff = soundToggleBtn.querySelector('.sound-off-icon');
    if (soundEnabled) {
      soundOn.classList.remove('hidden');
      soundOff.classList.add('hidden');
    } else {
      soundOn.classList.add('hidden');
      soundOff.classList.remove('hidden');
    }
  }

  // ==========================================================================
  // Voice Input (Speech to Text)
  // ==========================================================================
  function setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceInputBtn.style.display = 'none';
      return;
    }

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onstart = () => {
      isRecording = true;
      voiceInputBtn.classList.add('recording');
      voiceInputBtn.querySelector('.mic-recording-pulse').classList.remove('hidden');
      showToast('🎙️ Listening... Speak your prompt', 'info');
    };

    speechRecognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      messageInput.value = transcript;
      handleInputChange();
    };

    speechRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopVoiceRecording();
      showToast(`Mic Error: ${event.error}`, 'error');
    };

    speechRecognition.onend = () => {
      stopVoiceRecording();
      if (messageInput.value.trim().length > 0 && !isWaitingForResponse) {
        sendMessage(messageInput.value.trim());
      }
    };

    voiceInputBtn.addEventListener('click', () => {
      if (isRecording) {
        speechRecognition.stop();
      } else {
        try {
          speechRecognition.start();
        } catch {}
      }
    });
  }

  function stopVoiceRecording() {
    isRecording = false;
    voiceInputBtn.classList.remove('recording');
    voiceInputBtn.querySelector('.mic-recording-pulse').classList.add('hidden');
  }

  // ==========================================================================
  // Category Tabs & Suggestion Rendering
  // ==========================================================================
  function setupCategoryTabs() {
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const category = tab.getAttribute('data-category');
        renderSuggestions(category);
        playSound('click');
      });
    });
  }

  function renderSuggestions(category) {
    const list = PROMPT_CATEGORIES[category] || PROMPT_CATEGORIES.code;
    suggestionChipsContainer.innerHTML = '';

    list.forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'suggestion-chip';
      chip.setAttribute('data-prompt', item.prompt);
      chip.innerHTML = `
        <span class="chip-icon">${item.icon}</span>
        <div class="chip-text">
          <strong>${item.title}</strong>
        </div>
      `;

      chip.addEventListener('click', () => {
        if (!isWaitingForResponse) {
          messageInput.value = item.prompt;
          handleInputChange();
          sendMessage(item.prompt);
        }
      });

      suggestionChipsContainer.appendChild(chip);
    });
  }

  // ==========================================================================
  // Interactive Robot Mascot Click Reactions
  // ==========================================================================
  function setupRobotHero() {
    if (!robotHeroCard) return;
    let quipIndex = 0;

    robotHeroCard.addEventListener('click', () => {
      playSound('click');
      const quips = getRobotQuips(userName);
      quipIndex = (quipIndex + 1) % quips.length;
      
      robotSpeech.style.animation = 'none';
      void robotSpeech.offsetWidth;
      robotSpeech.style.animation = 'speechBubblePop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      robotSpeechText.textContent = quips[quipIndex];
    });
  }

  // ==========================================================================
  // Backend Connectivity Check
  // ==========================================================================
  async function checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          updateStatus(true, 'Online & Ready');
          return;
        }
      }
      updateStatus(false, 'Unavailable');
    } catch {
      updateStatus(false, 'Offline (Port 5000)');
    }
  }

  function updateStatus(isOnline, text) {
    isBackendOnline = isOnline;
    statusText.textContent = text;
    if (isOnline) {
      statusDot.className = 'status-dot online';
    } else {
      statusDot.className = 'status-dot offline';
    }
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);
    chatForm.addEventListener('submit', handleFormSubmit);
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keydown', handleInputKeydown);
    setupRobotHero();

    exportChatBtn.addEventListener('click', exportConversation);

    // History Sidebar Listeners
    toggleHistoryBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
    newChatBtn.addEventListener('click', startNewChat);
    clearAllHistoryBtn.addEventListener('click', clearAllHistory);
    historySearchInput.addEventListener('input', (e) => {
      renderHistorySidebar(e.target.value);
    });

    // Clear Chat Modal Listeners
    clearChatBtn.addEventListener('click', openClearModal);
    cancelClearBtn.addEventListener('click', closeClearModal);
    confirmClearBtn.addEventListener('click', handleClearChat);

    clearModalBackdrop.addEventListener('click', (e) => {
      if (e.target === clearModalBackdrop) closeClearModal();
    });

    nameModalBackdrop.addEventListener('click', (e) => {
      if (e.target === nameModalBackdrop) closeNameModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!clearModalBackdrop.classList.contains('hidden')) closeClearModal();
        if (!nameModalBackdrop.classList.contains('hidden')) closeNameModal();
        if (!historySidebar.classList.contains('collapsed') && window.innerWidth <= 850) closeSidebar();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 850) {
        sidebarBackdrop.classList.add('hidden');
      }
    });

    chatMain.addEventListener('scroll', handleScroll);
    scrollToBottomBtn.addEventListener('click', scrollToBottom);

    messagesList.addEventListener('click', handleMessageActionDelegation);
  }

  // ==========================================================================
  // Input Handling
  // ==========================================================================
  function handleInputChange() {
    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 160);
    messageInput.style.height = `${newHeight}px`;

    const length = messageInput.value.length;
    charCount.textContent = `${length} / 4000`;

    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasText || isWaitingForResponse;
  }

  function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled && !isWaitingForResponse) {
        chatForm.requestSubmit();
      }
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;
    sendMessage(message);
  }

  // ==========================================================================
  // Message Transmission & API Communication
  // ==========================================================================
  async function sendMessage(userText) {
    lastUserMessage = userText;
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    handleInputChange();

    welcomeScreen.classList.add('hidden');

    const userTime = formatTime(new Date());
    const userMsgObj = {
      sender: 'user',
      text: userText,
      timestamp: userTime,
    };

    appendMessageToDOM(userMsgObj);
    saveMessageToActiveSession(userMsgObj);

    playSound('send');
    setLoadingState(true);
    scrollToBottom();

    try {
      const payload = { message: userText };
      if (activeSessionId) payload.sessionId = activeSessionId;

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || `Server responded with status ${response.status}`;
        throw new Error(errorMsg);
      }

      if (data.sessionId && !activeSessionId) {
        activeSessionId = data.sessionId;
        sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, activeSessionId);
      }

      const replyText = data.reply || "I'm sorry, I was unable to generate a response.";
      const aiTime = formatTime(new Date());
      const aiMsgObj = {
        sender: 'ai',
        text: replyText,
        timestamp: aiTime,
      };

      appendMessageToDOM(aiMsgObj);
      saveMessageToActiveSession(aiMsgObj);

      playSound('receive');
      updateStatus(true, 'Online & Ready');
    } catch (err) {
      console.error('[Chat Error]:', err);
      
      const isNetworkError = err.name === 'TypeError' && err.message.includes('fetch');
      const displayError = isNetworkError 
        ? 'Could not connect to backend server. Make sure the Node.js server is running on port 5000'
        : (err.message || 'An error occurred while communicating with Gemini.');

      const errorMsgObj = {
        sender: 'ai',
        text: `⚠️ **Error:** ${displayError}`,
        timestamp: formatTime(new Date()),
        isError: true,
      };

      appendMessageToDOM(errorMsgObj);
      showToast(displayError, 'error');
      if (isNetworkError) updateStatus(false, 'Offline');
    } finally {
      setLoadingState(false);
      scrollToBottom();
      messageInput.focus();
    }
  }

  function setLoadingState(loading) {
    isWaitingForResponse = loading;
    sendButton.disabled = loading || messageInput.value.trim().length === 0;
    
    if (loading) {
      typingIndicator.classList.remove('hidden');
      typingIndicator.removeAttribute('aria-hidden');
    } else {
      typingIndicator.classList.add('hidden');
      typingIndicator.setAttribute('aria-hidden', 'true');
    }
  }

  // ==========================================================================
  // Message Rendering & Markdown Parser
  // ==========================================================================
  function appendMessageToDOM({ sender, text, timestamp, isError = false }) {
    const isUser = sender === 'user';
    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user-row' : 'ai-row'}`;

    const userInitial = (userName && userName !== 'Guest' && userName !== 'Friend') 
      ? userName.charAt(0).toUpperCase() 
      : 'U';

    const userAvatarHtml = `
      <div class="message-avatar user-avatar" aria-hidden="true" title="${escapeHtml(userName || 'You')}">
        <span>${userInitial}</span>
      </div>`;

    const botAvatarHtml = `
      <div class="message-avatar bot-avatar-animated avatar-3d" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="30" height="30">
          <ellipse cx="50" cy="50" rx="46" ry="14" fill="none" stroke="#00f2fe" stroke-width="2" class="mini-orbit-ring"/>
          <circle cx="50" cy="18" r="5" fill="#00f2fe" class="mini-antenna-light"/>
          <rect x="22" y="32" width="56" height="42" rx="12" fill="#1b202e" stroke="#4285f4" stroke-width="2"/>
          <rect x="28" y="38" width="44" height="22" rx="6" fill="#070a12"/>
          <circle cx="40" cy="49" r="4.5" fill="#00f2fe" class="mini-eye-left"/>
          <circle cx="60" cy="49" r="4.5" fill="#00f2fe" class="mini-eye-right"/>
        </svg>
      </div>`;

    const renderedContent = isUser ? escapeHtml(text).replace(/\n/g, '<br>') : parseMarkdown(text);

    const actionsToolbar = !isUser && !isError ? `
      <div class="message-actions">
        <button type="button" class="action-btn-mini btn-read-aloud" title="Read Aloud" aria-label="Read message aloud">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
          <span>Speak</span>
        </button>
        <button type="button" class="action-btn-mini btn-copy-msg" title="Copy Message Text" aria-label="Copy message text">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </button>
        <button type="button" class="action-btn-mini btn-regenerate" title="Regenerate Response" aria-label="Regenerate response">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>Retry</span>
        </button>
      </div>
    ` : '';

    row.innerHTML = `
      ${!isUser ? botAvatarHtml : ''}
      <div class="message-bubble-container">
        <div class="message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'} ${isError ? 'error-bubble' : ''}" data-raw-text="${escapeHtml(text)}">
          ${renderedContent}
        </div>
        <div class="message-meta">
          <span class="message-timestamp">${timestamp}</span>
          ${actionsToolbar}
        </div>
      </div>
      ${isUser ? userAvatarHtml : ''}
    `;

    messagesList.appendChild(row);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseMarkdown(markdown) {
    if (!markdown) return '';

    const codeBlocks = [];
    let processed = markdown.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      const cleanLang = lang.trim() || 'code';
      const escapedCode = escapeHtml(code.replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, ''));
      
      const codeHtml = `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-lang">${escapeHtml(cleanLang)}</span>
            <button type="button" class="copy-code-btn" aria-label="Copy code to clipboard">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
          <pre class="code-content"><code>${escapedCode}</code></pre>
        </div>
      `;
      codeBlocks.push(codeHtml);
      return token;
    });

    processed = escapeHtml(processed);
    processed = processed.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    processed = processed.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processed = processed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processed = processed.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
    processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
    processed = processed.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    processed = processed.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    processed = processed.replace(/^>\s?(.*$)/gim, '<blockquote>$1</blockquote>');
    processed = processed.replace(/^---$/gim, '<hr>');

    processed = processTables(processed);
    processed = processLists(processed);

    const paragraphs = processed.split(/\n{2,}/);
    processed = paragraphs
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        if (
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<div class="code-block-wrapper"') ||
          trimmed.startsWith('<ul>') ||
          trimmed.startsWith('<ol>') ||
          trimmed.startsWith('<blockquote>') ||
          trimmed.startsWith('<div class="table-wrapper"') ||
          trimmed.startsWith('<hr>') ||
          trimmed.startsWith('__CODE_BLOCK_')
        ) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    codeBlocks.forEach((codeHtml, idx) => {
      processed = processed.replace(`__CODE_BLOCK_${idx}__`, codeHtml);
    });

    return processed;
  }

  function processLists(text) {
    const lines = text.split('\n');
    let inUl = false;
    let inOl = false;
    const output = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ulMatch = line.match(/^[\*\-]\s+(.+)/);
      const olMatch = line.match(/^(\d+)\.\s+(.+)/);

      if (ulMatch) {
        if (inOl) { output.push('</ol>'); inOl = false; }
        if (!inUl) { output.push('<ul>'); inUl = true; }
        output.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (inUl) { output.push('</ul>'); inUl = false; }
        if (!inOl) { output.push('<ol>'); inOl = true; }
        output.push(`<li>${olMatch[2]}</li>`);
      } else {
        if (inUl) { output.push('</ul>'); inUl = false; }
        if (inOl) { output.push('</ol>'); inOl = false; }
        output.push(line);
      }
    }

    if (inUl) output.push('</ul>');
    if (inOl) output.push('</ol>');

    return output.join('\n');
  }

  function processTables(text) {
    const tableRegex = /((?:\|[^\n]+\|\r?\n)+)/g;
    return text.replace(tableRegex, (match) => {
      const rows = match.trim().split('\n').map(r => r.trim());
      if (rows.length < 2) return match;

      const isHeaderSep = /^\|(\s*:?-+:?\s*\|)+$/.test(rows[1]);
      if (!isHeaderSep && rows.length < 3) return match;

      let html = '<div class="table-wrapper"><table>';
      const startIndex = isHeaderSep ? 2 : 0;

      if (isHeaderSep) {
        const headers = rows[0].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        html += '<thead><tr>';
        headers.forEach(h => { html += `<th>${h.trim()}</th>`; });
        html += '</tr></thead>';
      }

      html += '<tbody>';
      for (let r = startIndex; r < rows.length; r++) {
        if (rows[r] === rows[1] && isHeaderSep) continue;
        const cells = rows[r].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length > 0) {
          html += '<tr>';
          cells.forEach(c => { html += `<td>${c.trim()}</td>`; });
          html += '</tr>';
        }
      }
      html += '</tbody></table></div>';
      return html;
    });
  }

  // ==========================================================================
  // Message Actions Delegation
  // ==========================================================================
  async function handleMessageActionDelegation(e) {
    const copyCodeBtn = e.target.closest('.copy-code-btn');
    if (copyCodeBtn) {
      const codeWrapper = copyCodeBtn.closest('.code-block-wrapper');
      const codeElement = codeWrapper?.querySelector('code');
      if (codeElement) {
        await copyToClipboard(codeElement.textContent, copyCodeBtn, 'Copied!');
      }
      return;
    }

    const readAloudBtn = e.target.closest('.btn-read-aloud');
    if (readAloudBtn) {
      const row = readAloudBtn.closest('.message-row');
      const bubble = row?.querySelector('.message-bubble');
      if (bubble) {
        speakText(bubble.innerText || bubble.textContent, readAloudBtn);
      }
      return;
    }

    const copyMsgBtn = e.target.closest('.btn-copy-msg');
    if (copyMsgBtn) {
      const row = copyMsgBtn.closest('.message-row');
      const bubble = row?.querySelector('.message-bubble');
      if (bubble) {
        await copyToClipboard(bubble.innerText || bubble.textContent, copyMsgBtn, 'Copied!');
      }
      return;
    }

    const retryBtn = e.target.closest('.btn-regenerate');
    if (retryBtn && lastUserMessage && !isWaitingForResponse) {
      playSound('click');
      sendMessage(lastUserMessage);
    }
  }

  async function copyToClipboard(text, button, successLabel) {
    try {
      await navigator.clipboard.writeText(text);
      playSound('click');
      const span = button.querySelector('span');
      if (span) {
        const original = span.textContent;
        span.textContent = successLabel;
        button.classList.add('copied');
        setTimeout(() => {
          span.textContent = original;
          button.classList.remove('copied');
        }, 2000);
      }
      showToast('Copied to clipboard!', 'info');
    } catch {
      showToast('Failed to copy text.', 'error');
    }
  }

  function speakText(text, button) {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech not supported in this browser.', 'error');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.querySelectorAll('.btn-read-aloud').forEach(b => b.classList.remove('active-speech'));
      return;
    }

    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    button.classList.add('active-speech');

    utterance.onend = () => { button.classList.remove('active-speech'); };
    utterance.onerror = () => { button.classList.remove('active-speech'); };

    window.speechSynthesis.speak(utterance);
  }

  // ==========================================================================
  // Export Chat
  // ==========================================================================
  function exportConversation() {
    const session = savedSessions.find(s => s.id === activeSessionId);
    const messages = session ? session.messages : [];

    if (!messages || messages.length === 0) {
      showToast('No messages to export.', 'info');
      return;
    }

    let markdown = `# GemiBot 3D Conversation Export\n\n_Exported on ${new Date().toLocaleString()} by ${userName || 'User'}_\n\n---\n\n`;
    messages.forEach(msg => {
      const senderLabel = msg.sender === 'user' ? (userName || 'User') : 'GemiBot 3D';
      markdown += `### ${senderLabel} (${msg.timestamp})\n\n${msg.text}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemibot-3d-chat-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    playSound('click');
    showToast('Conversation exported as Markdown!', 'success');
  }

  // ==========================================================================
  // Clear Chat Modal & API
  // ==========================================================================
  function openClearModal() {
    clearModalBackdrop.classList.remove('hidden');
    confirmClearBtn.focus();
  }

  function closeClearModal() {
    clearModalBackdrop.classList.add('hidden');
    messageInput.focus();
  }

  async function handleClearChat() {
    closeClearModal();

    if (activeSessionId) {
      deleteSession(activeSessionId);
    } else {
      startNewChat();
    }
  }

  // ==========================================================================
  // Scroll Management
  // ==========================================================================
  function scrollToBottom() {
    chatMain.scrollTo({
      top: chatMain.scrollHeight,
      behavior: 'smooth',
    });
  }

  function handleScroll() {
    const isScrolledUp = chatMain.scrollHeight - chatMain.scrollTop - chatMain.clientHeight > 150;
    if (isScrolledUp) {
      scrollToBottomBtn.classList.remove('hidden');
    } else {
      scrollToBottomBtn.classList.add('hidden');
    }
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3800);
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
