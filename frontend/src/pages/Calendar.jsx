import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import calendarClient from '../services/calendarClient';
import SessionDetailsModal from '../components/calendar/SessionDetailsModal';
import CreateSessionModal from '../components/calendar/CreateSessionModal';
import Spinner from '../components/spinner/Spinner';
import '../styles/pages/Calendar.css';

function Calendar() {
  const { currentUser, googleToken, signInWithGoogle, dbUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
          timeMax: thirtyDaysLater.toISOString()
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

  useEffect(() => {
    fetchStudySessions();
  }, [googleToken, refreshTrigger]);


  if (loading) {
    return (
      <div className="calendar-container">
        <div className="page-loading">
          <Spinner />
        </div>
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

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setDetailsModalOpen(true);
  };

  const handleEdit = (session) => {
    setSelectedSession(session);
    setEditModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    try {
      setLoading(true);
      await calendarClient.deleteStudySession(googleToken, eventId, dbUser.id);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError('Failed to delete study session');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUpdated = async (eventId, sessionDetails) => {
    try {
      await calendarClient.updateStudySession(googleToken, eventId, sessionDetails);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError('Failed to update study session');
      throw err;
    }
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedSession(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedSession(null);
  };

  return (
    <div className="calendar-container">
      <h1>Study Sessions Calendar</h1>
      <p className="calendar-description">
        View and manage your upcoming study sessions
      </p>

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
                  <button
                    className="view-btn"
                    onClick={() => handleViewDetails(session)}
                  >
                    View Details
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(session)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(session.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detailsModalOpen && selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={handleCloseDetailsModal}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editModalOpen && selectedSession && (
        <CreateSessionModal
          existingSession={selectedSession}
          onClose={handleCloseEditModal}
          onSessionUpdated={handleSessionUpdated}
        />
      )}
    </div>
  );
}

export default Calendar;
