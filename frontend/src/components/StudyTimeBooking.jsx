import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import studyPreferencesClient from '../services/studyPreferencesClient';
import Toast from './toastComponents/Toast';
import '../styles/components/StudyTimeBooking.css';

function StudyTimeBooking({ partnerId, partnerName, partnerEmail, sharedCourses, onClose, onSessionCreated }) {
  const { dbUser } = useAuth();
  const [compatibleTimes, setCompatibleTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [includeConference, setIncludeConference] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showToast, setShowToast] = useState(false);

  document.body.classList.add('modal-open');

  const handleModalClose = () => {
    document.body.classList.remove('modal-open');
    onClose();
  };

  useEffect(() => {
    async function fetchCompatibleTimes() {
      if (!dbUser?.id || !partnerId) return;

      try {
        setLoading(true);
        setError(null);
        const times = await studyPreferencesClient.getCompatibleStudyTimes(dbUser.id, partnerId);
        setCompatibleTimes(times);

        if (sharedCourses && sharedCourses.length > 0) {
          setSelectedCourse(sharedCourses[0].name);
        }
      } catch (err) {
        console.error('Error fetching compatible times:', err);
        setCompatibleTimes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCompatibleTimes();
  }, [dbUser?.id, partnerId, sharedCourses]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectTime = (index) => {
    setSelectedTimeIndex(index);
  };

  const handleBookSession = async () => {
    if (selectedTimeIndex === null || !selectedCourse) {
      setError('Please select a time and course for your study session');
      return;
    }

    try {
      setBookingInProgress(true);
      setError(null);

      const selectedTime = compatibleTimes[selectedTimeIndex];
      const startDateTime = new Date(selectedTime.start);
      const endDateTime = new Date(selectedTime.end);

      const attendeesList = [{ email: partnerEmail }];

      const sessionDetails = {
        userId: dbUser.id,
        summary: `Study Session: ${selectedCourse}`,
        description: description || `Study session with ${partnerName}`,
        location: location || '',
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        attendees: attendeesList,
        includeConference: includeConference
      };

      await onSessionCreated(sessionDetails);

      setShowToast(true);

      setTimeout(() => {
        document.body.classList.remove('modal-open');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error booking session:', err);
      setError('Failed to book study session. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="study-time-booking-modal">
        <div className="modal-header">
          <h2>Finding Best Study Times</h2>
          <button className="close-btn" onClick={handleModalClose}>&times;</button>
        </div>
        <div className="modal-body loading">
          <div className="loading-spinner"></div>
          <p>Finding compatible study times based on your preferences...</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <Toast
        message="Study session booked successfully!"
        show={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="study-time-booking-modal">
        <div className="modal-header">
          <h2>Book Study Time with {partnerName}</h2>
          <button className="close-btn" onClick={handleModalClose}>&times;</button>
        </div>

      <div className="modal-body">
        {error && <div className="error-message">{error}</div>}

        {compatibleTimes.length === 0 ? (
          <div className="no-times-available">
            <p>No compatible study times found based on your preferences.</p>
            <p>Try updating your study preferences or use the manual scheduling option.</p>
            <button className="btn btn-secondary" onClick={handleModalClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="compatible-times-section">
              <h3>Recommended Study Times</h3>
              <p className="recommendation-info">
                These times are calculated based on both your study preferences.
              </p>

              <div className="time-slots">
                {compatibleTimes.map((time, index) => (
                  <div
                    key={index}
                    className={`time-slot ${selectedTimeIndex === index ? 'selected' : ''} ${time.perfectMatch ? 'perfect-match' : ''}`}
                    onClick={() => handleSelectTime(index)}
                  >
                    <div className="time-slot-date">{formatDate(time.start)}</div>
                    <div className="time-slot-time">
                      {formatTime(time.start)} - {formatTime(time.end)}
                    </div>
                    {time.perfectMatch && <div className="perfect-match-badge">Perfect Match</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="session-details-section">
              <h3>Session Details</h3>

              <div className="form-group">
                <label htmlFor="course">Course *</label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                >
                  <option value="">Select a course</option>
                  {sharedCourses && sharedCourses.map(course => (
                    <option key={course.id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location (optional)</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}

                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="includeConference"
                  checked={includeConference}
                  onChange={(e) => setIncludeConference(e.target.checked)}
                />
                <label htmlFor="includeConference">Include Google Meet link</label>
              </div>
            </div>

            <div className="booking-actions">
              <button
                className="btn btn-secondary"
                onClick={handleModalClose}
                disabled={bookingInProgress}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBookSession}
                disabled={selectedTimeIndex === null || !selectedCourse || bookingInProgress}
              >
                {bookingInProgress ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </>
  );
}

export default StudyTimeBooking;
