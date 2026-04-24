import React, { useMemo } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { formatLocalDateKey, getStudyLog } from '../utils/studyActivity';

function StudyHeatmap() {
    const studyLog = getStudyLog();

    const activityByDate = useMemo(() => {
        return studyLog.reduce((acc, day) => {
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});
    }, [studyLog]);

    const uniqueDates = useMemo(() => Object.keys(activityByDate).sort(), [activityByDate]);

    const currentStreak = useMemo(() => {
        const dateSet = new Set(uniqueDates);
        let streak = 0;
        const cursor = new Date();

        while (dateSet.has(formatLocalDateKey(cursor))) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }, [uniqueDates]);

    const longestStreak = useMemo(() => {
        if (!uniqueDates.length) {
            return 0;
        }

        let longest = 1;
        let current = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1]);
            const next = new Date(uniqueDates[i]);
            const diff = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

            if (diff === 1) {
                current += 1;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }

        return longest;
    }, [uniqueDates]);

    const totalActiveDays = uniqueDates.length;

    const cells = useMemo(() => {
        const end = new Date();
        const start = new Date(end);
        start.setDate(end.getDate() - 83);

        return Array.from({ length: 84 }, (_, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);
            const dateStr = formatLocalDateKey(date);
            const count = activityByDate[dateStr] || 0;

            let intensityClass = 'lvl-0';
            if (count === 1) intensityClass = 'lvl-1';
            if (count === 2) intensityClass = 'lvl-2';
            if (count >= 3) intensityClass = 'lvl-3';

            return {
                date,
                dateStr,
                count,
                intensityClass,
                index
            };
        });
    }, [activityByDate]);

    const monthLabels = useMemo(() => {
        return cells
            .filter((cell, index) => index === 0 || cell.date.getDate() === 1)
            .map((cell) => ({
                label: cell.date.toLocaleString('default', { month: 'short' }),
                left: `${(cell.index / 84) * 100}%`
            }));
    }, [cells]);

    return (
        <Card className="dashboard-card mt-4 heatmap-section">
            <Card.Body>
                <Card.Title>Study Activity</Card.Title>
                <Row className="g-3 mb-3">
                    <Col md={4}>
                        <div className="study-stat-card">
                            <p className="mb-1 text-muted">Current Streak</p>
                            <h4 className="mb-0">{currentStreak} day(s)</h4>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="study-stat-card">
                            <p className="mb-1 text-muted">Longest Streak</p>
                            <h4 className="mb-0">{longestStreak} day(s)</h4>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="study-stat-card">
                            <p className="mb-1 text-muted">Total Active Days</p>
                            <h4 className="mb-0">{totalActiveDays}</h4>
                        </div>
                    </Col>
                </Row>

                <div className="heatmap-wrapper">
                    <div className="heatmap-months">
                        {monthLabels.map((month, idx) => (
                            <span key={`${month.label}-${idx}`} className="heatmap-month-label" style={{ '--month-left': month.left }}>{month.label}</span>
                        ))}
                    </div>
                    <div className="heatmap-main">
                        <div className="heatmap-day-labels">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                        </div>
                        <div className="heatmap-grid" role="img" aria-label="Study activity heatmap for last 12 weeks">
                            {cells.map((cell) => (
                                <span
                                    key={cell.dateStr}
                                    className={`heatmap-cell ${cell.intensityClass}`}
                                    title={`${cell.dateStr}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                                ></span>
                            ))}
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export default StudyHeatmap;
