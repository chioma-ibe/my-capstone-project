import { useState, useEffect } from 'react';
import studyPreferencesClient from '../services/studyPreferencesClient';
import '../styles/components/StudyPreferences.css';

const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

function StudyPreferences({ userId }) {
  const [preferences, setPreferences] = useState({
    preferredDays: [],
    preferredTimeRanges: [{ start: '09:00', end: '17:00' }],
    preferBackToBack: false,
    maxSessionsPerWeek: 3,
    sessionDuration: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const data = await studyPreferencesClient.getStudyPreferences(userId);
        if (data) {
          setPreferences({
            preferredDays: data.preferredDays || [],
            preferredTimeRanges: data.preferredTimeRanges || [{ start: '09:00', end: '17:00' }],
            preferBackToBack: data.preferBackToBack || false,
            maxSessionsPerWeek: data.maxSessionsPerWeek || 3,
            sessionDuration: data.sessionDuration || 60
          });
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  const handleDayToggle = (day) => {
    setPreferences(prev => {
      const isSelected = prev.preferredDays.includes(day);
      const updatedDays = isSelected
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day];

      return {
        ...prev,
        preferredDays: updatedDays
      };
    });
  };

  const handleTimeRangeChange = (index, field, value) => {
    setPreferences(prev => {
      const updatedRanges = [...prev.preferredTimeRanges];
      updatedRanges[index] = {
        ...updatedRanges[index],
        [field]: value
      };
      return {
        ...prev,
        preferredTimeRanges: updatedRanges
      };
    });
  };

  const addTimeRange = () => {
    setPreferences(prev => ({
      ...prev,
      preferredTimeRanges: [
        ...prev.preferredTimeRanges,
        { start: '09:00', end: '17:00' }
      ]
    }));
  };

  const removeTimeRange = (index) => {
    setPreferences(prev => ({
      ...prev,
      preferredTimeRanges: prev.preferredTimeRanges.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: field === 'preferBackToBack' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await studyPreferencesClient.saveStudyPreferences(userId, preferences);
      setMessage('Study preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="study-preferences-loading">Loading preferences...</div>;
  }

  return (
    <div className="study-preferences-container">
      <h2>Study Preferences</h2>
      <form onSubmit={handleSubmit}>
        <div className="preference-section">
          <h3>Preferred Days</h3>
          <div className="days-container">
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day}
                className={`day-item ${preferences.preferredDays.includes(day) ? 'selected' : ''}`}
                onClick={() => handleDayToggle(day)}
              >
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="preference-section">
          <h3>Preferred Time Ranges</h3>
          {preferences.preferredTimeRanges.map((range, index) => (
            <div key={index} className="time-range">
              <input
                type="time"
                value={range.start}
                onChange={(e) => handleTimeRangeChange(index, 'start', e.target.value)}
              />
              <span>to</span>
              <input
                type="time"
                value={range.end}
                onChange={(e) => handleTimeRangeChange(index, 'end', e.target.value)}
              />
              {preferences.preferredTimeRanges.length > 1 && (
                <button
                  type="button"
                  className="remove-time-btn"
                  onClick={() => removeTimeRange(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-time-btn"
            onClick={addTimeRange}
          >
            Add Time Range
          </button>
        </div>

        <div className="preference-section">
          <h3>Session Preferences</h3>
          <div className="preference-item">
            <label>
              <input
                type="checkbox"
                checked={preferences.preferBackToBack}
                onChange={(e) => handleInputChange('preferBackToBack', e.target.checked)}
              />
              Prefer back-to-back sessions
            </label>
          </div>

          <div className="preference-item">
            <label>
              Maximum sessions per week:
              <select
                value={preferences.maxSessionsPerWeek}
                onChange={(e) => handleInputChange('maxSessionsPerWeek', e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="preference-item">
            <label>
              Session duration (minutes):
              <select
                value={preferences.sessionDuration}
                onChange={(e) => handleInputChange('sessionDuration', e.target.value)}
              >
                {[30, 45, 60, 90, 120].map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="preferences-actions">
          <button
            type="submit"
            className="save-preferences-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          {message && <div className="preferences-message">{message}</div>}
        </div>
      </form>
    </div>
  );
}

export default StudyPreferences;
