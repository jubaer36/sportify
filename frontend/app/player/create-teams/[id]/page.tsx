'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import './create-teams.css';
import { makeAuthenticatedRequest } from '../../../../utils/api';

interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
}

interface Tournament {
  id: number;
  name: string;
  sportId: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface TeamRequest {
  teamName: string;
  sportId: number;
  createdById: number;
  logo: string;
  tournamentId: number;
}

const CreateTeamPage = () => {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch user profile and tournament info on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        
        // Fetch user profile
        const userResponse = await makeAuthenticatedRequest<User>('/api/users/profile');
        if (userResponse.error) {
          setError('Failed to fetch user profile: ' + userResponse.error);
          return;
        }
        setUser(userResponse.data!);

        // Fetch tournament info
        const tournamentResponse = await makeAuthenticatedRequest<Tournament>(`/api/tournaments/${tournamentId}`);
        if (tournamentResponse.error) {
          setError('Failed to fetch tournament info: ' + tournamentResponse.error);
          return;
        }
        setTournament(tournamentResponse.data!);
        
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error('Error fetching initial data:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [tournamentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (!user || !tournament) {
      setError('Required data not loaded');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const teamRequest: TeamRequest = {
        teamName: teamName.trim(),
        sportId: tournament.sportId,
        createdById: user.userId,
        logo: '/Photos/dream_team_logo.png',
        tournamentId: parseInt(tournamentId)
      };
      const response = await makeAuthenticatedRequest('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamRequest)
      });

      if (response.error) {
        setError('Failed to create team: ' + response.error);
      } else {
        setSuccess('Team created successfully!');
        setTeamName('');
        
        // Redirect to teams list or dashboard after a short delay
        setTimeout(() => {
          router.push('/player/my-teams');
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred while creating the team');
      console.error('Error creating team:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="create-team-container">
        <div className="loading-message">Loading tournament information...</div>
      </div>
    );
  }

  if (!user || !tournament) {
    return (
      <div className="create-team-container">
        <div className="error-message">
          Failed to load required data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="create-team-container">
      <div className="create-team-card">
        <h1 className="page-title">Create Team</h1>
        
        <div className="tournament-info">
          <h3>Tournament: {tournament.name}</h3>
        </div>

        <form onSubmit={handleSubmit} className="create-team-form">
          <div className="form-group">
            <label htmlFor="teamName" className="form-label">
              Team Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="form-input"
              placeholder="Enter your team name"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Team Logo</label>
            <div className="logo-info">
              <Image 
                src="/Photos/dream_team_logo.png" 
                alt="Default Team Logo" 
                className="logo-preview"
                width={64}
                height={64}
              />
              <p className="logo-text">Default logo will be used</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !teamName.trim()}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;
