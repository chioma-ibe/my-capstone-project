import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import calendarClient from '../services/calendarClient';

function Calendar() {
  const { currentUser, googleToken, signInWithGoogle } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudySessions = async () => {
      if (!googleToken) {
        setError('Google authentication required to access calendar');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const options = {
          timeMin: now.toISOString(),
          timeMax: thirtyDaysLater.toISOString(),
          query: ''
        };

        const studySessions = await calendarClient.getStudySessions(googleToken, options);
        setSessions(studySessions);
      } catch (err) {
        if (err.message.includes('Authentication failed') ||
            err.message.includes('auth') ||
            err.message.includes('token')) {
          setError('Your Google authentication has expired');
          localStorage.removeItem('googleToken');
        } else {
          setError('Failed to load study sessions');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudySessions();
  }, [googleToken]);

  if (loading) {
    return (
      <div className="calendar-container">
        <div>Loading your study sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-container">
        <div className="error-message">Error: {error}</div>
        <div className="auth-message">
          <p>You need to sign in with Google to access calendar.</p>
          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                setError('Failed to sign in with Google');
              }
            }}
            className="google-signin-btn"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="calendar-container">
        <div>Please log in to view your calendar.</div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <h1>Study Sessions Calendar</h1>
      <p className="calendar-description">
        View and manage your upcoming study sessions
      </p>

      <div className="calendar-actions">
        <button className="create-session-btn">Create New Study Session</button>
      </div>

      <div className="sessions-list">
        <h2>Upcoming Sessions</h2>
        {sessions.length === 0 ? (
          <p className="no-sessions">You don't have any upcoming study sessions.</p>
        ) : (
          <ul className="sessions-grid">
            {sessions.map((session) => (
              <li key={session.id} className="session-card">
                <div className="session-header">
                  <h3>{session.summary}</h3>
                  <span className="session-date">
                    {new Date(session.start.dateTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="session-time">
                  <span>
                    {new Date(session.start.dateTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span> - </span>
                  <span>
                    {new Date(session.end.dateTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {session.description && (
                  <p className="session-description">{session.description}</p>
                )}
                {session.location && (
                  <p className="session-location">Location: {session.location}</p>
                )}
                <div className="session-actions">
                  <button className="view-btn">View Details</button>
                  <button className="edit-btn">Edit</button>
                  <button className="delete-btn">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Calendar;
