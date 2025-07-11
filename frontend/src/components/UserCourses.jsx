import { useState, useEffect, useRef } from 'react';
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

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [updatingProficiency, setUpdatingProficiency] = useState(false);
  const [selectedProficiency, setSelectedProficiency] = useState(1);
  const proficiencyMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (proficiencyMenuRef.current && !proficiencyMenuRef.current.contains(event.target)) {
        setEditingCourseId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleEditProficiency = (courseId, currentProficiency) => {
    setEditingCourseId(courseId);
    setSelectedProficiency(currentProficiency);
  };

  const handleUpdateProficiency = async (courseId) => {
    try {
      setUpdatingProficiency(true);
      await apiService.updateUserCourseProficiency(userId, courseId, selectedProficiency);

      setUserCourses(userCourses.map(uc =>
        uc.courseId === courseId ? { ...uc, proficiency: selectedProficiency } : uc
      ));

      setEditingCourseId(null);
      setError(null);
    } catch (err) {
      setError('Failed to update proficiency');
      console.error('Error updating proficiency:', err);
    } finally {
      setUpdatingProficiency(false);
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
              {editingCourseId !== userCourse.courseId && (
                <button
                  className="edit-proficiency-btn"
                  onClick={() => handleEditProficiency(userCourse.courseId, userCourse.proficiency)}
                >
                  Edit Proficiency
                </button>
              )}
              <p>Proficiency: {getProficiencyLabel(userCourse.proficiency)}</p>
              {editingCourseId === userCourse.courseId && (
                <div className="proficiency-editor" ref={proficiencyMenuRef}>
                  <select
                    value={selectedProficiency}
                    onChange={(e) => setSelectedProficiency(Number(e.target.value))}
                    disabled={updatingProficiency}
                  >
                    <option value={1}>1 - Novice</option>
                    <option value={2}>2 - Basic</option>
                    <option value={3}>3 - Intermediate</option>
                    <option value={4}>4 - Advanced</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                  <button
                    onClick={() => handleUpdateProficiency(userCourse.courseId)}
                    disabled={updatingProficiency}
                  >
                    {updatingProficiency ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingCourseId(null)}>
                    Cancel
                  </button>
                </div>
              )}
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
