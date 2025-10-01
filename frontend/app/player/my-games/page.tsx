'use client';

import { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '@/utils/api';
import { User, Tournament } from '@/types/api';
import Topbar from '@/Component/topbar';
import './my-games.css';

export default function MyGames() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUserProfileAndTournaments();
  }, []);

  const fetchUserProfileAndTournaments = async () => {
    try {
      setLoading(true);
      
      // First, fetch user profile to get userId
      const userResponse = await makeAuthenticatedRequest<User>('/api/users/profile');
      
      if (userResponse.error) {
        setError(userResponse.error);
        return;
      }
      
      if (!userResponse.data) {
        setError('Failed to fetch user profile');
        return;
      }

      setUser(userResponse.data);
      
      // Then fetch tournaments for this user
      const tournamentsResponse = await makeAuthenticatedRequest<Tournament[]>(
        `/api/tournaments/user/${userResponse.data.userId}`
      );
      
      if (tournamentsResponse.error) {
        setError(tournamentsResponse.error);
        return;
      }
      
      setTournaments(tournamentsResponse.data || []);
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTournamentStatus = (tournament: Tournament): { status: 'upcoming' | 'ongoing' | 'completed', label: string } => {
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    
    if (now < startDate) {
      return { status: 'upcoming', label: 'Upcoming' };
    } else if (now > endDate) {
      return { status: 'completed', label: 'Completed' };
    } else {
      return { status: 'ongoing', label: 'Ongoing' };
    }
  };

  if (loading) {
    return (
      <div className="my-games-container">
        <Topbar />
        <div className="my-games-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your tournaments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-games-container">
        <Topbar />
        <div className="my-games-content">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchUserProfileAndTournaments} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-games-container">
      <Topbar />
      <div className="my-games-content">
        <div className="my-games-header">
          <h1>My Tournaments</h1>
          <p>Welcome back, {user?.name}! Here are your tournament participations.</p>
        </div>

        {tournaments.length === 0 ? (
          <div className="no-tournaments">
            <div className="no-tournaments-icon">🏆</div>
            <h2>No Tournaments Yet</h2>
            <p>You haven&apos;t joined any tournaments yet. Check with your team captain or admin to get started!</p>
          </div>
        ) : (
          <div className="tournaments-grid">
            {tournaments.map((tournament) => {
              const { status, label } = getTournamentStatus(tournament);
              
              return (
                <div key={tournament.tournamentId} className={`tournament-card ${status}`}>
                  <div className="tournament-card-header">
                    <h3 className="tournament-name">{tournament.name}</h3>
                    <span className={`tournament-status status-${status}`}>
                      {label}
                    </span>
                  </div>
                  
                  <div className="tournament-info">
                    <div className="info-row">
                      <span className="info-label">Sport:</span>
                      <span className="info-value">{tournament.sportName}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">Duration:</span>
                      <span className="info-value">
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">Organized by:</span>
                      <span className="info-value">{tournament.createdByName}</span>
                    </div>
                  </div>

                  {tournament.championId && tournament.runnerUpId && (
                    <div className="tournament-results">
                      <h4>Results:</h4>
                      <div className="results-row">
                        <div className="champion">
                          🥇 {tournament.championName}
                        </div>
                        <div className="runner-up">
                          🥈 {tournament.runnerUpName}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="tournament-card-footer">
                    <button className="view-details-btn">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
