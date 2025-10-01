'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/Component/topbar';
import { makeAuthenticatedRequest } from '@/utils/api';
import './fixture-generator.css';

interface Tournament {
  tournamentId: number;
  name: string;
  sportName: string;
  startDate: string;
  endDate: string;
}

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

export default function FixtureGenerator() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoundForType, setSelectedRoundForType] = useState<number | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>(['KNOCKOUT', 'ROUND_ROBIN']);
  const router = useRouter();

  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const result = await makeAuthenticatedRequest<Tournament[]>('/api/tournaments');
      if (result.data) {
        setTournaments(result.data);
      } else {
        setError(result.error || 'Failed to fetch tournaments');
      }
    } catch {
      setError('Error fetching tournaments');
    }
  };

  const generateFixture = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      const result = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture`);

      if (result.data) {
        setFixture(result.data);
        // Auto-expand all rounds
        const roundValues = result.data.rounds.map(r => r.roundValue);
        setExpandedRounds(new Set(roundValues));
      } else {
        setError(result.error || 'Failed to generate fixture');
      }
    } catch {
      setError('Error generating fixture');
    } finally {
      setLoading(false);
    }
  };

  const selectRoundType = async (roundId: number, type: 'KNOCKOUT' | 'ROUND_ROBIN') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch(`http://localhost:8090/api/tournaments/rounds/${roundId}/select-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        await generateFixture();
        setSelectedRoundForType(null);
        alert(`Round type selected: ${type}. Matches have been generated!`);
      } else {
        setError('Failed to select round type');
      }
    } catch {
      setError('Error selecting round type');
    } finally {
      setLoading(false);
    }
  };

  const checkRoundComplete = async (roundId: number): Promise<boolean> => {
    try {
      const result = await makeAuthenticatedRequest<boolean>(`/api/tournaments/rounds/${roundId}/is-complete`);
      return result.data || false;
    } catch {
      return false;
    }
  };

  const advanceToNextRound = async (roundId: number, nextType: 'KNOCKOUT' | 'ROUND_ROBIN') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch(`http://localhost:8090/api/tournaments/rounds/${roundId}/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: nextType }),
      });

      if (response.ok) {
        await generateFixture();
        alert(`Advanced to next round with type: ${nextType}`);
      } else {
        setError('Failed to advance to next round. Make sure current round is complete.');
      }
    } catch {
      setError('Error advancing to next round');
    } finally {
      setLoading(false);
    }
  };

  const toggleRound = (roundValue: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundValue)) {
      newExpanded.delete(roundValue);
    } else {
      newExpanded.add(roundValue);
    }
    setExpandedRounds(newExpanded);
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ONGOING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoundTypeColor = (type: string | null) => {
    if (type === 'KNOCKOUT') return 'bg-blue-100 text-blue-800';
    if (type === 'ROUND_ROBIN') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Fixture Generator</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Tournament Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Tournament</h2>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament
                </label>
                <select
                  value={selectedTournament?.tournamentId || ''}
                  onChange={(e) => {
                    const tournament = tournaments.find(t => t.tournamentId === parseInt(e.target.value));
                    setSelectedTournament(tournament || null);
                    setFixture(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a tournament...</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.tournamentId} value={tournament.tournamentId}>
                      {tournament.name} - {tournament.sportName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={generateFixture}
                disabled={!selectedTournament || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Fixture'}
              </button>
            </div>
          </div>

          {/* Fixture Display */}
          {fixture && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{fixture.tournamentName}</h2>
                <p className="text-gray-600 mb-4">Sport: {fixture.sportName}</p>
                <p className="text-sm text-gray-500">
                  Total Rounds: {fixture.rounds.length} | 
                  Matches Generated: {fixture.rounds.reduce((sum, r) => sum + r.matches.length, 0)}
                </p>
              </div>

              {/* Rounds Display */}
              {fixture.rounds.map((round) => (
                <div key={round.roundValue} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Round Header */}
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all"
                    onClick={() => toggleRound(round.roundValue)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-white">{round.roundName}</h3>
                        {round.type && (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoundTypeColor(round.type)}`}>
                            {round.type.replace('_', ' ')}
                          </span>
                        )}
                        {!round.type && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                            Type Not Selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white text-sm">
                          {round.matches.length} {round.matches.length === 1 ? 'Match' : 'Matches'}
                        </span>
                        <svg 
                          className={`w-6 h-6 text-white transition-transform ${expandedRounds.has(round.roundValue) ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Round Content */}
                  {expandedRounds.has(round.roundValue) && (
                    <div className="p-6">
                      {/* Type Selection */}
                      {!round.type && round.roundId && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-3">Select Tournament Type</h4>
                          <div className="flex gap-4">
                            <button
                              onClick={() => selectRoundType(round.roundId!, 'KNOCKOUT')}
                              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              🏆 Knockout
                              <span className="block text-xs mt-1">Single elimination format</span>
                            </button>
                            <button
                              onClick={() => selectRoundType(round.roundId!, 'ROUND_ROBIN')}
                              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                              🔄 Round Robin
                              <span className="block text-xs mt-1">Everyone plays everyone</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Matches Display */}
                      {round.matches.length > 0 ? (
                        <div className="fixture-grid">
                          {round.matches.map((match, index) => (
                            <div key={index} className="match-card">
                              <div className="match-header">
                                <span className="match-number">Match #{index + 1}</span>
                                <span className={`match-status ${getMatchStatusColor(match.status)}`}>
                                  {match.status}
                                </span>
                              </div>
                              <div className="match-body">
                                <div className="team-row">
                                  <div className="team-info">
                                    <span className="team-name">{match.team1Name}</span>
                                  </div>
                                  {match.winnerTeamId === match.team1Id && (
                                    <span className="winner-badge">👑</span>
                                  )}
                                </div>
                                <div className="vs-divider">VS</div>
                                <div className="team-row">
                                  <div className="team-info">
                                    <span className="team-name">
                                      {match.team2Name === 'BYE' ? (
                                        <span className="text-gray-400 italic">BYE (Auto-advance)</span>
                                      ) : (
                                        match.team2Name
                                      )}
                                    </span>
                                  </div>
                                  {match.winnerTeamId === match.team2Id && (
                                    <span className="winner-badge">👑</span>
                                  )}
                                </div>
                              </div>
                              {match.venue && (
                                <div className="match-footer">
                                  📍 {match.venue}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-lg">No matches available yet</p>
                          <p className="text-sm mt-2">
                            {!round.type 
                              ? 'Select a tournament type to generate matches'
                              : 'Waiting for previous round to complete'}
                          </p>
                        </div>
                      )}

                      {/* Advance Button */}
                      {round.type && round.roundId && round.roundValue > 1 && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-3">Advance to Next Round</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Once all matches are complete, select the type for the next round:
                          </p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => advanceToNextRound(round.roundId!, 'KNOCKOUT')}
                              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Next: Knockout
                            </button>
                            <button
                              onClick={() => advanceToNextRound(round.roundId!, 'ROUND_ROBIN')}
                              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                              Next: Round Robin
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}