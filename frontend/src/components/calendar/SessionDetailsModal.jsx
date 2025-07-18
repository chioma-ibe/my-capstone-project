import { useState } from 'react';
import '../../styles/components/calendar/SessionDetailsModal.css';

function SessionDetailsModal({ session, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!session) return null;

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(session.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleEdit = () => {
    onEdit(session);
    onClose();
  };

  const meetLink = session.conferenceData?.entryPoints?.find(
    entry => entry.entryPointType === 'video'
  )?.uri;

  return (
    <div className="session-details-modal-overlay" onClick={onClose}>
      <div className="session-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="session-details-modal-header">
          <h2>Study Session Details</h2>
          <button className="session-details-modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="session-details-modal-body">
          <div className="session-details-item">
            <span className="session-details-label">Title</span>
            <div className="session-details-value">{session.summary}</div>
          </div>

          <div className="session-details-item">
            <span className="session-details-label">Start Time</span>
            <div className="session-details-value">
              {formatDateTime(session.start.dateTime)}
            </div>
          </div>

          <div className="session-details-item">
            <span className="session-details-label">End Time</span>
            <div className="session-details-value">
              {formatDateTime(session.end.dateTime)}
            </div>
          </div>

          {session.description && (
            <div className="session-details-item">
              <span className="session-details-label">Description</span>
              <div className="session-details-value session-details-description">
                {session.description}
              </div>
            </div>
          )}

          {session.location && (
            <div className="session-details-item">
              <span className="session-details-label">Location</span>
              <div className="session-details-value">{session.location}</div>
            </div>
          )}

          {meetLink && (
            <div className="session-details-item">
              <span className="session-details-label">Google Meet</span>
              <div className="session-details-value">
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="session-details-meet-link"
                >
                  Join Google Meet
                </a>
              </div>
            </div>
          )}

          {session.attendees && session.attendees.length > 0 && (
            <div className="session-details-item">
              <span className="session-details-label">Attendees</span>
              <ul className="session-details-attendees">
                {session.attendees.map((attendee, index) => (
                  <li key={index} className="session-details-attendee">
                    {attendee.email}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="session-details-footer">
          <button
            className="session-details-btn session-details-close-btn"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="session-details-btn session-details-edit-btn"
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            className="session-details-btn session-details-delete-btn"
            onClick={handleDelete}
          >
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionDetailsModal;
