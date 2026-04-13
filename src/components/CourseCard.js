import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AISummaryButton from './AISummaryButton';

/* ── Inline SVG star (clean, scalable, no emoji weirdness) ── */
function StarIcon({ filled, half }) {
    const gradientId = useId();

    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={filled || half ? '#f7a525' : 'none'}
            stroke="#f7a525"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {half ? (
                <defs>
                    <linearGradient id={gradientId}>
                        <stop offset="50%" stopColor="#f7a525" />
                        <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            ) : null}
            <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                fill={half ? `url(#${gradientId})` : filled ? '#f7a525' : 'none'}
            />
        </svg>
    );
}

function StarDisplay({ rating }) {
    return (
        <span className="star-display" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon
                    key={i}
                    filled={i <= Math.floor(rating)}
                    half={i === Math.ceil(rating) && rating % 1 !== 0}
                />
            ))}
        </span>
    );
}

function InteractiveStars({ currentRating, onRate }) {
    const [hovered, setHovered] = useState(0);

    return (
        <span className="star-interactive" aria-label="Rate this course">
            {[1, 2, 3, 4, 5].map((value) => (
                <button
                    key={value}
                    type="button"
                    className="star-btn"
                    onMouseEnter={() => setHovered(value)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onRate(value)}
                    aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={(hovered || currentRating) >= value ? '#f7a525' : 'none'}
                        stroke="#f7a525"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transition: 'fill 0.12s ease, transform 0.12s ease', display: 'block', transform: hovered === value ? 'scale(1.25)' : 'scale(1)' }}
                        aria-hidden="true"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </button>
            ))}
        </span>
    );
}

const DIFFICULTY_STYLES = {
    Beginner: { bg: 'rgba(6, 214, 160, 0.15)', color: '#06d6a0', border: 'rgba(6, 214, 160, 0.3)' },
    Intermediate: { bg: 'rgba(247, 165, 37, 0.15)', color: '#f7a525', border: 'rgba(247, 165, 37, 0.3)' },
    Advanced: { bg: 'rgba(248, 66, 66, 0.15)', color: '#f84242', border: 'rgba(248, 66, 66, 0.3)' },
};

const CATEGORY_STYLE = { bg: 'rgba(79, 142, 247, 0.15)', color: '#4f8ef7', border: 'rgba(79, 142, 247, 0.3)' };

function MicroBadge({ label, style }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '99px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
        }}>
            {label}
        </span>
    );
}

function CourseCard({
    courseId, course, courseSlug, description, link,
    image, onWishlist, wishlist, user, category, difficulty,
    duration, rating, reviews, userRating, onRate, onTestYourself
}) {
    const isWishlisted = wishlist.includes(course);

    const handleWishlist = () => {
        if (!user) {
            toast.info('Create a free account to save courses to your wishlist.');
            return;
        }
        onWishlist(course);
    };

    const handleRate = (value) => {
        if (!user) {
            toast.info('Sign in to rate courses.');
            return;
        }
        onRate(value);
    };

    const diffStyle = DIFFICULTY_STYLES[difficulty] || { bg: 'rgba(148,163,184,0.1)', color: '#9aa5be', border: 'rgba(148,163,184,0.3)' };

    return (
        <div className="course-card-v2">
            {/* Thumbnail */}
            <div className="cc-thumb">
                <img src={image} alt={course} className="cc-thumb-img" />
                <div className="cc-thumb-overlay" />
                {/* Floating badges */}
                <div className="cc-badge-row">
                    {category && <MicroBadge label={category} style={CATEGORY_STYLE} />}
                    {difficulty && <MicroBadge label={difficulty} style={diffStyle} />}
                </div>
                {/* Duration chip */}
                {duration && (
                    <div className="cc-duration-chip">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {duration}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="cc-body">
                <h3 className="cc-title">{course}</h3>

                {/* Rating row */}
                {rating && (
                    <div className="cc-rating-row">
                        <StarDisplay rating={rating} />
                        <span className="cc-rating-num">{rating}</span>
                        <span className="cc-rating-count">({reviews})</span>
                    </div>
                )}

                <p className="cc-desc">{description}</p>

                {/* Interactive star rating */}
                {onRate && (
                    <div className="cc-rate-row">
                        <span className="cc-rate-label">Rate this course</span>
                        <InteractiveStars currentRating={typeof userRating === 'number' ? userRating : Math.round(rating)} onRate={handleRate} />
                    </div>
                )}

                {/* Action bar */}
                <div className="cc-actions">
                    <Link to={`/course/${courseId || courseSlug}`} className="btn btn-primary cc-btn-watch">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        Watch Course
                    </Link>

                    {onTestYourself && (
                        <button type="button" className="btn btn-outline-secondary cc-btn-quiz" onClick={onTestYourself} title="Test yourself">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Test Yourself
                        </button>
                    )}

                    <button
                        type="button"
                        className={`cc-icon-btn ${isWishlisted ? 'cc-icon-btn--active' : ''}`}
                        onClick={handleWishlist}
                        title={user ? (isWishlisted ? 'Remove from saved' : 'Save course') : 'Sign in to save'}
                        aria-pressed={isWishlisted}
                        aria-label={isWishlisted ? 'Remove from saved courses' : 'Save course'}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>

                </div>

                <AISummaryButton
                    courseId={courseId || courseSlug || course}
                    courseName={course}
                    category={category || 'General'}
                />

                {!user && (
                    <p className="cc-guest-hint">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        <Link to="/signup">Sign up</Link> to save &amp; rate
                    </p>
                )}
            </div>
        </div>
    );
}

export default CourseCard;