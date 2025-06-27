import { useState } from 'react';
import '../styles/pages/Home.css';

function Home() {
  const [users] = useState([
    {
      id: 1,
      name: 'Alex Johnson',
      bio: 'Computer Science major interested in AI and machine learning.',
      courses: ['Introduction to Computer Science', 'Machine Learning', 'Artificial Intelligence']
    },
    {
      id: 2,
      name: 'Jamie Smith',
      bio: 'Math major looking for study partners for calculus and linear algebra.',
      courses: ['Data Structures and Algorithms', 'Database Systems', 'Web Development']
    },
    {
      id: 3,
      name: 'Taylor Wilson',
      bio: 'Engineering student passionate about robotics and programming.',
      courses: ['Operating Systems', 'Computer Networks', 'Mobile App Development']
    },
    {
      id: 4,
      name: 'Morgan Lee',
      bio: 'Physics major interested in theoretical physics and astronomy.',
      courses: ['Software Engineering', 'Web Development', 'Database Systems']
    }
  ]);

  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const currentUser = users[currentUserIndex];

  const handleMatch = () => {
    goToNextUser();
  };

  const handleSkip = () => {
    goToNextUser();
  };

  const goToNextUser = () => {
    setCurrentUserIndex((prevIndex) => {
      if (prevIndex >= users.length - 1) {
        return 0;
      } else {
        return prevIndex + 1;
      }
    });
  };

  return (
    <div className="home-container">
      <h1>Find Study Buddies</h1>
      <p className="home-description">
        Match with other students taking the same courses as you!
      </p>

      <div className="single-user-container">
        <div className="user-card">
          <div className="user-info">
            <h2>{currentUser.name}</h2>
            <p className="user-bio">{currentUser.bio}</p>
            <div className="user-courses">
              <h3>Courses:</h3>
              <ul>
                {currentUser.courses.map((course, index) => (
                  <li key={index}>{course}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card-actions">
            <button
              className="skip-button"
              onClick={handleSkip}
            >
              Skip
            </button>
            <button
              className="match-button"
              onClick={handleMatch}
            >
              Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
