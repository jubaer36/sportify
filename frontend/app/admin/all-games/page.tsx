'use client';

import React, { useState, useEffect } from 'react';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./all-games.css";

// Define the interface for the Sport data
interface Sport {
  sportId: number;
  name: string;
  isTeamGame: boolean;
  rules?: string;
  captainId?: number;
  captainName?: string;
  recentChampionId?: number;
  recentChampionName?: string;
  recentRunnerUpId?: number;
  recentRunnerUpName?: string;
}

// Sport-specific logos mapping
const sportLogos: { [key: string]: string } = {
  'Football': '/Photos/football_logo.png',
  'Basketball': '/Photos/basketball_logo.png',
  'Tennis': '/Photos/tennis_logo.png',
  'Volleyball': '/Photos/volleyball_logo.png',
  'Table Tennis': '/Photos/tabletennis_logo.png',
  'Carrom': '/Photos/carrom_logo.png',
  'Scrabble': '/Photos/scrabble_logo.png',
  'Chess': '/Photos/chess_logo.png',
  'Cricket': '/Photos/cricket_logo.png', 
  'Badminton': '/Photos/badminton_logo.png', 
};

export default function AllGames() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      
      const result = await makeAuthenticatedRequest<Sport[]>('/api/sports');
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        setSports(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching sports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sports data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultLogo = (sportName: string): string => {
    // Normalize sport name to handle case variations
    const normalizedSportName = sportName.trim();
    
    // Try exact match first
    if (sportLogos[normalizedSportName]) {
      return sportLogos[normalizedSportName];
    }
    
    // Try case-insensitive match
    const lowerCaseName = normalizedSportName.toLowerCase();
    for (const [key, value] of Object.entries(sportLogos)) {
      if (key.toLowerCase() === lowerCaseName) {
        return value;
      }
    }
    
    // Fallback to generic logo
    return '/Photos/logo1.png';
  };

  if (loading) {
    return (
      <div className="all-games-bg">
        <Topbar />
        <div className="all-games-content">
          <h1 className="all-games-title">All Games</h1>
          <div className="loading-message">Loading sports data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-games-bg">
        <Topbar />
        <div className="all-games-content">
          <h1 className="all-games-title">All Games</h1>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchSports} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-games-bg">
      <Topbar />
      <div className="all-games-content">
        <h1 className="all-games-title">All Games</h1>
        <div className="games-grid">
          {sports.length === 0 ? (
            <div className="no-games-message">
              <p>No games available at the moment.</p>
            </div>
          ) : (
            sports.map((sport) => (
              <div key={sport.sportId} className="game-card">
                <div className="game-logo">
                  <img 
                    src={getDefaultLogo(sport.name)} 
                    alt={`${sport.name}_logo`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/Photos/logo1.png'; // Fallback logo
                    }}
                  />
                </div>
                <div className="game-info">
                  <h3 className="game-name">{sport.name}</h3>
                  <div className="game-details">
                    <p className="captain-info">
                      <span className="label">Captain:</span>
                      <span className="value">
                        {sport.captainName || 'No Captain Assigned'}
                      </span>
                    </p>
                    <p className="champion-info">
                      <span className="label">Recent Champion:</span>
                      <span className="value">
                        {sport.recentChampionName || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}