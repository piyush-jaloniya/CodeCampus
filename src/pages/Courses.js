import React from 'react';
import { Container, Row } from 'react-bootstrap';
import CourseCard from '../components/CourseCard';

const courses = [
    {
        name: 'Java Programming',
        description: 'Master Java from basics to advanced concepts like OOP, Collections, and Multithreading.',
        link: 'https://www.youtube.com/playlist?list=PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop',
        image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    },
    {
        name: 'HTML-CSS-JAVASCRIPT',
        description: 'Build beautiful websites with HTML5, modern CSS3 and JS techniques.',
        link: 'https://youtube.com/playlist?list=PLfqMhTWNBTe0PY9xunOzsP5kmYIz2Hu7i&si=IkhMCge-k1Btb_er',
        image: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80'
    },
    {
        name: 'React Development',
        description: 'Learn React hooks, state management, and building modern UIs.',
        link: 'https://www.youtube.com/watch?v=SqcY0GlETPk&t=163s',
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    },
    {
        name: 'Data Structures & Algorithm',
        description: 'Understand arrays, linked lists, trees, and algorithms with implementations.',
        link: 'https://www.youtube.com/watch?v=J0OvDNmAWNw',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    },
    {
        name: 'Machine Learning',
        description: 'Introduction to ML models, neural networks, and TensorFlow.',
        link: 'https://youtube.com/playlist?list=PLYwpaL_SFmcBhOEPwf5cFwqo5B-cP9G4P&si=3tG_SAa2XURlTSXJ',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
    },
    {
        name: 'Python Programming',
        description: 'From Python syntax to building real-world applications.',
        link: 'https://www.youtube.com/watch?v=UrsmFxEIp5k',
        image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80'
    }
];

function Courses({ onWishlist, wishlist, user }) {
    return (
        <Container className="mt-4">
            <h2 className="text-center mb-4">Our Courses</h2>
            <Row xs={1} sm={2} lg={3} className="g-4 justify-content-center">
                {courses.map((course) => (
                    <CourseCard
                        key={course.name}
                        user={user}
                        course={course.name}
                        description={course.description}
                        link={course.link}
                        image={course.image}
                        onWishlist={onWishlist}
                        wishlist={wishlist}
                    />
                ))}
            </Row>
        </Container>
    );
}

export default Courses;