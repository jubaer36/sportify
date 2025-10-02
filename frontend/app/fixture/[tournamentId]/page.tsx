'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Topbar from '@/Component/topbar';
import { makeAuthenticatedRequest } from '@/utils/api';
import './fixture.css';

interface Match {
  matchId?: number;
  tournamentId: number;
  tournamentName: string;
  sportId: number;
  sportName: string;
  team1Id: number;
  team1Name: string;
  team2Id: number | null;
  team2Name: string;
  scheduledTime?: string;
  venue?: string;
  status: string;
  winnerTeamId?: number;
  winnerTeamName?: string;
  roundId?: number;
  roundName: string;
  roundValue: number;
}

interface RoundFixture {
  roundId?: number;
  roundValue: number;
  roundName: string;
  type: 'ROUND_ROBIN' | 'KNOCKOUT' | null;
  matches: Match[];
}

interface Fixture {
  tournamentId: number;
  tournamentName: string;
  sportName: string;
  rounds: RoundFixture[];
}

export default function FixtureViewPage() {
  const params = useParams();
  const tournamentId = parseInt(params.tournamentId as string);

  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      fetchFixture();
    }
  }, [tournamentId]);

  const fetchFixture = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${tournamentId}/fixture/existing`);
      if (response.error) {
        setError(response.error);
      } else {
        setFixture(response.data!);
      }
    } catch (err) {
      setError('Failed to load fixture');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return 'Not Scheduled';
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'IN_PROGRESS': return 'in-progress';
      case 'SCHEDULED': return 'scheduled';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="fixture-bg">
        <Topbar />
        <div className="fixture-content">
          <div className="loading-message">Loading fixture...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixture-bg">
        <Topbar />
        <div className="fixture-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="fixture-bg">
        <Topbar />
        <div className="fixture-content">
          <div className="no-fixture-message">No fixture available for this tournament.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixture-bg">
      <Topbar />

      <div className="fixture-content">
        <h1 className="fixture-title">
          {fixture.tournamentName} - {fixture.sportName} Fixture
        </h1>

        <div className="fixture-container">
          {fixture.rounds.map((round, roundIndex) => (
            <div key={round.roundId || roundIndex} className="round-section">
              <h2 className="round-title">
                {round.roundName} ({round.type})
              </h2>

              <div className="matches-grid">
                {round.matches.map((match, matchIndex) => (
                  <div key={match.matchId || matchIndex} className="match-card">
                    <div className="match-header">
                      <span className={`match-status ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </div>

                    <div className="match-teams">
                      <div className="team">
                        <span className="team-name">{match.team1Name}</span>
                        {match.status === 'COMPLETED' && match.winnerTeamId === match.team1Id && (
                          <span className="winner-badge">Winner</span>
                        )}
                      </div>

                      <div className="vs">VS</div>

                      <div className="team">
                        <span className="team-name">{match.team2Name}</span>
                        {match.status === 'COMPLETED' && match.winnerTeamId === match.team2Id && (
                          <span className="winner-badge">Winner</span>
                        )}
                      </div>
                    </div>

                    <div className="match-details">
                      {match.scheduledTime && (
                        <div className="detail-row">
                          <span className="label">Scheduled:</span>
                          <span className="value">{formatDateTime(match.scheduledTime)}</span>
                        </div>
                      )}

                      {match.venue && (
                        <div className="detail-row">
                          <span className="label">Venue:</span>
                          <span className="value">{match.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}