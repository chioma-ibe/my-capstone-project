import { useState } from 'react';
import '../styles/pages/Matches.css';

function Matches() {
  const [matches] = useState([
    {
      id: 1,
      name: 'Alex Johnson',
      matchedAt: '2023-10-15',
      courses: ['Introduction to Computer Science', 'Machine Learning']
    },
    {
      id: 2,
      name: 'Jamie Smith',
      matchedAt: '2023-10-12',
      courses: ['Data Structures and Algorithms', 'Web Development']
    },
    {
      id: 3,
      name: 'Morgan Lee',
      matchedAt: '2023-10-10',
      courses: ['Software Engineering', 'Database Systems']
    }
  ]);

  return (
    <div className="matches-container">
      <h1>Your Matches</h1>
      <p className="matches-description">
        Connect with your study buddies and schedule study sessions!
      </p>

      {matches.length === 0 ? (
        <div className="no-matches">
          <p>You don't have any matches yet. Start matching with potential study buddies!</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-info">
                <h2>{match.name}</h2>
                <p className="match-date">Matched on {match.matchedAt}</p>
                <div className="match-courses">
                  <h3>Shared Courses:</h3>
                  <ul>
                    {match.courses.map((course, index) => (
                      <li key={index}>{course}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="match-actions">
                <button className="schedule-btn">Schedule Study Session</button>
                <button className="rate-btn">Rate Study Partner</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Matches;
