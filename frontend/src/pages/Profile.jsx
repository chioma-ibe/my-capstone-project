import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserCourses from '../components/UserCourses';
import CourseSelector from '../components/CourseSelector';
import StudyPreferences from '../components/StudyPreferences';
import Spinner from '../components/spinner/Spinner';
import apiService from '../services/api';
import '../styles/pages/Profile.css';

function Profile() {
  const { currentUser, dbUser, loading } = useAuth();
  const [refreshCourses, setRefreshCourses] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCourseAdded = () => {
    setRefreshCourses(prev => !prev);
  };

  const handleEditBio = () => {
    setBio(dbUser.bio || '');
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    if (!dbUser) return;

    try {
      setIsSaving(true);
      await apiService.updateUser(dbUser.id, { bio });
      setIsEditingBio(false);
      dbUser.bio = bio;
    } catch (error) {
      console.error('Error saving bio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingBio(false);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="page-loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  if (!dbUser) {
    return (
      <div className="profile-container">
        <div className="page-loading">
          <Spinner />
          <p>Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{dbUser.name || currentUser.displayName || currentUser.email}</h1>
          <p className="profile-email">{dbUser.email}</p>

          <div className="profile-bio-section">
            {isEditingBio ? (
              <div className="bio-edit-container">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bio-textarea"
                  maxLength={500}
                />
                <div className="bio-actions">
                  <button
                    onClick={handleSaveBio}
                    className="bio-save-btn"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bio-cancel-btn"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bio-display">
                <div className="bio-header">
                  <h3>About Me</h3>
                  <button onClick={handleEditBio} className="bio-edit-btn">
                    {dbUser.bio ? 'Edit' : 'Add Bio'}
                  </button>
                </div>
                {dbUser.bio ? (
                  <p className="profile-bio">{dbUser.bio}</p>
                ) : (
                  <p className="profile-bio empty">No bio yet</p>
                )}
              </div>
            )}
          </div>
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

        <div className="study-preferences-section">
          <StudyPreferences userId={dbUser.id} />
        </div>
      </div>
    </div>
  );
}

export default Profile;
