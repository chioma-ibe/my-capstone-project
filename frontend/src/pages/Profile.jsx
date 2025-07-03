import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserCourses from '../components/UserCourses';
import CourseSelector from '../components/CourseSelector';
import '../styles/pages/Profile.css';

function Profile() {
  const { currentUser, dbUser, loading } = useAuth();
  const [refreshCourses, setRefreshCourses] = useState(false);

  const handleCourseAdded = () => {
    setRefreshCourses(prev => !prev);
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  if (!dbUser) {
    return <div>Setting up your profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{dbUser.name || currentUser.displayName || currentUser.email}</h1>
          <p className="profile-email">{dbUser.email}</p>
          <p className="profile-bio">{dbUser.bio || ''}</p>
          <button className="edit-profile-btn">Edit Profile</button>
        </div>
      </div>

      <div className="profile-content">
        <div className="courses-section">
          <div className="user-courses-container">
            <UserCourses
              userId={dbUser.id}
              key={refreshCourses ? 'refresh' : 'normal'}
            />
          </div>

          <div className="course-selector-container">
            <CourseSelector
              userId={dbUser.id}
              onCourseAdded={handleCourseAdded}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
