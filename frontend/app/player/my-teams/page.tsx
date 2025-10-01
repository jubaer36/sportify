'use client';

import { useState, useEffect } from 'react';
import Topbar from "@/Component/topbar";
import "./my-teams.css";

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  profilePhoto: string;
}

interface Team {
  teamId: number;
  teamName: string;
  sportId: number;
  sportName: string;
  createdById: number;
  createdByName: string;
  logo: string;
}

interface TeamResponse {
  message: string;
  teams: Team[];
  totalTeams: number;
}

export default function MyTeams() {
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8090/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData: User = await response.json();
      setUser(userData);
      
      // Now fetch teams for this user
      await fetchUserTeams(userData.userId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
      setLoading(false);
    }
  };

  const fetchUserTeams = async (userId: number) => {
    try {
    const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        return;
      }
      const response = await fetch('http://localhost:8090/api/teams/user-teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user teams');
      }

      const teamData: TeamResponse = await response.json();
      setTeams(teamData.teams);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-teams-bg">
        <Topbar />
        <div className="my-teams-content">
          <div className="loading-spinner">Loading your teams...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-teams-bg">
        <Topbar />
        <div className="my-teams-content">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-teams-bg">
      <Topbar />
      <div className="my-teams-content">
        <div className="my-teams-header">
          <h1 className="my-teams-title">My Teams</h1>
          {user && (
            <p className="user-info">Welcome, {user.name}!</p>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="no-teams-message">
            <h3>No Teams Found</h3>
            <p>You are not currently a member of any teams.</p>
          </div>
        ) : (
          <div className="teams-container">
            <div className="teams-header">
              <h2>Your Teams ({teams.length})</h2>
            </div>
            <div className="teams-list">
              {teams.map((team) => (
                <div key={team.teamId} className="team-row">
                  <div className="team-logo">
                    {team.logo ? (
                      <img src={`/images/${team.logo}`} alt={team.teamName} />
                    ) : (
                      <div className="default-logo">
                        {team.teamName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="team-info">
                    <h3 className="team-name">{team.teamName}</h3>
                    <p className="team-sport">{team.sportName}</p>
                    <p className="team-creator">Created by: {team.createdByName}</p>
                  </div>
                  <div className="team-actions">
                    <button className="view-details-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}