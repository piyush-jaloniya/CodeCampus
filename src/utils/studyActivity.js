export function formatLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readStudyLog() {
    try {
        const raw = localStorage.getItem('studyLog');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string' && entry.trim()) : [];
    } catch {
        localStorage.removeItem('studyLog');
        return [];
    }
}

export function logStudyActivity() {
    const studyLog = readStudyLog();
    const today = formatLocalDateKey();

    studyLog.push(today);
    localStorage.setItem('studyLog', JSON.stringify(studyLog));
}

export function getStudyLog() {
    return readStudyLog();
}
