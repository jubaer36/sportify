'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/Component/topbar';
import { makeAuthenticatedRequest } from '@/utils/api';
import './fixture.css';

interface Team {
  teamId: number;
  teamName: string;
}

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

export default function FixtureViewer() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showFixture, setShowFixture] = useState(false);
  const [fixtureExists, setFixtureExists] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'KNOCKOUT' | 'ROUND_ROBIN'>('KNOCKOUT');
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTeams(selectedTournament.tournamentId);
      checkFixtureExists(selectedTournament.tournamentId);
      // Reset fixture display when tournament changes
      setFixture(null);
      setShowFixture(false);
    } else {
      setTeams([]);
      setFixture(null);
      setShowFixture(false);
      setFixtureExists(false);
    }
  }, [selectedTournament]);

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

  const fetchTeams = async (tournamentId: number) => {
    try {
      const result = await makeAuthenticatedRequest<Team[]>(`/api/teams/tournament/${tournamentId}`);
      if (result.data) {
        setTeams(result.data);
      }
    } catch {
      // best-effort; do not block UI
    }
  };

  const checkFixtureExists = async (tournamentId: number) => {
    try {
      const result = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${tournamentId}/fixture/existing`);
      setFixtureExists(!!(result.data && result.data.rounds && result.data.rounds.length > 0));
    } catch {
      setFixtureExists(false);
    }
  };

  const loadFixture = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      // Try to get existing fixture first
      const existingResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture/existing`);
      
      if (existingResult.data && existingResult.data.rounds && existingResult.data.rounds.length > 0) {
        // Filter to show only the first round (highest round value)
        const rounds = existingResult.data.rounds;
        const firstRound = rounds.find(round => 
          round.roundValue === Math.max(...rounds.map(r => r.roundValue))
        );
        if (firstRound) {
          const filteredFixture = {
            ...existingResult.data,
            rounds: [firstRound]
          };
          setFixture(filteredFixture);
          setShowFixture(true);
        }
      } else {
        // Generate new fixture if none exists
        const generateResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture`);
        
        if (generateResult.data && generateResult.data.rounds && generateResult.data.rounds.length > 0) {
          // Filter to show only the first round (highest round value)
          const rounds = generateResult.data.rounds;
          const firstRound = rounds.find(round => 
            round.roundValue === Math.max(...rounds.map(r => r.roundValue))
          );
          if (firstRound) {
            const filteredFixture = {
              ...generateResult.data,
              rounds: [firstRound]
            };
            setFixture(filteredFixture);
            setShowFixture(true);
          }
        } else {
          setError(generateResult.error || 'Failed to load fixture');
        }
      }
    } catch {
      setError('Error loading fixture');
    } finally {
      setLoading(false);
    }
  };

  const generateFixture = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      // First generate the fixture structure
      const structureResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture`);
      
      if (structureResult.data && structureResult.data.rounds && structureResult.data.rounds.length > 0) {
        // Get the first round (highest round value)
        const rounds = structureResult.data.rounds;
        const firstRound = rounds.find(round => 
          round.roundValue === Math.max(...rounds.map(r => r.roundValue))
        );
        
        if (firstRound && firstRound.roundId) {
          // Select the type for the first round and generate matches
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8090/api/tournaments/rounds/${firstRound.roundId}/select-type`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ type: selectedType }),
          });

          if (response.ok) {
            // Small delay to ensure database operations complete
            await new Promise(resolve => setTimeout(resolve, 500));
            // Reload the fixture to get the generated matches
            await loadFixture();
            setFixtureExists(true);
            setShowGenerateModal(false);
            alert(`Fixture generated successfully with ${selectedType} format!`);
          } else {
            throw new Error('Failed to generate matches');
          }
        }
      } else {
        throw new Error('Failed to create fixture structure');
      }
    } catch (error) {
      setError('Error generating fixture');
      console.error('Generate fixture error:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateFixture = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      // Get the existing fixture to find the round ID
      const existingResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture/existing`);
      
      if (existingResult.data && existingResult.data.rounds && existingResult.data.rounds.length > 0) {
        const rounds = existingResult.data.rounds;
        const firstRound = rounds.find(round => 
          round.roundValue === Math.max(...rounds.map(r => r.roundValue))
        );
        
        if (firstRound && firstRound.roundId) {
          // Delete existing matches and regenerate with new type
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8090/api/tournaments/rounds/${firstRound.roundId}/select-type`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ type: selectedType }),
          });

          if (response.ok) {
            // Small delay to ensure database operations complete
            await new Promise(resolve => setTimeout(resolve, 500));
            // Reload the fixture to get the regenerated matches
            await loadFixture();
            setShowRegenerateModal(false);
            alert(`Fixture regenerated successfully with ${selectedType} format!`);
          } else {
            throw new Error('Failed to regenerate matches');
          }
        }
      }
    } catch (error) {
      setError('Error regenerating fixture');
      console.error('Regenerate fixture error:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Tournament Fixtures</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Tournament Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Tournament</h2>
            <div className="space-y-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament
                </label>
                <select
                  value={selectedTournament?.tournamentId || ''}
                  onChange={(e) => {
                    const tournament = tournaments.find(t => t.tournamentId === parseInt(e.target.value));
                    setSelectedTournament(tournament || null);
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

              {/* Show teams when tournament is selected */}
              {selectedTournament && teams.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Registered Teams ({teams.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {teams.map((team) => (
                      <div
                        key={team.teamId}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex items-center gap-2"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="font-medium text-gray-800">{team.teamName}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    {!fixtureExists ? (
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {loading ? 'Loading...' : 'Generate Fixture'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={loadFixture}
                          disabled={loading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                          {loading ? 'Loading...' : 'Show Fixture'}
                        </button>
                        <button
                          onClick={() => setShowRegenerateModal(true)}
                          disabled={loading}
                          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                          Regenerate Fixture
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedTournament && teams.length === 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 font-medium">No teams registered yet</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Teams must be registered before viewing fixtures.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fixture Display - Only First Round */}
          {showFixture && fixture && fixture.rounds.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{fixture.tournamentName}</h2>
                <p className="text-gray-600 mb-4">Sport: {fixture.sportName}</p>
              </div>

              {/* First Round Display */}
              {fixture.rounds.map((round, index) => (
                <div key={round.roundId || `round-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Round Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
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
                      </div>
                    </div>
                  </div>

                  {/* Round Content */}
                  <div className="p-6">
                    {/* Matches Display */}
                    {round.matches.length > 0 ? (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Matches</h4>
                        <div className="space-y-2">
                          {round.matches.map((match, matchIndex) => (
                            <div 
                              key={match.matchId || `match-${round.roundId}-${matchIndex}`} 
                              className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 font-medium min-w-[60px]">
                                  Match {matchIndex + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-900">{match.team1Name}</span>
                                  <span className="text-gray-500 font-medium">vs</span>
                                  <span className="font-semibold text-gray-900">
                                    {match.team2Name === 'BYE' ? 'BYE (Auto-advance)' : match.team2Name}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getMatchStatusColor(match.status)}`}>
                                {match.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">No matches available yet</p>
                        <p className="text-sm mt-2">
                          {!round.type 
                            ? 'Tournament type needs to be selected to generate matches'
                            : 'Matches will appear here once generated'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Fixture State */}
          {!showFixture && selectedTournament && teams.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">
                {fixtureExists ? 'Click "Show Fixture" to view the tournament fixture' : 'Click "Generate Fixture" to create the tournament fixture'}
              </p>
            </div>
          )}

          {/* Generate Fixture Modal */}
          {showGenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Fixture</h3>
                <p className="text-gray-600 mb-4">
                  Select the tournament type for the first round:
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateFixture}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regenerate Fixture Modal */}
          {showRegenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Regenerate Fixture</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800 text-sm font-medium">Warning</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    This will delete the existing fixture and generate a new one. This action cannot be undone.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Tournament Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRegenerateModal(false)}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={regenerateFixture}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {loading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}