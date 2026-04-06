import React from 'react';
import { Breadcrumb, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const labelMap = {
    '/': 'Home',
    '/courses': 'Courses',
    '/contact': 'Contact',
    '/login': 'Login',
    '/signup': 'Signup',
    '/dashboard': 'Dashboard',
    '/forgot-password': 'Forgot Password',
    '/learn': 'Learn',
    '/course': 'Course'
};

function BreadcrumbsNav() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(Boolean);

    if (location.pathname === '/') {
        return null;
    }

    return (
        <Container className="mt-3 mb-0">
            <Breadcrumb>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                    Home
                </Breadcrumb.Item>
                {pathnames.map((segment, index) => {
                    const route = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    return isLast ? (
                        <Breadcrumb.Item key={route} active>
                            {labelMap[route] || segment}
                        </Breadcrumb.Item>
                    ) : (
                        <Breadcrumb.Item key={route} linkAs={Link} linkProps={{ to: route }}>
                            {labelMap[route] || segment}
                        </Breadcrumb.Item>
                    );
                })}
            </Breadcrumb>
        </Container>
    );
}

export default BreadcrumbsNav;
