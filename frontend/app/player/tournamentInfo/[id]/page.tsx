'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Topbar from '@/Component/topbar';
import { makeAuthenticatedRequest } from '@/utils/api';
import './tournamentInfo.css';

interface TournamentInfo {
  tournamentId: number;
  name: string;
  sportId: number;
  sportName: string;
  startDate: string;
  endDate: string;
  createdById: number;
  createdByName: string;
  championId: number | null;
  championName: string | null;
  runnerUpId: number | null;
  runnerUpName: string | null;
}

export default function TournamentInfoPage() {
  const params = useParams();
  const id = params.id as string;
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentInfo = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await makeAuthenticatedRequest<TournamentInfo>(`/api/tournaments/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setTournament(response.data!);
        }
      } catch (err) {
        console.error('Failed to fetch tournament information:', err);
        setError('Failed to fetch tournament information');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentInfo();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="tournament-info-page">
        <Topbar />
        <main className="main-content">
          <div className="loading">Loading tournament information...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-info-page">
        <Topbar />
        <main className="main-content">
          <div className="error">Error: {error}</div>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="tournament-info-page">
        <Topbar />
        <main className="main-content">
          <div className="error">Tournament not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="tournament-info-page">
      <Topbar />
      <main className="main-content">
        <div className="tournament-info-container">
          <div className="tournament-header">
            <h1 className="tournament-title">{tournament.name}</h1>
            <div className="tournament-sport">{tournament.sportName}</div>
          </div>

          <div className="tournament-details">
            <div className="detail-section">
              <h2>Tournament Details</h2>
              <div className="detail-grid">
                <div className="detail-item">
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sport:</span>
                  <span className="detail-value">{tournament.sportName} </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{formatDate(tournament.startDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">End Date:</span>
                  <span className="detail-value">{formatDate(tournament.endDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By:</span>
                  <span className="detail-value">{tournament.createdByName} </span>
                </div>
              </div>
            </div>

            <div className="results-section">
              <h2>Tournament Results</h2>
              <div className="results-grid">
                <div className="result-item">
                  <div className="result-label">Champion:</div>
                  <div className="result-value">
                    {tournament.championName ? (
                      <span className="winner">{tournament.championName}</span>
                    ) : (
                      <span className="pending">To be determined</span>
                    )}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-label">Runner-up:</div>
                  <div className="result-value">
                    {tournament.runnerUpName ? (
                      <span className="runner-up">{tournament.runnerUpName}</span>
                    ) : (
                      <span className="pending">To be determined</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}