import { useState, useEffect } from 'react';
import apiService from '../services/api';
import '../styles/components/CourseSelector.css';

const proficiencyOptions = [
  { value: 1, label: '1 - Novice' },
  { value: 2, label: '2 - Basic' },
  { value: 3, label: '3 - Intermediate' },
  { value: 4, label: '4 - Advanced' },
  { value: 5, label: '5 - Expert' }
];

function CourseSelector({ userId, onCourseAdded }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState(1);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await apiService.getCourses();
        setCourses(coursesData);
        setError(null);
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourse) {
      setError('Please select a course');
      return;
    }

    try {
      setError(null);
      const addedCourse = await apiService.addUserCourse(
        userId,
        parseInt(selectedCourse),
        parseInt(selectedProficiency)
      );

      setSelectedCourse('');
      setSelectedProficiency(1);

      if (onCourseAdded) {
        onCourseAdded(addedCourse);
      }
    } catch (err) {
      if (err.message.includes('already enrolled')) {
        setError('You are already enrolled in this course');
      } else {
        setError('Failed to add course');
      }
      console.error('Error adding course:', err);
    }
  };

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!courses.length) return <div>No courses available.</div>;

  return (
    <div className="course-selector">
      <h2>Add a Course</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="course">Course:</label>
          <select
            id="course"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="proficiency">Proficiency Level:</label>
          <select
            id="proficiency"
            value={selectedProficiency}
            onChange={(e) => setSelectedProficiency(e.target.value)}
            required
          >
            {proficiencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="add-course-btn">
          Add Course
        </button>
      </form>
    </div>
  );
}

export default CourseSelector;
