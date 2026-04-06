import { formatLocalDateKey, getStudyLog, logStudyActivity } from './studyActivity';

describe('studyActivity utils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('returns an empty log for malformed localStorage data', () => {
        localStorage.setItem('studyLog', '{not-json');

        expect(getStudyLog()).toEqual([]);
        expect(localStorage.getItem('studyLog')).toBeNull();
    });

    test('logs study activity using a local date key', () => {
        const dateKey = formatLocalDateKey(new Date(2026, 3, 6, 23, 45, 0));

        expect(dateKey).toBe('2026-04-06');

        localStorage.setItem('studyLog', JSON.stringify(['', 123, '2026-04-05']));
        expect(() => logStudyActivity()).not.toThrow();

        const studyLog = getStudyLog();
        expect(studyLog).toHaveLength(2);
        expect(studyLog[0]).toBe('2026-04-05');
        expect(studyLog[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
