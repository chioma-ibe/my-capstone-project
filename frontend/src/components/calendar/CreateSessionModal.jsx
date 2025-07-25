import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/components/calendar/CreateSessionModal.css';

function CreateSessionModal({
  onClose,
  onSessionCreated,
  onSessionUpdated,
  existingSession = null,
  preselectedAttendee,
  initialDateTime = null
}) {
  const { dbUser } = useAuth();
  const isEditMode = !!existingSession;

  const [formData, setFormData] = useState(() => {
    if (isEditMode) {
      const startDateTime = new Date(existingSession.start.dateTime);
      const endDateTime = new Date(existingSession.end.dateTime);

      const startDate = startDateTime.toISOString().split('T')[0];
      const startTime = startDateTime.toTimeString().substring(0, 5);
      const endDate = endDateTime.toISOString().split('T')[0];
      const endTime = endDateTime.toTimeString().substring(0, 5);

      let summary = existingSession.summary;
      if (summary.startsWith('Study Session: ')) {
        summary = summary.substring('Study Session: '.length);
      }

      const attendeesString = existingSession.attendees
        ? existingSession.attendees.map(a => a.email).join(', ')
        : '';

      const hasConference = !!existingSession.conferenceData;

      return {
        summary,
        description: existingSession.description || '',
        location: existingSession.location || '',
        startDate,
        startTime,
        endDate,
        endTime,
        attendees: attendeesString,
        includeConference: hasConference
      };
    } else if (initialDateTime) {
      const startDateTime = initialDateTime.start;
      const endDateTime = initialDateTime.end;

      const startDate = startDateTime.toISOString().split('T')[0];
      const startTime = startDateTime.toTimeString().substring(0, 5);
      const endDate = endDateTime.toISOString().split('T')[0];
      const endTime = endDateTime.toTimeString().substring(0, 5);

      return {
        summary: '',
        description: '',
        location: '',
        startDate,
        startTime,
        endDate,
        endTime,
        attendees: preselectedAttendee || '',
        includeConference: true
      };
    } else {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      const startDate = now.toISOString().split('T')[0];
      const startTime = now.toTimeString().substring(0, 5);
      const endDate = oneHourLater.toISOString().split('T')[0];
      const endTime = oneHourLater.toTimeString().substring(0, 5);

      return {
        summary: '',
        description: '',
        location: '',
        startDate,
        startTime,
        endDate,
        endTime,
        attendees: preselectedAttendee || '',
        includeConference: true
      };
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.summary || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const now = new Date();

      if (!isEditMode && startDateTime < now) {
        setError('Study sessions cannot be scheduled in the past');
        setLoading(false);
        return;
      }

      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      const startDateTimeISO = startDateTime.toISOString();
      const endDateTimeISO = endDateTime.toISOString();

      const attendeesList = formData.attendees
        ? formData.attendees.split(',').map(email => ({ email: email.trim() }))
        : [];

      const sessionDetails = {
        userId: dbUser.id,
        summary: `Study Session: ${formData.summary}`,
        description: formData.description,
        location: formData.location,
        startTime: startDateTimeISO,
        endTime: endDateTimeISO,
        attendees: attendeesList,
        includeConference: formData.includeConference
      };

      if (isEditMode) {
        await onSessionUpdated(existingSession.id, sessionDetails);
      } else {
        await onSessionCreated(sessionDetails);
      }

      onClose();
    } catch (err) {
      setError('Failed to create study session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Study Session' : 'Create Study Session'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="summary">Course </label>
            <input
              type="text"
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time *</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location on campus</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="attendees">Attendees</label>
            <input
              type="text"
              id="attendees"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
            />
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="includeConference"
              name="includeConference"
              checked={formData.includeConference}
              onChange={handleChange}
            />
            <label htmlFor="includeConference">Include Google Meet link</label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? (isEditMode ? 'Updating...' : 'Creating...')
                : (isEditMode ? 'Update Session' : 'Create Session')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSessionModal;
