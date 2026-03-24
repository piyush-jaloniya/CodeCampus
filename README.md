# CodeCampus

A modern, responsive educational platform for exploring Computer Science courses and managing your learning journey. CodeCampus is your hub for curated programming courses with an intuitive user interface and personalized course management features.

**Version:** 0.1.0  
**Project Type:** React Single Page Application (SPA)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Available Scripts](#available-scripts)
- [Application Routes](#application-routes)
- [Components](#components)
- [Features Explained](#features-explained)
- [Course Catalog](#course-catalog)
- [Authentication System](#authentication-system)
- [Data Persistence](#data-persistence)
- [Styling & Design](#styling--design)
- [Future Improvements](#future-improvements)

---

## Overview

CodeCampus is an educational web application built with React that serves as a central hub for Computer Science learners. The platform provides:

- **Course Discovery:** Browse 6 curated Computer Science courses with detailed descriptions
- **Personalized Learning:** Create an account and save your favorite courses to a wishlist
- **Simple Authentication:** Lightweight signup/login system with local persistence
- **Responsive Design:** Fully responsive UI that works on desktop, tablet, and mobile devices
- **Direct Learning Links:** Quick access to external course resources (primarily YouTube)

The application emphasizes **low friction entry** — users can browse all courses without logging in. Authentication is only required to save courses to their wishlist and access the personal dashboard.

---

## Key Features

### 1. **Course Catalog & Discovery**

- Browse 6 programming courses with descriptions, images, and categories
- View course details on interactive cards
- Direct links to external course content
- Responsive grid layout (1, 2, or 3 columns based on screen size)

### 2. **Course Wishlist System**

- **Authenticated users only:** Save courses for later reference
- Persistent wishlist stored in browser local storage
- Add/remove courses with a single click
- Visual feedback showing saved status

### 3. **User Authentication**

- User signup with email, username, and password validation
- Login with email and password
- Password confirmation during signup
- Session persistence across browser refreshes
- Logout functionality with automatic cleanup

### 4. **Personal Dashboard**

- View your profile (email and username)
- Display all saved courses in an organized list
- Quick access point for personalized learning

### 5. **Contact & Support**

- Contact information display (email, phone, address)
- Contact form for inquiries (UI prepared, backend integration pending)

### 6. **Responsive Navigation**

- Toggle navigation on mobile devices
- Dynamic menu that shows different options based on authentication status
- Quick access to all main pages

### 7. **Professional UI/UX**

- Modern Bootstrap-based design
- Smooth animations and transitions
- Hover effects on interactive elements
- Clean typography and spacing
- Light background with contrasting text

---

## Technology Stack

### Frontend Framework & Libraries

| Technology | Version | Purpose |
|---|---|---|
| **React** | ^19.1.0 | Core UI framework |
| **React DOM** | ^19.1.0 | DOM rendering |
| **React Router DOM** | ^7.5.0 | Client-side routing |
| **React Bootstrap** | ^2.10.9 | Pre-built Bootstrap components |
| **Bootstrap** | ^5.3.5 | CSS framework & utilities |
| **React Icons** | ^5.5.0 | Icon library |
| **React Toastify** | ^11.0.5 | Toast notifications |

### Build & Development Tools

- **React Scripts** ^5.0.1 - Webpack and Babel configuration
- **Create React App** - Project scaffolding and tooling

### Testing Libraries

- @testing-library/react ^16.3.0
- @testing-library/jest-dom ^6.6.3
- @testing-library/user-event ^13.5.0

---

## Project Structure

\`\`\`
codecampus/
├── public/
│   ├── index.html          # Main HTML file
│   ├── icon.ico            # App favicon
│   ├── manifest.json       # PWA manifest
│   └── robots.txt          # SEO robots file
│
├── src/
│   ├── components/
│   │   ├── CourseCard.js   # Reusable course display component
│   │   ├── Navbar.js       # Navigation bar with auth-aware links
│   │   └── icon.ico        # Logo icon file
│   │
│   ├── pages/
│   │   ├── Home.js         # Homepage with hero and value props
│   │   ├── Courses.js      # Course catalog and listing
│   │   ├── Dashboard.js    # User profile and wishlist
│   │   ├── Login.js        # Login form page
│   │   ├── Signup.js       # User registration page
│   │   └── Contact.js      # Contact information and form
│   │
│   ├── App.js              # Main app component with routing
│   ├── App.css             # Global and component styles
│   ├── index.js            # React entry point
│   └── index.css           # Base styles
│
├── package.json            # Project dependencies and scripts
├── README.md               # This file
├── .gitignore              # Git ignore rules
└── [node_modules/]         # Installed packages (not in repo)
\`\`\`

---

## Installation & Setup

### Prerequisites

- **Node.js** (v14 or higher recommended)
- **npm** (comes with Node.js) or **yarn**
- A modern web browser

### Step-by-Step Setup

1. **Clone or download the project**
   \`\`\`bash
   cd codecampus
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`
   This will install all required packages listed in \`package.json\`.

3. **Start the development server**
   \`\`\`bash
   npm start
   \`\`\`
   The app will open automatically at \`<http://localhost:3000\`>

4. **Build for production**
   \`\`\`bash
   npm run build
   \`\`\`
   Creates an optimized production build in the \`build/\` folder.

---

## Available Scripts

### \`npm start\`

Launches the development server with hot-reload enabled.

- Opens browser at \`<http://localhost:3000\`>
- Application reloads on file changes
- Displays lint errors in console

### \`npm run build\`

Creates an optimized production build.

- Minifies and bundles all code
- Optimizes assets for best performance
- Output saved to \`build/\` folder
- Ready for deployment

### \`npm test\`

Launches the test runner in interactive watch mode.

- Runs Jest tests
- Re-runs on file changes
- Good for development-driven testing

### \`npm run eject\`

⚠️ **One-way operation** - Exposes webpack and Babel configuration.

- Only use if you need full control over build configuration
- Cannot be undone
- Not recommended for beginners

---

## Application Routes

| Route | Component | Access | Purpose |
|---|---|---|---|
| \`/\` | Home | Public | Landing page with value proposition |
| \`/courses\` | Courses | Public | Browse all available courses |
| \`/contact\` | Contact | Public | Contact information and inquiry form |
| \`/login\` | Login | Public | User login form |
| \`/signup\` | Signup | Public | New user registration form |
| \`/dashboard\` | Dashboard | Private* | View profile and saved courses |

*Private = Requires authentication (redirects to login if not authenticated)

---

## Components

### **Navbar** (\`src/components/Navbar.js\`)

**Purpose:** Top navigation bar visible on all pages

**Props:**

- \`user\` (object|null) - Current logged-in user data
- \`onLogout\` (function) - Callback to handle logout

**Features:**

- Logo and brand name
- Links to Home, Courses, Contact
- Conditional auth links (Login/Signup or Dashboard/Logout)
- Mobile-responsive hamburger menu
- Dark theme styling

---

### **CourseCard** (\`src/components/CourseCard.js\`)

**Purpose:** Reusable component to display individual course

**Props:**

- \`course\` (string) - Course name/title
- \`description\` (string) - Course description
- \`image\` (string) - Course thumbnail URL
- \`link\` (string) - External link to course content
- \`user\` (object|null) - Current user (for permission checking)
- \`wishlist\` (array) - List of wishlisted course names
- \`onWishlist\` (function) - Callback to add/remove from wishlist

**Features:**

- Course image with fixed height
- Course title and description
- "View Course" button linking to external resource
- "Save/Saved" toggle button for wishlist
- Auth gate: shows login prompt if not authenticated
- Visual feedback on wishlisted status

---

## Pages Overview

### **Home** (\`src/pages/Home.js\`)

- Hero section with background image and CTAs
- "Why Choose CodeCampus?" feature showcase (3 columns):
  - Expert Courses
  - Hands-on Learning
  - Flexible Schedule
- Call-to-action button to join

---

### **Courses** (\`src/pages/Courses.js\`)

- Displays all 6 courses in a responsive grid
- Uses CourseCard component for each course
- Passes user, wishlist, and handlers to each card
- Centered layout on larger screens

---

### **Login** (\`src/pages/Login.js\`)

- Email and password input fields
- Form validation (required fields)
- Error messages for invalid credentials
- Sign-up link for new users
- Validates against stored registeredUser data

---

### **Signup** (\`src/pages/Signup.js\`)

- Username, email, password, confirm password fields
- Comprehensive validation:
  - Email format validation
  - Password length minimum (6 characters)
  - Password match confirmation
  - Required field validation
- Stores user data to localStorage
- Redirects to login after successful signup

---

### **Dashboard** (\`src/pages/Dashboard.js\`)

- Shows logged-in user's email
- Displays all wishlisted courses in a list
- Shows "No courses wishlisted yet" if empty
- Protected route (shows login prompt if not authenticated)

---

### **Contact** (\`src/pages/Contact.js\`)

- Two-column layout:
  - **Left:** Contact information card with email, phone, address
  - **Right:** Contact form with fields for name, email, message
- Bootstrap form components with proper structure
- Form is UI-ready (backend integration needed)

---

## Features Explained

### Authentication Flow

1. **Signup Process:**
   - User fills signup form with username, email, password
   - Validation checks for required fields, email format, password strength
   - User data stored in \`localStorage\` under key \`registeredUser\`
   - Redirects to login page after success

2. **Login Process:**
   - User enters email and password
   - Credentials validated against stored \`registeredUser\`
   - If valid: user object created and stored in \`localStorage['user']\`
   - App state updates with user data
   - Automatic redirect to \`/dashboard\`

3. **Logout:**
   - Clears \`user\` and \`wishlist\` from localStorage
   - Resets app state
   - Redirects to home page

### Wishlist System

1. **Anonymous Users:**
   - Cannot add to wishlist
   - "Save" button is disabled
   - Clicking prompts redirect to login

2. **Authenticated Users:**
   - Click "Save" to add course to wishlist
   - Button changes to "Saved" (visual feedback)
   - Click "Saved" to remove from wishlist
   - Data persisted in \`localStorage['wishlist']\`
   - Wishlist survives page refreshes

---

## Course Catalog

CodeCampus offers **6 core Computer Science courses:**

| # | Course Name | Focus Area | Topics Covered |
|---|---|---|---|
| 1 | **Java Programming** | Backend/OOP | Basics, OOP, Collections, Multithreading |
| 2 | **HTML-CSS-JAVASCRIPT** | Frontend | HTML5, CSS3, JavaScript fundamentals |
| 3 | **React Development** | Frontend Frameworks | React Hooks, State Management, Modern UIs |
| 4 | **Data Structures & Algorithm** | Core CS | Arrays, Linked Lists, Trees, Algorithms |
| 5 | **Machine Learning** | AI/ML | ML Models, Neural Networks, TensorFlow |
| 6 | **Python Programming** | General Purpose | Syntax, Libraries, Real-world Applications |

**Delivery Model:**

- Courses hosted externally (primarily YouTube playlists)
- Clickable "View Course" links direct to content
- No in-app video playback or progress tracking
- Lightweight aggregation/curation model

---

## Authentication System

### Storage & Persistence

**localStorage Keys:**

- \`registeredUser\` - Stores signup data: \`{ username, email, password }\`
- \`user\` - Stores logged-in user: \`{ username, email }\`
- \`wishlist\` - Array of wishlisted course names

### Security Considerations (Current)

⚠️ **Important Notes:**

- Passwords stored in plain text in localStorage (NOT secure)
- **For production:** Implement backend authentication with hashed passwords and secure session/JWT tokens
- **For production:** Use HTTPS and secure cookies
- Current implementation suitable only for learning/demo purposes

---

## Data Persistence

All user data is persisted client-side using **browser's localStorage**:

\`\`\`javascript
// Example: Accessing stored data
const user = JSON.parse(localStorage.getItem('user'));
const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
const registeredUser = JSON.parse(localStorage.getItem('registeredUser'));
\`\`\`

**Lifecycle:**

- Data survives page refresh
- Cleared on logout
- Cleared on browser's "Clear Storage" action
- Does NOT sync across tabs automatically

---

## Styling & Design

### Design System

**Color Palette:**

- Primary Blue: \`#3498db\`
- Dark Blue: \`#2c3e50\`
- Light Gray: \`#f8f9fa\`
- White: \`#ffffff\`
- Text Gray: \`#212529\`

**Bootstrap Components Used:**

- Container, Row, Col (responsive grid)
- Navbar, Nav (navigation)
- Card, CardImg, CardBody, CardTitle, CardText (content cards)
- Form, FormGroup, FormLabel, FormControl (forms)
- Button (with variants: primary, secondary, success, danger, outline-*)
- ListGroup, ListGroupItem (lists)
- Alert (error/success messages)

**Custom CSS Classes:** (\`src/App.css\`)

- \`.hero-section\` - Large background image with gradient overlay
- \`.navbar-logo\` - Logo scaling animation on hover
- \`.card\` - Hover lift effect with shadow increase
- \`.contact-info\` - Rounded card styling
- \`.form-control\` - Rounded input fields with padding
- Responsive breakpoints at 768px for mobile adjustments

---

## Future Improvements

### Short-term Enhancements

- [ ] Implement contact form submission to backend/email service
- [ ] Add course filtering and search functionality
- [ ] Add course categories/difficulty levels
- [ ] Implement "Continue Learning" feature to track progress
- [ ] Add course ratings and user reviews
- [ ] Add course prerequisites/recommendations

### Medium-term Features

- [ ] Backend API integration for persistent authentication
- [ ] User profile editing (update username, email, password)
- [ ] Email verification during signup
- [ ] Password reset functionality
- [ ] Course completion tracking and progress bars
- [ ] Certificate generation upon course completion
- [ ] Social features (share courses, follow learners)

### Long-term Enhancements

- [ ] Monetization system (free/premium courses)
- [ ] In-app video player with playback tracking
- [ ] Discussion forums and peer learning
- [ ] Instructor/admin panel
- [ ] Course content uploaded directly (not just links)
- [ ] Analytics dashboard for instructors
- [ ] Mobile app (React Native)
- [ ] Advanced recommendation engine (ML-based)
- [ ] Gamification (badges, points, leaderboards)

### Technical Debt & Refactoring

- [ ] Extract API calls to separate service layer
- [ ] Implement proper state management (Redux/Context API)
- [ ] Add comprehensive error handling and logging
- [ ] Add unit and integration tests
- [ ] Improve code documentation with JSDoc comments
- [ ] Implement proper input sanitization
- [ ] Add loading states and skeletons during data fetch
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add environment variables for configuration

---

## Getting Started for Development

1. **Fork or clone the repository**
2. **Install dependencies:** \`npm install\`
3. **Start development server:** \`npm start\`
4. **Make changes** to components in \`src/\`
5. **Test in browser** at \`<http://localhost:3000\`>
6. **Commit changes** to git: \`git add . && git commit -m "Your message"\`

For questions or contributions, please refer to the project's issue tracker or documentation.

---

## License

This project is part of the "Front End" course (Semester 2) at your institution.

---

**Last Updated:** March 24, 2026  
**Project Status:** In Development (MVP Phase)
