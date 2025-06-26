import { useState, useEffect } from 'react';
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
  const [error] = useState(null);

  useEffect(() => {
    const mockCourses = [
      {
        id: 1,
        userId: 1,
        courseId: 1,
        proficiency: 3,
        course: { id: 1, name: "Introduction to Computer Science", description: "Fundamentals of CS" }
      },
      {
        id: 2,
        userId: 1,
        courseId: 2,
        proficiency: 4,
        course: { id: 2, name: "Data Structures", description: "Advanced data structures" }
      },
      {
        id: 3,
        userId: 1,
        courseId: 3,
        proficiency: 5,
        course: { id: 3, name: "Algorithms", description: "Algorithm design and analysis" }
      }
    ];
    setUserCourses(mockCourses);
    setLoading(false);
  }, [userId]);

  const handleRemoveCourse = (courseId) => {
    setUserCourses(userCourses.filter(uc => uc.courseId !== courseId));
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
