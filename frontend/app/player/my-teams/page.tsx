'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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

interface Tournament {
  tournamentId: number;
  name: string;
  sportId: number;
  sportName: string;
  type?: string;
  startDate: string;
  endDate: string;
  createdById: number;
  createdByName: string;
  championId?: number;
  championName?: string;
  runnerUpId?: number;
  runnerUpName?: string;
}

interface Team {
  teamId: number;
  teamName: string;
  sportId: number;
  sportName: string;
  createdById: number;
  createdByName: string;
  logo: string;
  tournamentId?: number;
  tournament?: Tournament | null;
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

  const fetchTournamentData = async (tournamentId: number): Promise<Tournament | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`http://localhost:8090/api/tournaments/${tournamentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch tournament ${tournamentId}`);
        return null;
      }

      return await response.json();
    } catch (err) {
      console.warn(`Error fetching tournament ${tournamentId}:`, err);
      return null;
    }
  };

  const fetchUserTeams = useCallback(async (userId: number) => {
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
      
      // Fetch tournament data for each team that has a tournamentId
      const teamsWithTournaments = await Promise.all(
        teamData.teams.map(async (team) => {
          if (team.tournamentId) {
            const tournament = await fetchTournamentData(team.tournamentId);
            return { ...team, tournament };
          }
          return team;
        })
      );
      
      setTeams(teamsWithTournaments);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
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
  }, [fetchUserTeams]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

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
            <div className="no-teams-icon">🏆</div>
            <h3>No Teams Found</h3>
            <p>You are not currently a member of any teams. Join a team to start your sporting journey!</p>
          </div>
        ) : (
          <div className="teams-container">
            <div className="teams-header">
              <h2>Your Teams ({teams.length})</h2>
              <p>Teams you&apos;re currently participating in</p>
            </div>
            <div className="teams-grid">
              {teams.map((team) => (
                <div key={team.teamId} className="team-card">
                  <div className="team-card-header">
                    <div className="team-logo">
                      {team.logo ? (
                        <Image 
                          src={`/images/${team.logo}`} 
                          alt={team.teamName}
                          width={60}
                          height={60}
                          className="logo-image"
                        />
                      ) : (
                        <div className="default-logo">
                          {team.teamName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="team-basic-info">
                      <h3 className="team-name">{team.teamName}</h3>
                      <div className="sport-badge">
                        <span className="sport-icon">⚽</span>
                        <span>{team.sportName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="team-details">
                    <div className="detail-row">
                      <span className="detail-label">Created by:</span>
                      <span className="detail-value">{team.createdByName}</span>
                    </div>
                    
                    {team.tournament ? (
                      <div className="tournament-section">
                        <h4 className="tournament-title">
                          <span className="tournament-icon">🏆</span>
                          Tournament Details
                        </h4>
                        <div className="tournament-info">
                          <div className="detail-row">
                            <span className="detail-label">Tournament:</span>
                            <span className="detail-value tournament-name">{team.tournament.name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">
                              {new Date(team.tournament.startDate).toLocaleDateString()} - {new Date(team.tournament.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Organized by:</span>
                            <span className="detail-value">{team.tournament.createdByName}</span>
                          </div>
                          
                          {team.tournament.championName && team.tournament.runnerUpName && (
                            <div className="tournament-results">
                              <div className="results-title">Tournament Results:</div>
                              <div className="results-info">
                                <div className="champion">
                                  <span className="medal">🥇</span>
                                  <span>{team.tournament.championName}</span>
                                </div>
                                <div className="runner-up">
                                  <span className="medal">🥈</span>
                                  <span>{team.tournament.runnerUpName}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="no-tournament">
                        <span className="no-tournament-icon">📅</span>
                        <span>No active tournament</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="team-card-footer">
                    <div className="status-indicator">
                      <span className={`status-dot ${team.tournament ? 'active' : 'inactive'}`}></span>
                      <span className="status-text">
                        {team.tournament ? 'Active in Tournament' : 'Available for Tournament'}
                      </span>
                    </div>
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