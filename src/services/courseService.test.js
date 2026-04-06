import { courseCatalog, getCourses, getTrendingCourses } from './courseService';

describe('courseService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('returns full course catalog', () => {
        const courses = getCourses();
        expect(courses).toHaveLength(courseCatalog.length);
    });

    test('returns trending courses sorted by score', () => {
        const trending = getTrendingCourses(3);
        expect(trending).toHaveLength(3);
        expect(trending[0].score).toBeGreaterThanOrEqual(trending[1].score);
    });
});
