const YOUTUBE_IFRAME_API_SRC = 'https://www.youtube.com/iframe_api';
const DURATION_CACHE_PREFIX = 'ytDuration:';

let iframeApiPromise = null;
const durationCache = new Map();
const pendingRequests = new Map();

function readCachedDuration(videoId) {
    if (durationCache.has(videoId)) {
        return durationCache.get(videoId);
    }

    try {
        const raw = localStorage.getItem(`${DURATION_CACHE_PREFIX}${videoId}`);
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) {
            durationCache.set(videoId, parsed);
            return parsed;
        }
    } catch {
        // Ignore storage errors.
    }

    return null;
}

function writeCachedDuration(videoId, seconds) {
    durationCache.set(videoId, seconds);

    try {
        localStorage.setItem(`${DURATION_CACHE_PREFIX}${videoId}`, String(seconds));
    } catch {
        // Ignore storage errors.
    }
}

export function extractYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace('www.', '');

        if (host === 'youtu.be') {
            return parsed.pathname.split('/').filter(Boolean)[0] || null;
        }

        const directId = parsed.searchParams.get('v');
        if (directId) {
            return directId;
        }

        if (parsed.pathname.startsWith('/embed/')) {
            const parts = parsed.pathname.split('/').filter(Boolean);
            return parts.length >= 2 ? parts[1] : null;
        }

        return null;
    } catch {
        return null;
    }
}

function loadYouTubeIframeApi() {
    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }

    if (!iframeApiPromise) {
        iframeApiPromise = new Promise((resolve) => {
            const existingScript = document.querySelector(`script[src="${YOUTUBE_IFRAME_API_SRC}"]`);
            const previousReady = window.onYouTubeIframeAPIReady;

            window.onYouTubeIframeAPIReady = () => {
                if (typeof previousReady === 'function') {
                    previousReady();
                }
                resolve(window.YT);
            };

            if (!existingScript) {
                const script = document.createElement('script');
                script.src = YOUTUBE_IFRAME_API_SRC;
                script.async = true;
                document.body.appendChild(script);
            }
        });
    }

    return iframeApiPromise;
}

function createHiddenPlayerContainer(videoId) {
    const node = document.createElement('div');
    node.id = `yt-duration-${videoId}-${Math.random().toString(16).slice(2)}`;
    node.style.position = 'fixed';
    node.style.left = '-9999px';
    node.style.top = '-9999px';
    node.style.width = '1px';
    node.style.height = '1px';
    node.style.opacity = '0';
    document.body.appendChild(node);
    return node;
}

function cleanupPlayer(player, node) {
    try {
        if (player?.destroy) {
            player.destroy();
        }
    } catch {
        // Ignore player cleanup errors.
    }

    try {
        if (node?.parentNode) {
            node.parentNode.removeChild(node);
        }
    } catch {
        // Ignore DOM cleanup errors.
    }
}

export async function getYouTubeDurationSecondsById(videoId) {
    if (!videoId) {
        return 0;
    }

    const cached = readCachedDuration(videoId);
    if (cached) {
        return cached;
    }

    if (pendingRequests.has(videoId)) {
        return pendingRequests.get(videoId);
    }

    const pending = loadYouTubeIframeApi()
        .then(() => new Promise((resolve) => {
            let settled = false;
            let player;
            const node = createHiddenPlayerContainer(videoId);

            const finish = (value) => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanupPlayer(player, node);
                resolve(value);
            };

            const readDuration = (attempt = 0) => {
                const seconds = Number(player?.getDuration?.() || 0);
                if (seconds > 0) {
                    writeCachedDuration(videoId, seconds);
                    finish(seconds);
                    return;
                }

                if (attempt >= 8) {
                    finish(0);
                    return;
                }

                setTimeout(() => readDuration(attempt + 1), 200);
            };

            player = new window.YT.Player(node, {
                videoId,
                events: {
                    onReady: () => readDuration(0),
                    onError: () => finish(0)
                }
            });

            setTimeout(() => finish(0), 5000);
        }))
        .finally(() => {
            pendingRequests.delete(videoId);
        });

    pendingRequests.set(videoId, pending);
    return pending;
}

export function formatVideoDurationLabel(seconds) {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const hours = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
