# Study Buddy Matcher

A web application that helps students find compatible study partners based on shared courses, proficiency levels, and availability. My application aims to allow computer science students to connect to share knowledge in a more convenient way.

## Features

### User Authentication
- Firebase Authentication integration for secure user management
- Email/password login and registration
- Google Sign-In with calendar permissions for scheduling study sessions
- Protected routes for authenticated users

### Profile Management
- User profile creation
- Course selection with proficiency levels (1-5)

### Study Preferences
- Set preferred study days
- Configure time ranges for availability
- Specify session duration preferences (30, 60, 90 minutes)
- Set maximum sessions per week
- Customize matching algorithm weights:
  - Course overlap importance
  - Proficiency balance importance
  - User rating importance

### Match Finding
- Swipe-style interface for finding study partners
- Interactive card UI with drag gestures using Framer Motion
- Send and receive match requests
- Accept or skip potential matches

### Smart Matching Algorithm
- Multi-factor compatibility scoring based on:
  - Course overlap (shared courses between users)
  - Proficiency balance (complementary skill levels)
  - Schedule compatibility (overlapping availability)
  - User ratings (reputation in the system)
- Weighted scoring system customizable by users
- Prioritization of pending match requests

### Calendar Integration
- Google Calendar API integration
- Schedule study sessions with matched users
- View upcoming and past study sessions
- Create, edit, and delete study sessions

### Rating System
- Rate study partners after sessions
- View average ratings of potential matches
- Build reputation as a reliable study partner which could factor to likelihood of getting recommended to other users

### User Experience
- Dark/light mode toggle with persistent preference
- Interactive animations and transitions
- Toast notifications for user feedback
- Loading states and error handling
