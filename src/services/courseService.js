const COURSE_RATINGS_KEY = 'courseRatings';

export const courseCatalog = [
    {
        name: 'Java Programming',
        description: 'Master Java from basics to advanced concepts like OOP, Collections, and Multithreading.',
        videos: [
            { id: 1, videoId: 'eIrMbAQSU34', title: 'Java Basics and Setup' },
            { id: 2, videoId: 'UmnCZ7-9yDY', title: 'Java OOP Concepts' },
            { id: 3, videoId: '0fKg7e37bQE', title: 'Collections and Practice' }
        ],
        image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        category: 'Backend',
        difficulty: 'Beginner',
        duration: '40 hours',
        rating: 4.5,
        reviews: 128,
        students: 1250
    },
    {
        name: 'HTML-CSS-JAVASCRIPT',
        description: 'Build beautiful websites with HTML5, modern CSS3 and JS techniques.',
        videos: [
            { id: 1, videoId: 'HcOc7P5BMi4', title: 'HTML Fundamentals' },
            { id: 2, videoId: 'ESnrn1kAD4E', title: 'CSS Styling and Layout' },
            { id: 3, videoId: 'qz0aGYrrlhU', title: 'JavaScript Essentials' }
        ],
        image: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80',
        category: 'Frontend',
        difficulty: 'Beginner',
        duration: '50 hours',
        rating: 4.8,
        reviews: 156,
        students: 1890
    },
    {
        name: 'React Development',
        description: 'Learn React hooks, state management, and building modern UIs.',
        youtubeUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk&t=163s',
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        category: 'Frontend',
        difficulty: 'Intermediate',
        duration: '35 hours',
        rating: 4.7,
        reviews: 142,
        students: 1620
    },
    {
        name: 'Data Structures & Algorithm',
        description: 'Understand arrays, linked lists, trees, and algorithms with implementations.',
        youtubeUrl: 'https://www.youtube.com/watch?v=J0OvDNmAWNw',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        category: 'Core CS',
        difficulty: 'Intermediate',
        duration: '45 hours',
        rating: 4.6,
        reviews: 134,
        students: 1410
    },
    {
        name: 'Machine Learning',
        description: 'Introduction to ML models, neural networks, and TensorFlow.',
        videos: [
            { id: 1, videoId: 'GwIo3gDZCVQ', title: 'Machine Learning Introduction' },
            { id: 2, videoId: 'JxgmHe2NyeY', title: 'Model Training and Evaluation' },
            { id: 3, videoId: 'aircAruvnKk', title: 'Neural Networks Basics' }
        ],
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        category: 'AI/ML',
        difficulty: 'Advanced',
        duration: '60 hours',
        rating: 4.9,
        reviews: 167,
        students: 2100
    },
    {
        name: 'Python Programming',
        description: 'From Python syntax to building real-world applications.',
        youtubeUrl: 'https://www.youtube.com/watch?v=UrsmFxEIp5k',
        image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80',
        category: 'Backend',
        difficulty: 'Beginner',
        duration: '55 hours',
        rating: 4.7,
        reviews: 149,
        students: 1750
    }
];

function readRatingsStore() {
    try {
        const raw = localStorage.getItem(COURSE_RATINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeRatingsStore(ratings) {
    localStorage.setItem(COURSE_RATINGS_KEY, JSON.stringify(ratings));
}

export function getCourseSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

export function getYoutubeEmbedUrl(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace('www.', '');
        const listId = parsed.searchParams.get('list');
        const videoIdFromQuery = parsed.searchParams.get('v');

        // Always prioritize playlist mode when list id exists.
        if (listId) {
            // videoseries is the most reliable format for full playlist playback in iframes.
            return `https://www.youtube.com/embed/videoseries?list=${listId}`;
        }

        if (host === 'youtu.be') {
            const videoId = parsed.pathname.split('/').filter(Boolean)[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

        if (host.includes('youtube.com')) {
            if (parsed.pathname.startsWith('/embed/')) {
                return `https://www.youtube.com${parsed.pathname}`;
            }

            if (videoIdFromQuery) {
                return `https://www.youtube.com/embed/${videoIdFromQuery}`;
            }

            // Handle direct /playlist links even when URL parser misses query edge-cases.
            if (parsed.pathname.startsWith('/playlist')) {
                const fallbackList = /[?&]list=([^&]+)/.exec(url)?.[1];
                return fallbackList
                    ? `https://www.youtube.com/embed/videoseries?list=${fallbackList}`
                    : null;
            }
        }

        return null;
    } catch {
        return null;
    }
}

export function getUserCourseRating(courseName, userId = '') {
    const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
    if (!normalizedUserId) {
        return null;
    }

    const ratings = readRatingsStore();
    const courseRatings = ratings[courseName];
    const value = courseRatings?.userRatings?.[normalizedUserId];
    return typeof value === 'number' ? value : null;
}

export function getCourses(userId = '') {
    const ratings = readRatingsStore();
    const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';

    return courseCatalog.map((course) => {
        const fallbackVideoUrl = Array.isArray(course.videos) && course.videos.length > 0
            ? `https://www.youtube.com/watch?v=${course.videos[0].videoId}`
            : null;
        const sourceUrl = course.youtubeUrl || course.link || fallbackVideoUrl;
        const ratingInfo = ratings[course.name];
        const userRating = normalizedUserId && ratingInfo?.userRatings
            ? ratingInfo.userRatings[normalizedUserId] ?? null
            : null;
        return {
            ...course,
            youtubeUrl: course.youtubeUrl || sourceUrl,
            link: course.link || sourceUrl,
            slug: getCourseSlug(course.name),
            id: getCourseSlug(course.name),
            title: course.name,
            embedUrl: getYoutubeEmbedUrl(sourceUrl),
            rating: ratingInfo ? Number(ratingInfo.avgRating.toFixed(1)) : course.rating,
            reviews: ratingInfo ? ratingInfo.count : course.reviews,
            userRating: typeof userRating === 'number' ? userRating : null
        };
    });
}

export function getCourseBySlug(slug) {
    return getCourses().find((course) => course.slug === slug) || null;
}

export function submitCourseRating(courseName, value, userId = '') {
    if (!Number.isFinite(value) || value < 1 || value > 5) {
        throw new Error('Rating value must be between 1 and 5');
    }

    const courses = getCourses();
    const target = courses.find((course) => course.name === courseName);
    if (!target) {
        throw new Error('Course not found');
    }

    const ratings = readRatingsStore();
    const previous = ratings[courseName] || {
        avgRating: target.rating,
        count: target.reviews,
        userRatings: {}
    };

    const previousCount = Number(previous.count) || 0;
    const previousAvg = Number(previous.avgRating) || 0;
    const previousTotal = previousAvg * previousCount;
    const userRatings = previous.userRatings && typeof previous.userRatings === 'object'
        ? { ...previous.userRatings }
        : {};

    const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
    const existingUserRating = normalizedUserId ? userRatings[normalizedUserId] : undefined;

    let total = previousTotal;
    let count = previousCount;

    if (typeof existingUserRating === 'number') {
        total = total - existingUserRating + value;
    } else {
        total += value;
        count += 1;
    }

    if (normalizedUserId) {
        userRatings[normalizedUserId] = value;
    }

    ratings[courseName] = {
        avgRating: total / count,
        count,
        userRatings
    };

    writeRatingsStore(ratings);
    return {
        avgRating: Number((total / count).toFixed(1)),
        count
    };
}

export function getTrendingCourses(limit = 3) {
    const scored = getCourses().map((course) => ({
        ...course,
        score: course.rating * Math.log10(course.reviews + 10)
    }));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
