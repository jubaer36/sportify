'use client';

import React, { useState, useEffect } from 'react';
import './create-tournaments.css';

// Interfaces
interface Sport {
  sportId: number;
  name: string;
}

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface TournamentFormData {
  name: string;
  sportId: number | null;
  startDate: string;
  endDate: string;
  createdById: number | null;
  championId: null;
  runnerUpId: null;
}

interface ApiResponse {
  tournamentId: number;
  name: string;
  sportId: number;
  sportName: string;
  startDate: string;
  endDate: string;
  createdById: number;
  createdByName: string;
}

const CreateTournaments: React.FC = () => {
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    sportId: null,
    startDate: '',
    endDate: '',
    createdById: null,
    championId: null,
    runnerUpId: null
  });

  const [sports, setSports] = useState<Sport[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get JWT token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please login.' });
        return;
      }

      const response = await fetch('http://localhost:8090/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData: UserProfile = await response.json();
        setUserProfile(userData);
        setFormData(prev => ({ ...prev, createdById: userData.userId }));
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch user profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching user profile' });
    }
  };

  // Fetch sports for captain
  const fetchSports = async () => {
    try {
      const token = getAuthToken();
      if (!token || !userProfile?.userId) return;

      const response = await fetch(`http://localhost:8090/api/sports/captain/${userProfile.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const sportsData: Sport[] = await response.json();
        setSports(sportsData);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch sports data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching sports data' });
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sportId' ? (value ? parseInt(value) : null) : value
    }));
  };

  // Submit tournament creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sportId || !formData.startDate || !formData.endDate) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setMessage({ type: 'error', text: 'End date must be after start date' });
      return;
    }

    setSubmitLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        setSubmitLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8090/api/tournaments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result: ApiResponse = await response.json();
        setMessage({ type: 'success', text: `Tournament "${result.name}" created successfully!` });
        
        // Reset form
        setFormData({
          name: '',
          sportId: null,
          startDate: '',
          endDate: '',
          createdById: userProfile?.userId || null,
          championId: null,
          runnerUpId: null
        });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to create tournament' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating tournament. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    setLoading(true);
    fetchUserProfile().finally(() => setLoading(false));
  }, []);

  // Fetch sports when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      fetchSports();
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="create-tournaments-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-tournaments-container">
      <div className="create-tournaments-content">
        <div className="tournaments-header">
          <h1 className="tournaments-title">Create New Tournament</h1>
          <p className="tournaments-subtitle">Set up an exciting competition for your sport</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            <i className={`icon ${message.type === 'success' ? 'success-icon' : 'error-icon'}`}>
              {message.type === 'success' ? '✓' : '⚠'}
            </i>
            {message.text}
          </div>
        )}

        <form className="tournament-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Tournament Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter tournament name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sportId" className="form-label">Sport *</label>
              <select
                id="sportId"
                name="sportId"
                value={formData.sportId || ''}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select a sport</option>
                {sports.map(sport => (
                  <option key={sport.sportId} value={sport.sportId}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startDate" className="form-label">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="form-label">End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <div className="button-spinner"></div>
                  Creating Tournament...
                </>
              ) : (
                <>
                  <i className="create-icon">🏆</i>
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>

        {userProfile && (
          <div className="user-info">
            <p>Creating as: <strong>{userProfile.name}</strong> ({userProfile.role})</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTournaments;
