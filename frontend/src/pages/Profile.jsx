import { useState } from 'react';
import UserCourses from '../components/UserCourses';
import CourseSelector from '../components/CourseSelector';
import '../styles/pages/Profile.css';

function Profile() {
  const [userId] = useState(1);
  const [refreshCourses, setRefreshCourses] = useState(false);
  const [user] = useState({
    id: 1,
    name: 'Chioma',
    email: 'chioma@ibe.com',
    bio: 'Computer Engineerin student looking for study partners in programming courses.'
  });

  const handleCourseAdded = () => {
    setRefreshCourses(prev => !prev);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-bio">{user.bio}</p>
          <button className="edit-profile-btn">Edit Profile</button>
        </div>
      </div>

      <div className="profile-content">
        <div className="courses-section">
          <div className="user-courses-container">
            <UserCourses
              userId={userId}
              key={refreshCourses ? 'refresh' : 'normal'}
            />
          </div>

          <div className="course-selector-container">
            <CourseSelector
              userId={userId}
              onCourseAdded={handleCourseAdded}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
