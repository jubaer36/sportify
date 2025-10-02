'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./edit-tournament.css";

interface Tournament {
  tournamentId: number;
  name: string;
  startDate: string;
  endDate?: string;
  championId?: number;
  championName?: string;
  runnerUpId?: number;
  runnerUpName?: string;
  sportId: number;
  sportName?: string;
  createdById?: number;
  createdByName?: string;
}

interface Sport {
  sportId: number;
  name: string;
  isTeamGame: boolean;
}

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export default function EditTournament() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sportId: 0,
    startDate: '',
    endDate: ''
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await makeAuthenticatedRequest<UserProfile>('/api/users/profile');
        if (response.error) {
          setError(response.error);
          return;
        }
        setUserProfile(response.data!);
      } catch (err) {
        setError('Failed to fetch user profile');
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch tournament details and sports
  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);
        
        // Fetch tournament details
        const tournamentResponse = await makeAuthenticatedRequest<Tournament>(`/api/tournaments/${tournamentId}`);
        if (tournamentResponse.error) {
          setError(tournamentResponse.error);
          return;
        }

        const tournamentData = tournamentResponse.data!;
        
        // Check if current user is the creator or an admin
        if (userProfile.role !== 'ADMIN' && tournamentData.createdById !== userProfile.userId) {
          setError('You are not authorized to edit this tournament');
          return;
        }

        setTournament(tournamentData);
        setFormData({
          name: tournamentData.name,
          sportId: tournamentData.sportId,
          startDate: tournamentData.startDate,
          endDate: tournamentData.endDate || ''
        });

        // Fetch sports for captain
        let sportsResponse;
        if (userProfile.role === 'ADMIN') {
          // Admin can see all sports
          sportsResponse = await makeAuthenticatedRequest<Sport[]>('/api/sports');
        } else {
          // Captain can only see their assigned sports
          sportsResponse = await makeAuthenticatedRequest<Sport[]>(`/api/sports/captain/${userProfile.userId}`);
        }

        if (sportsResponse.error) {
          setError(sportsResponse.error);
          return;
        }

        setSports(sportsResponse.data || []);
      } catch (err) {
        setError('Failed to fetch tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournamentId, userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sportId' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !userProfile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updateData = {
        ...tournament,
        name: formData.name,
        sportId: formData.sportId,
        startDate: formData.startDate,
        endDate: formData.endDate || null
      };

      const response = await makeAuthenticatedRequest(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccessMessage('Tournament updated successfully!');
      
      // Redirect back to tournaments page after a short delay
      setTimeout(() => {
        router.push('/tournaments');
      }, 2000);

    } catch (err) {
      setError('Failed to update tournament');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/tournaments');
  };

  if (loading) {
    return (
      <div className="edit-tournament-bg">
        <Topbar />
        <div className="edit-tournament-content">
          <div className="loading-message">Loading tournament...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-tournament-bg">
        <Topbar />
        <div className="edit-tournament-content">
          <div className="error-message">{error}</div>
          <button onClick={handleCancel} className="cancel-btn">
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="edit-tournament-bg">
        <Topbar />
        <div className="edit-tournament-content">
          <div className="error-message">Tournament not found</div>
          <button onClick={handleCancel} className="cancel-btn">
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-tournament-bg">
      <Topbar />
      <div className="edit-tournament-content">
        <div className="edit-tournament-header">
          <h1 className="edit-tournament-title">Edit Tournament</h1>
          <p className="edit-tournament-subtitle">Update tournament details</p>
        </div>

        {successMessage && (
          <div className="success-message">
            <i className="success-icon">✓</i>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            <i className="error-icon">⚠</i>
            {error}
          </div>
        )}

        <form className="edit-tournament-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Tournament Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter tournament name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sportId">Sport</label>
            <select
              id="sportId"
              name="sportId"
              value={formData.sportId}
              onChange={handleInputChange}
              required
              className="form-select"
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
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date (Optional)</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="form-input"
              min={formData.startDate}
            />
          </div>

          <div className="tournament-info">
            <p><strong>Created by:</strong> {tournament.createdByName || 'Unknown'}</p>
            <p><strong>Current Sport:</strong> {tournament.sportName || 'Unknown'}</p>
            {tournament.championName && (
              <p><strong>Champion:</strong> {tournament.championName}</p>
            )}
            {tournament.runnerUpName && (
              <p><strong>Runner Up:</strong> {tournament.runnerUpName}</p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}