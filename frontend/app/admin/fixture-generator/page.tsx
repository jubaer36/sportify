'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/Component/topbar';
import { makeAuthenticatedRequest } from '@/utils/api';

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
  team2Id: number;
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

interface RoundConfig {
  roundValue: number;
  type: 'ROUND_ROBIN' | 'KNOCKOUT';
}

interface RoundFixture {
  roundId?: number;
  roundValue: number;
  roundName: string;
  type: 'ROUND_ROBIN' | 'KNOCKOUT';
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
  const [roundConfigs, setRoundConfigs] = useState<RoundConfig[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const addRoundConfig = () => {
    const nextRoundValue = roundConfigs.length + 1;
    setRoundConfigs([...roundConfigs, { roundValue: nextRoundValue, type: 'KNOCKOUT' }]);
  };

  const updateRoundConfig = (roundValue: number, type: 'ROUND_ROBIN' | 'KNOCKOUT') => {
    setRoundConfigs(roundConfigs.map(config =>
      config.roundValue === roundValue ? { ...config, type } : config
    ));
  };

  const removeRoundConfig = (roundValue: number) => {
    setRoundConfigs(roundConfigs.filter(config => config.roundValue !== roundValue));
  };

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
      let result;
      if (roundConfigs.length > 0) {
        // Use custom round configurations
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please login again.');
          return;
        }

        const response = await fetch(`http://localhost:8090/api/tournaments/${selectedTournament.tournamentId}/fixture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(roundConfigs),
        });

        if (response.ok) {
          result = { data: await response.json() };
        } else {
          result = { error: 'Failed to generate fixture' };
        }
      } else {
        // Use default generation
        result = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture`);
      }

      if (result.data) {
        setFixture(result.data);
      } else {
        setError(result.error || 'Failed to generate fixture');
      }
    } catch {
      setError('Error generating fixture');
    } finally {
      setLoading(false);
    }
  };

  const saveFixture = async () => {
    if (!fixture) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Save rounds and matches to database
      for (const round of fixture.rounds) {
        // First save the round
        const roundResponse = await fetch('http://localhost:8090/api/rounds', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tournamentId: fixture.tournamentId,
            roundValue: round.roundValue,
            type: round.type
          }),
        });

        if (roundResponse.ok) {
          const savedRound = await roundResponse.json();

          // Then save matches for this round
          for (const match of round.matches) {
            await fetch('http://localhost:8090/api/matches', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                tournamentId: fixture.tournamentId,
                sportId: match.sportId,
                team1Id: match.team1Id,
                team2Id: match.team2Id,
                roundId: savedRound.roundId,
                status: match.status
              }),
            });
          }
        }
      }

      alert('Fixture saved successfully!');
      router.push('/admin/dashboard');
    } catch {
      setError('Error saving fixture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
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
                      // Reset round configs when tournament changes
                      setRoundConfigs([]);
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
              </div>
            </div>

            {/* Round Configuration */}
            {selectedTournament && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Configure Rounds</h2>
                <div className="space-y-4">
                  {roundConfigs.map((config, index) => (
                    <div key={config.roundValue} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">Round {config.roundValue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`round-${config.roundValue}`}
                            value="KNOCKOUT"
                            checked={config.type === 'KNOCKOUT'}
                            onChange={() => updateRoundConfig(config.roundValue, 'KNOCKOUT')}
                            className="mr-2"
                          />
                          Knockout
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`round-${config.roundValue}`}
                            value="ROUND_ROBIN"
                            checked={config.type === 'ROUND_ROBIN'}
                            onChange={() => updateRoundConfig(config.roundValue, 'ROUND_ROBIN')}
                            className="mr-2"
                          />
                          Round Robin
                        </label>
                      </div>
                      <button
                        onClick={() => removeRoundConfig(config.roundValue)}
                        className="px-3 py-1 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addRoundConfig}
                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
                  >
                    + Add Round
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={generateFixture}
                disabled={!selectedTournament || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Fixture'}
              </button>
            </div>

            {/* Fixture Display */}
            {fixture && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{fixture.tournamentName}</h2>
                <p>Fixture generated successfully!</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}