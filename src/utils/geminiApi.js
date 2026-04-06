import { getSessionToken } from './auth';

async function postGemini(path, payload) {
    const sessionToken = getSessionToken();
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(sessionToken ? { 'x-session-token': sessionToken } : {})
        },
        body: JSON.stringify(payload)
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.error || 'Gemini request failed.');
    }

    return data;
}

export async function askGemini(systemPrompt, userMessage, conversationHistory = []) {
    const data = await postGemini('/api/gemini/text', {
        systemPrompt,
        userMessage,
        conversationHistory
    });

    return data.text;
}

export async function askGeminiJSON(systemPrompt, userMessage) {
    const data = await postGemini('/api/gemini/json', {
        systemPrompt,
        userMessage
    });

    return data.data;
}
