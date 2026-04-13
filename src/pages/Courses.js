import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Form, InputGroup } from 'react-bootstrap';
import CourseCard from '../components/CourseCard';
import { toast } from 'react-toastify';
import { getCourses, submitCourseRating } from '../services/courseService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AdaptiveQuiz from '../components/AdaptiveQuiz';

function Courses({ onWishlist, wishlist, user }) {
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [quizCourse, setQuizCourse] = useState(null);

    useEffect(() => {
        document.title = 'Courses – CodeCampus';

    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            const ratingUserId = user?.email || user?.username || '';
            setCourses(getCourses(ratingUserId));
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [user]);

    const categories = ['All', ...new Set(courses.map((course) => course.category))];
    const difficulties = ['All', ...new Set(courses.map((course) => course.difficulty))];

    const handleRateCourse = (courseName, value) => {
        try {
            const ratingUserId = user?.email || user?.username || '';
            const updated = submitCourseRating(courseName, value, ratingUserId);
            setCourses((previous) =>
                previous.map((course) =>
                    course.name === courseName
                        ? { ...course, rating: updated.avgRating, reviews: updated.count, userRating: value }
                        : course
                )
            );
            toast.success(`Thanks for rating ${courseName}!`);
        } catch (error) {
            toast.error('Unable to submit rating right now.');
        }
    };

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const matchesSearch =
                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
            const matchesDifficulty = selectedDifficulty === 'All' || course.difficulty === selectedDifficulty;

            return matchesSearch && matchesCategory && matchesDifficulty;
        });
    }, [courses, searchTerm, selectedCategory, selectedDifficulty]);

    return (
        <Container className="mt-4">
            <h2 className="text-center mb-5">Our Courses</h2>

            <Row className="mb-4 g-3">
                <div className="col-md-4">
                    <InputGroup>
                        <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        <Form.Control
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </InputGroup>
                </div>
                <div className="col-md-4">
                    <Form.Select
                        value={selectedCategory}
                        onChange={(event) => setSelectedCategory(event.target.value)}
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>{category} Category</option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-4">
                    <Form.Select
                        value={selectedDifficulty}
                        onChange={(event) => setSelectedDifficulty(event.target.value)}
                    >
                        {difficulties.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>{difficulty} Level</option>
                        ))}
                    </Form.Select>
                </div>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <small className="text-muted">
                    Found {filteredCourses.length} course(s)
                    {searchTerm && ` matching "${searchTerm}"`}
                </small>
            </div>

            {isLoading ? (
                <LoadingSkeleton count={6} />
            ) : filteredCourses.length > 0 ? (
                <Row xs={1} sm={2} lg={3} className="g-4 justify-content-center">
                    {filteredCourses.map((course) => (
                        <div key={course.name} className="col d-flex">
                            <CourseCard
                                user={user}
                                courseId={course.id}
                                course={course.name}
                                courseSlug={course.slug}
                                description={course.description}
                                link={course.link}
                                image={course.image}
                                category={course.category}
                                difficulty={course.difficulty}
                                duration={course.duration}
                                rating={course.rating}
                                reviews={course.reviews}
                                userRating={course.userRating}
                                onWishlist={onWishlist}
                                wishlist={wishlist}
                                onRate={(value) => handleRateCourse(course.name, value)}
                                onTestYourself={() => setQuizCourse(course)}
                            />
                        </div>
                    ))}
                </Row>
            ) : (
                <div className="text-center py-5">
                    <h5 className="text-muted">No courses found</h5>
                    <p className="text-muted">Try adjusting your search or filters</p>
                </div>
            )}
            <AdaptiveQuiz
                show={!!quizCourse}
                onHide={() => setQuizCourse(null)}
                courseId={quizCourse?.id || ''}
                courseName={quizCourse?.name || ''}
            />
        </Container>
    );
}

export default Courses;
