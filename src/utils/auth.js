const SESSION_TOKEN_KEY = 'sessionToken';

function getStoredSessionToken() {
    return localStorage.getItem(SESSION_TOKEN_KEY) || '';
}

function storeSessionToken(sessionToken) {
    if (sessionToken) {
        localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    }
}

function clearStoredSessionToken() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
}

async function parseJsonResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function requestAuth(path, options = {}) {
    const sessionToken = getStoredSessionToken();
    const response = await fetch(path, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
        const error = new Error(data?.error || 'Authentication request failed.');
        error.statusCode = response.status;
        throw error;
    }

    return data;
}

function normalizeUser(user) {
    return {
        username: String(user?.username || '').trim(),
        email: String(user?.email || '').trim().toLowerCase()
    };
}

function persistSession(data) {
    if (data?.sessionToken) {
        storeSessionToken(data.sessionToken);
    }

    return normalizeUser(data?.user);
}

export function getSessionToken() {
    return getStoredSessionToken();
}

export async function registerUser({ username, email, password }) {
    const data = await requestAuth('/api/auth/register', {
        method: 'POST',
        body: { username, email, password }
    });

    return persistSession(data);
}

export async function loginUser({ email, password }) {
    const data = await requestAuth('/api/auth/login', {
        method: 'POST',
        body: { email, password }
    });

    return persistSession(data);
}

export async function getAuthenticatedUser() {
    const sessionToken = getStoredSessionToken();

    if (!sessionToken) {
        return null;
    }

    try {
        const data = await requestAuth('/api/auth/session');
        return normalizeUser(data?.user);
    } catch (error) {
        if (error.statusCode === 401) {
            clearStoredSessionToken();
            return null;
        }

        throw error;
    }
}

export async function clearAuthenticatedUser() {
    try {
        if (getStoredSessionToken()) {
            await requestAuth('/api/auth/logout', { method: 'POST' });
        }
    } catch {
        // Clear local state even if the server session is already gone.
    } finally {
        clearStoredSessionToken();
    }
}
