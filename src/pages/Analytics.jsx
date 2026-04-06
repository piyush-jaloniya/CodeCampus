import React, { useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { askGemini } from '../utils/geminiApi';
import { getCourses } from '../services/courseService';
import { formatLocalDateKey, getStudyLog } from '../utils/studyActivity';

const chartLabelColor = 'var(--text-secondary)';
const chartGridColor = 'rgba(255,255,255,0.05)';
const chartTooltipStyle = {
    background: '#1a2235',
    border: '1px solid rgba(79,142,247,0.3)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit'
};
const sectionCardStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1.5rem'
};
const pieColors = ['#4f8ef7', '#7c3aed', '#06d6a0', '#f7a525', '#34d399', '#fb7185', '#38bdf8'];

function getLocalStorageByPrefix(prefix) {
    const result = {};

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(prefix)) {
            result[key] = localStorage.getItem(key);
        }
    }

    return result;
}

function formatDayLabel(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short' });
}

function getLast7Days() {
    const days = [];
    const today = new Date();

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        const iso = formatLocalDateKey(date);
        days.push(iso);
    }

    return days;
}

function getCurrentStreak(studyDates) {
    const uniqueDates = new Set(studyDates);
    let streak = 0;
    const cursor = new Date();

    while (uniqueDates.has(formatLocalDateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function Analytics() {
    const [insightLoading, setInsightLoading] = useState(false);
    const [insightText, setInsightText] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    React.useEffect(() => {
        const refreshAnalytics = () => setRefreshKey((previous) => previous + 1);
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshAnalytics();
            }
        };

        window.addEventListener('focus', refreshAnalytics);
        window.addEventListener('storage', refreshAnalytics);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', refreshAnalytics);
            window.removeEventListener('storage', refreshAnalytics);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    void refreshKey;

    const analytics = (() => {
        const studyLog = getStudyLog();

        let recommendedPath = [];
        try {
            recommendedPath = JSON.parse(localStorage.getItem('recommendedPath') || '[]');
        } catch {
            recommendedPath = [];
            localStorage.removeItem('recommendedPath');
        }
        const courses = getCourses();

        const completedVideoRaw = getLocalStorageByPrefix('completedVideos:');
        const weakTopicsRaw = getLocalStorageByPrefix('weakTopics:');
        const notesRaw = getLocalStorageByPrefix('courseNotes:');

        const completedVideosByCourse = Object.entries(completedVideoRaw).reduce((acc, [key, rawValue]) => {
            const courseId = key.replace('completedVideos:', '');
            try {
                const parsed = JSON.parse(rawValue || '[]');
                acc[courseId] = Array.isArray(parsed) ? parsed.length : 0;
            } catch {
                acc[courseId] = 0;
            }
            return acc;
        }, {});

        const notesByCourse = Object.entries(notesRaw).reduce((acc, [key, rawValue]) => {
            const courseId = key.replace('courseNotes:', '');
            try {
                const parsed = JSON.parse(rawValue || '[]');
                acc[courseId] = Array.isArray(parsed) ? parsed.length : 0;
            } catch {
                acc[courseId] = 0;
            }
            return acc;
        }, {});

        const allWeakTopics = Object.values(weakTopicsRaw)
            .flatMap((rawValue) => (rawValue || '').split(',').map((topic) => topic.trim()).filter(Boolean));

        const weakTopicCounts = allWeakTopics.reduce((acc, topic) => {
            acc[topic] = (acc[topic] || 0) + 1;
            return acc;
        }, {});

        const weakTopicsPieData = Object.entries(weakTopicCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        const dayCounts = studyLog.reduce((acc, date) => {
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const last7Days = getLast7Days();
        const weeklyData = last7Days.map((date) => ({
            day: formatDayLabel(date),
            count: dayCounts[date] || 0
        }));

        const courseProgressData = recommendedPath.map((pathCourse) => {
            const sourceCourse = courses.find((course) => course.id === pathCourse.id) || pathCourse;
            let completedList = [];
            try {
                completedList = JSON.parse(
                    localStorage.getItem(`completedVideos:${pathCourse.id}`) || '[]'
                );
            } catch {
                completedList = [];
                localStorage.removeItem(`completedVideos:${pathCourse.id}`);
            }

            const totalVideos = Array.isArray(sourceCourse.videos)
                ? sourceCourse.videos.length
                : (sourceCourse.youtubeUrl ? 1 : 0);

            const percentage = totalVideos > 0
                ? Math.round((completedList.length / totalVideos) * 100)
                : 0;

            return {
                id: pathCourse.id,
                name: pathCourse.title,
                completion: Math.min(percentage, 100)
            };
        });

        const activeStudyDays = new Set(studyLog).size;
        const currentStreak = getCurrentStreak(studyLog);
        const totalVideosWatched = Object.values(completedVideosByCourse).reduce((sum, value) => sum + value, 0);

        const coursesInProgressList = courseProgressData
            .filter((course) => course.completion < 100)
            .map((course) => {
                const noteCount = notesByCourse[course.id] || 0;
                return `${course.name} (${course.completion}% complete, ${noteCount} notes)`;
            });

        return {
            studyLog,
            recommendedPath,
            allWeakTopics,
            weakTopicsPieData,
            weeklyData,
            courseProgressData,
            notesByCourse,
            totalVideosWatched,
            activeStudyDays,
            currentStreak,
            topicsToReviewCount: allWeakTopics.length,
            coursesInProgressList
        };
    })();

    const handleGetInsight = async () => {
        setInsightLoading(true);

        const weakTopicsList = analytics.allWeakTopics.length > 0
            ? [...new Set(analytics.allWeakTopics)].join(', ')
            : 'None yet';
        const inProgressList = analytics.coursesInProgressList.length > 0
            ? analytics.coursesInProgressList.join('; ')
            : 'No active courses';

        try {
            const response = await askGemini(
                'You are a learning coach. Analyze a student\'s study data and give personalized, encouraging advice in 3 to 4 sentences. Be specific.',
                `Student data:\n- Active study days: ${analytics.activeStudyDays}\n- Current streak: ${analytics.currentStreak} days\n- Videos watched: ${analytics.totalVideosWatched}\n- Weak topics: ${weakTopicsList}\n- Courses in progress: ${inProgressList}\nGive a personalized insight and one specific actionable tip.`
            );
            setInsightText(response);
        } catch {
            setInsightText('AI insight is unavailable right now. Please try again in a moment.');
        } finally {
            setInsightLoading(false);
        }
    };

    if (analytics.studyLog.length === 0) {
        return (
            <Container className="mt-4 pb-5">
                <h2 className="mb-1">Learning Analytics</h2>
                <p className="text-muted mb-4">Your progress at a glance</p>

                <div style={{ ...sectionCardStyle, textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div
                        aria-hidden="true"
                        style={{
                            width: '74px',
                            height: '74px',
                            border: '2px solid rgba(79,142,247,0.35)',
                            borderRadius: '16px',
                            margin: '0 auto 1rem',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '12px',
                            background: 'rgba(79,142,247,0.08)'
                        }}
                    >
                        <span style={{ width: '8px', height: '20px', background: '#4f8ef7', borderRadius: '4px' }}></span>
                        <span style={{ width: '8px', height: '30px', background: '#7c3aed', borderRadius: '4px' }}></span>
                        <span style={{ width: '8px', height: '14px', background: '#06d6a0', borderRadius: '4px' }}></span>
                    </div>
                    <h5 className="mb-2">No activity yet. Start watching a course to see your analytics!</h5>
                    <Button as={Link} to="/courses" variant="primary">Browse Courses</Button>
                </div>
            </Container>
        );
    }

    return (
        <Container className="mt-4 pb-5">
            <h2 className="mb-1">Learning Analytics</h2>
            <p className="text-muted mb-4">Your progress at a glance</p>

            <Row className="g-3 mb-4">
                <Col sm={6} lg={3}>
                    <Card style={sectionCardStyle} className="h-100">
                        <div className="text-muted small">Total Videos Watched</div>
                        <h3 className="mb-0 mt-2">{analytics.totalVideosWatched}</h3>
                    </Card>
                </Col>
                <Col sm={6} lg={3}>
                    <Card style={sectionCardStyle} className="h-100">
                        <div className="text-muted small">Active Study Days</div>
                        <h3 className="mb-0 mt-2">{analytics.activeStudyDays}</h3>
                    </Card>
                </Col>
                <Col sm={6} lg={3}>
                    <Card style={sectionCardStyle} className="h-100">
                        <div className="text-muted small">Current Streak</div>
                        <h3 className="mb-0 mt-2">{analytics.currentStreak}</h3>
                    </Card>
                </Col>
                <Col sm={6} lg={3}>
                    <Card style={sectionCardStyle} className="h-100">
                        <div className="text-muted small">Topics to Review</div>
                        <h3 className="mb-0 mt-2">{analytics.topicsToReviewCount}</h3>
                    </Card>
                </Col>
            </Row>

            <Card style={sectionCardStyle} className="mb-4">
                <h5 className="mb-3">Study activity - last 7 days</h5>
                <div className="no-transition" style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                        <BarChart data={analytics.weeklyData}>
                            <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fill: chartLabelColor, fontFamily: 'inherit' }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                            <YAxis tick={{ fill: chartLabelColor, fontFamily: 'inherit' }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
                            <Bar dataKey="count" fill="#4f8ef7" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card style={sectionCardStyle} className="mb-4">
                <h5 className="mb-3">Course completion</h5>
                {analytics.courseProgressData.length === 0 ? (
                    <Alert variant="secondary" className="mb-0">No courses in your learning path yet.</Alert>
                ) : (
                    <div className="no-transition" style={{ width: '100%', height: Math.max(260, analytics.courseProgressData.length * 70) }}>
                        <ResponsiveContainer>
                            <BarChart
                                layout="vertical"
                                data={analytics.courseProgressData}
                                margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                            >
                                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: chartLabelColor, fontFamily: 'inherit' }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                                <YAxis type="category" dataKey="name" width={170} tick={{ fill: chartLabelColor, fontFamily: 'inherit', fontSize: 12 }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, 'Completion']} />
                                <Bar dataKey="completion" fill="#06d6a0" radius={[0, 8, 8, 0]}>
                                    <LabelList
                                        dataKey="completion"
                                        position="right"
                                        formatter={(value) => `${value}%`}
                                        fill={chartLabelColor}
                                        fontFamily="inherit"
                                    />
                                    {analytics.courseProgressData.map((entry) => (
                                        <Cell key={entry.id} fill={entry.completion >= 100 ? '#4f8ef7' : '#06d6a0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                {analytics.courseProgressData.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                        {analytics.courseProgressData.map((course) => (
                            <Badge key={course.id} bg="dark" className="border">
                                {course.name}: {course.completion}%
                            </Badge>
                        ))}
                    </div>
                )}
            </Card>

            <Card style={sectionCardStyle} className="mb-4">
                <h5 className="mb-3">Topics to review</h5>
                {analytics.weakTopicsPieData.length === 0 ? (
                    <Alert variant="secondary" className="mb-0">Complete some quizzes to see insights</Alert>
                ) : (
                    <>
                        <div className="no-transition" style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={analytics.weakTopicsPieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={68}
                                        outerRadius={108}
                                        label={({ name }) => name}
                                        labelLine={false}
                                    >
                                        {analytics.weakTopicsPieData.map((entry, index) => (
                                            <Cell key={`${entry.name}-${index}`} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value, 'Mentions']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {analytics.weakTopicsPieData.map((item, index) => (
                                <Badge key={item.name} style={{ background: pieColors[index % pieColors.length] }}>
                                    {item.name}: {item.value}
                                </Badge>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            <Card style={sectionCardStyle}>
                <h5 className="mb-3">AI Learning Insight</h5>
                <Button onClick={handleGetInsight} disabled={insightLoading} variant="outline-info" className="mb-3">
                    {insightLoading ? (
                        <span className="d-flex align-items-center gap-2">
                            <Spinner animation="border" size="sm" />
                            Thinking...
                        </span>
                    ) : (
                        'Get AI Insight'
                    )}
                </Button>

                {insightText && (
                    <div
                        style={{
                            background: 'rgba(79,142,247,0.08)',
                            border: '1px solid rgba(79,142,247,0.25)',
                            borderRadius: '10px',
                            padding: '0.9rem 1rem'
                        }}
                    >
                        <div className="d-flex align-items-start gap-2">
                            <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>🤖</span>
                            <p className="mb-0">{insightText}</p>
                        </div>
                    </div>
                )}
            </Card>
        </Container>
    );
}

export default Analytics;
