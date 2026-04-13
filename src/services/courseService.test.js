import { courseCatalog, getCourses, getTrendingCourses, submitCourseRating } from './courseService';

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

    test('adds a new rating and increments review count', () => {
        const target = courseCatalog[0];
        const result = submitCourseRating(target.name, 5, 'user-one@example.com');

        expect(result.count).toBe(target.reviews + 1);
        expect(result.avgRating).toBeGreaterThanOrEqual(target.rating);
    });

    test('updates existing user rating without incrementing review count again', () => {
        const target = courseCatalog[0];
        const first = submitCourseRating(target.name, 5, 'user-repeat@example.com');
        const firstStore = JSON.parse(localStorage.getItem('courseRatings') || '{}');
        const second = submitCourseRating(target.name, 1, 'user-repeat@example.com');
        const secondStore = JSON.parse(localStorage.getItem('courseRatings') || '{}');

        expect(second.count).toBe(first.count);
        expect(secondStore[target.name].avgRating).toBeLessThan(firstStore[target.name].avgRating);
    });

    test('throws for invalid rating values', () => {
        const target = courseCatalog[0];

        expect(() => submitCourseRating(target.name, 0, 'invalid-low')).toThrow();
        expect(() => submitCourseRating(target.name, 6, 'invalid-high')).toThrow();
        expect(() => submitCourseRating(target.name, Number.NaN, 'invalid-nan')).toThrow();
    });

    test('returns userRating for the requesting user', () => {
        const target = courseCatalog[0];
        submitCourseRating(target.name, 2, 'viewer@example.com');

        const coursesForViewer = getCourses('viewer@example.com');
        const selected = coursesForViewer.find((course) => course.name === target.name);

        expect(selected.userRating).toBe(2);
    });
});
