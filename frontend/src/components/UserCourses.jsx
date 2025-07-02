import { useState, useEffect } from 'react';
import apiService from '../services/api';
import '../styles/components/UserCourses.css';

const getProficiencyLabel = (level) => {
  switch (level) {
    case 1: return '1 - Novice';
    case 2: return '2 - Basic';
    case 3: return '3 - Intermediate';
    case 4: return '4 - Advanced';
    case 5: return '5 - Expert';
    default: return `${level}`;
  }
};

function UserCourses({ userId }) {
  const [userCourses, setUserCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await apiService.getUserCourses(userId);
        setUserCourses(coursesData);
        setError(null);
      } catch (err) {
        setError('Failed to load your courses');
        console.error('Error fetching user courses:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserCourses();
    }
  }, [userId]);

  const handleRemoveCourse = async (courseId) => {
    try {
      await apiService.removeUserCourse(userId, courseId);
      setUserCourses(userCourses.filter(uc => uc.courseId !== courseId));
      setError(null);
    } catch (err) {
      setError('Failed to remove course');
      console.error('Error removing course:', err);
    }
  };

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userCourses.length) return <div>No courses added yet.</div>;

  return (
    <div className="user-courses">
      <h2>My Courses</h2>
      <div className="courses-list">
        {userCourses.map((userCourse) => (
          <div key={userCourse.id} className="course-item">
            <div className="course-info">
              <h3>{userCourse.course.name}</h3>
              <p className="proficiency-badge">Proficiency: {getProficiencyLabel(userCourse.proficiency)}</p>
              {userCourse.course.description && (
                <p className="course-description">{userCourse.course.description}</p>
              )}
            </div>
            <button
              className="remove-course-btn"
              onClick={() => handleRemoveCourse(userCourse.courseId)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserCourses;
