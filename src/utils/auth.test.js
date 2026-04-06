import {
    clearAuthenticatedUser,
    getAuthenticatedUser,
    getSessionToken,
    loginUser,
    registerUser
} from './auth';

function mockJsonResponse(status, payload) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(payload)
    });
}

describe('auth utils', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('registers a user and stores the server session token', async () => {
        global.fetch.mockImplementation(() => mockJsonResponse(201, {
            user: {
                username: 'Learner',
                email: 'learner@example.com'
            },
            sessionToken: 'session-123'
        }));

        const user = await registerUser({
            username: 'Learner',
            email: 'Learner@Example.com',
            password: 'StrongPass1!'
        });

        expect(user).toEqual({
            username: 'Learner',
            email: 'learner@example.com'
        });
        expect(getSessionToken()).toBe('session-123');
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
            method: 'POST'
        }));
    });

    test('returns the authenticated user from the server session endpoint', async () => {
        localStorage.setItem('sessionToken', 'session-abc');
        global.fetch.mockImplementation(() => mockJsonResponse(200, {
            user: {
                username: 'Learner',
                email: 'learner@example.com'
            }
        }));

        const user = await getAuthenticatedUser();

        expect(user).toEqual({
            username: 'Learner',
            email: 'learner@example.com'
        });
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
            headers: expect.objectContaining({
                'x-session-token': 'session-abc'
            })
        }));
    });

    test('clears a stale session token after a 401 session check', async () => {
        localStorage.setItem('sessionToken', 'expired-token');
        global.fetch.mockImplementation(() => mockJsonResponse(401, {
            error: 'Invalid session.'
        }));

        const user = await getAuthenticatedUser();

        expect(user).toBeNull();
        expect(getSessionToken()).toBe('');
    });

    test('surfaces server-side login errors', async () => {
        global.fetch.mockImplementation(() => mockJsonResponse(401, {
            error: 'Invalid email or password.'
        }));

        await expect(loginUser({
            email: 'learner@example.com',
            password: 'wrong'
        })).rejects.toThrow('Invalid email or password.');
    });

    test('logs out and clears the stored session token', async () => {
        localStorage.setItem('sessionToken', 'session-logout');
        global.fetch.mockImplementation(() => mockJsonResponse(200, { ok: true }));

        await clearAuthenticatedUser();

        expect(getSessionToken()).toBe('');
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
            method: 'POST'
        }));
    });
});
