require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const geminiApiKey = process.env.GEMINI_API_KEY;

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GEMINI_WINDOW_MS = 5 * 60 * 1000;
const GEMINI_MAX_REQUESTS = 20;

let genAIInstance = null;
const sessionStore = new Map();
const geminiUsageStore = new Map();

app.use(express.json({ limit: '1mb' }));

function ensureUsersFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, '[]', 'utf8');
    }
}

function readSessions() {
    try {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function writeSessions(sessions) {
    const payload = JSON.stringify(sessions, null, 2);
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.promises.writeFile(SESSIONS_FILE, payload, 'utf8').catch(() => {
        // Non-fatal: sessions will still work in-memory for this process lifetime.
    });
}

function loadSessionsFromFile() {
    const now = Date.now();
    const stored = readSessions();
    let changed = false;
    for (const [token, session] of Object.entries(stored)) {
        if (session?.email && now - (session.createdAt || 0) < SESSION_TTL_MS) {
            sessionStore.set(token, session);
        } else {
            changed = true;
        }
    }
    if (changed) {
        writeSessions(Object.fromEntries(sessionStore));
    }
}

function readUsers() {
    ensureUsersFile();

    try {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        fs.writeFileSync(USERS_FILE, '[]', 'utf8');
        return [];
    }
}

function writeUsers(users) {
    ensureUsersFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function sanitizeUser(user) {
    return {
        username: String(user?.username || '').trim(),
        email: String(user?.email || '').trim().toLowerCase()
    };
}

function buildPasswordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
    const normalizedPassword = String(password || '');
    const digest = crypto.scryptSync(normalizedPassword, salt, 64).toString('hex');
    return `${salt}:${digest}`;
}

function verifyPassword(password, storedHash) {
    if (typeof storedHash !== 'string' || !storedHash.includes(':')) {
        return false;
    }

    const [salt, digest] = storedHash.split(':');
    const computedDigest = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
    const expected = Buffer.from(digest, 'hex');
    const actual = Buffer.from(computedDigest, 'hex');

    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function createSession(userEmail) {
    const sessionToken = crypto.randomUUID();
    const session = { email: userEmail, createdAt: Date.now() };
    sessionStore.set(sessionToken, session);
    writeSessions(Object.fromEntries(sessionStore));
    return sessionToken;
}

function getGenAI() {
    if (!geminiApiKey) {
        const error = new Error('Gemini API key is missing. Set GEMINI_API_KEY in your server environment.');
        error.statusCode = 500;
        throw error;
    }

    if (!genAIInstance) {
        genAIInstance = new GoogleGenerativeAI(geminiApiKey);
    }

    return genAIInstance;
}

function buildHistory(history = []) {
    return history
        .filter((message) => typeof message?.content === 'string' && message.content.trim())
        .map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }]
        }));
}

function requireAuth(request, response, next) {
    const sessionToken = request.get('x-session-token');

    if (!sessionToken) {
        return response.status(401).json({ error: 'Authentication required.' });
    }

    const session = sessionStore.get(sessionToken);
    if (!session?.email) {
        return response.status(401).json({ error: 'Invalid session.' });
    }

    if (Date.now() - (session.createdAt || 0) >= SESSION_TTL_MS) {
        sessionStore.delete(sessionToken);
        writeSessions(Object.fromEntries(sessionStore));
        return response.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const users = readUsers();
    const user = users.find((entry) => entry.email === session.email);

    if (!user) {
        sessionStore.delete(sessionToken);
        writeSessions(Object.fromEntries(sessionStore));
        return response.status(401).json({ error: 'Account not found.' });
    }

    request.auth = {
        sessionToken,
        user: sanitizeUser(user)
    };

    return next();
}

function rateLimitGemini(request, response, next) {
    const token = request.auth?.sessionToken;
    const now = Date.now();
    const windowStart = now - GEMINI_WINDOW_MS;
    const currentTimestamps = geminiUsageStore.get(token) || [];
    const recentTimestamps = currentTimestamps.filter((timestamp) => timestamp > windowStart);

    if (recentTimestamps.length >= GEMINI_MAX_REQUESTS) {
        return response.status(429).json({
            error: 'Too many AI requests. Please wait a few minutes and try again.'
        });
    }

    recentTimestamps.push(now);
    geminiUsageStore.set(token, recentTimestamps);
    return next();
}

app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
});

app.post('/api/auth/register', (request, response) => {
    const { username, email, password } = request.body || {};
    const normalizedProfile = sanitizeUser({ username, email });
    const normalizedPassword = String(password || '');

    if (!normalizedProfile.username || !normalizedProfile.email || !normalizedPassword) {
        return response.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedProfile.email)) {
        return response.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (normalizedPassword.length < 6) {
        return response.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const users = readUsers();
    const existingUser = users.find((user) => user.email === normalizedProfile.email);

    if (existingUser) {
        return response.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userRecord = {
        ...normalizedProfile,
        passwordHash: buildPasswordHash(normalizedPassword),
        createdAt: new Date().toISOString()
    };

    users.push(userRecord);
    writeUsers(users);

    const sessionToken = createSession(userRecord.email);
    return response.status(201).json({
        user: sanitizeUser(userRecord),
        sessionToken
    });
});

app.post('/api/auth/login', (request, response) => {
    const normalizedEmail = String(request.body?.email || '').trim().toLowerCase();
    const password = String(request.body?.password || '');
    const users = readUsers();
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user || !verifyPassword(password, user.passwordHash)) {
        return response.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionToken = createSession(user.email);
    return response.json({
        user: sanitizeUser(user),
        sessionToken
    });
});

app.get('/api/auth/session', requireAuth, (request, response) => {
    response.json({
        user: request.auth.user
    });
});

app.post('/api/auth/logout', requireAuth, (request, response) => {
    sessionStore.delete(request.auth.sessionToken);
    geminiUsageStore.delete(request.auth.sessionToken);
    writeSessions(Object.fromEntries(sessionStore));
    response.json({ ok: true });
});

app.post('/api/gemini/text', requireAuth, rateLimitGemini, async (request, response) => {
    const { systemPrompt, userMessage, conversationHistory = [] } = request.body || {};

    if (typeof systemPrompt !== 'string' || typeof userMessage !== 'string' || !userMessage.trim()) {
        return response.status(400).json({ error: 'Invalid Gemini text request payload.' });
    }

    try {
        const model = getGenAI().getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt
        });

        const chat = model.startChat({
            history: buildHistory(conversationHistory)
        });
        const result = await chat.sendMessage(userMessage);

        return response.json({
            text: result.response.text()
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return response.status(statusCode).json({
            error: error.message || 'Gemini text request failed.'
        });
    }
});

app.post('/api/gemini/json', requireAuth, rateLimitGemini, async (request, response) => {
    const { systemPrompt, userMessage } = request.body || {};

    if (typeof systemPrompt !== 'string' || typeof userMessage !== 'string' || !userMessage.trim()) {
        return response.status(400).json({ error: 'Invalid Gemini JSON request payload.' });
    }

    try {
        const model = getGenAI().getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
            generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent(userMessage);
        const text = result.response.text();

        return response.json({
            data: JSON.parse(text)
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return response.status(statusCode).json({
            error: error.message || 'Gemini JSON request failed.'
        });
    }
});

if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'build');
    app.use(express.static(buildPath));

    app.get('*', (_request, response) => {
        response.sendFile(path.join(buildPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    ensureUsersFile();
    loadSessionsFromFile();
    console.log(`CodeCampus server listening on http://localhost:${PORT}`);
});
