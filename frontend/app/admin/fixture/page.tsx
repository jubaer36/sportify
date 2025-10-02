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
  const [showSecondRoundModal, setShowSecondRoundModal] = useState(false);
  const [secondRoundType, setSecondRoundType] = useState<'KNOCKOUT' | 'ROUND_ROBIN'>('KNOCKOUT');
  const [secondRoundFixture, setSecondRoundFixture] = useState<RoundFixture | null>(null);
  const [showSecondRound, setShowSecondRound] = useState(false);
  const [showThirdRoundModal, setShowThirdRoundModal] = useState(false);
  const [thirdRoundType, setThirdRoundType] = useState<'KNOCKOUT' | 'ROUND_ROBIN'>('KNOCKOUT');
  const [thirdRoundFixture, setThirdRoundFixture] = useState<RoundFixture | null>(null);
  const [showThirdRound, setShowThirdRound] = useState(false);
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

  const getRound1Winners = () => {
    if (!fixture || !fixture.rounds || fixture.rounds.length === 0) return [];
    const firstRound = fixture.rounds[0];
    
    let winners;
    
    if (firstRound.type === 'KNOCKOUT') {
      // For knockout, get winners from each match
      winners = firstRound.matches.map((match, index) => {
        const placeholderName = `Match${index + 1}Winner`;
        
        return {
          teamId: match.winnerTeamId || -(index + 1),
          teamName: match.status === 'COMPLETED' && match.winnerTeamName 
            ? match.winnerTeamName 
            : placeholderName,
          isActual: match.status === 'COMPLETED' && match.winnerTeamName
        };
      });
    } else {
      // For round robin, get all participating teams but limit to best half
      const allTeams = new Set();
      firstRound.matches.forEach(match => {
        allTeams.add(match.team1Name);
        if (match.team2Name !== 'BYE') {
          allTeams.add(match.team2Name);
        }
      });
      
      const teamArray = Array.from(allTeams);
      const bestHalf = Math.ceil(teamArray.length / 2);
      
      winners = teamArray.slice(0, bestHalf).map((teamName, index) => ({
        teamId: -(index + 1),
        teamName: `Team ${index + 1} Winner Round 1`,
        isActual: false // These are placeholder names for round robin
      }));
    }
    
    return winners;
  };

  const generateSecondRound = () => {
    const winners = getRound1Winners();
    if (winners.length < 2) {
      setError('Need at least 2 winners to generate second round');
      return;
    }
    
    // Use all winners from getRound1Winners (it already handles the halving for Round Robin)
    const selectedWinners = winners;

    // Generate second round name based on number of teams
    let roundName = 'Round 2';
    if (selectedWinners.length === 16) roundName = 'Round of 16';
    else if (selectedWinners.length === 8) roundName = 'Quarter Finals';
    else if (selectedWinners.length === 4) roundName = 'Semi Finals';
    else if (selectedWinners.length === 2) roundName = 'Final';

    // Generate matches for second round
    const matches: Match[] = [];
    
    if (secondRoundType === 'KNOCKOUT') {
      // Pair teams for knockout matches
      for (let i = 0; i < selectedWinners.length; i += 2) {
        if (i + 1 < selectedWinners.length) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1, // Placeholder
            sportName: selectedTournament!.sportName,
            team1Id: selectedWinners[i].teamId,
            team1Name: selectedWinners[i].teamName,
            team2Id: selectedWinners[i + 1].teamId,
            team2Name: selectedWinners[i + 1].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 1 // Second round has lower value than first
          });
        }
      }
    } else {
      // Round robin - everyone plays everyone
      for (let i = 0; i < selectedWinners.length; i++) {
        for (let j = i + 1; j < selectedWinners.length; j++) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1, // Placeholder
            sportName: selectedTournament!.sportName,
            team1Id: selectedWinners[i].teamId,
            team1Name: selectedWinners[i].teamName,
            team2Id: selectedWinners[j].teamId,
            team2Name: selectedWinners[j].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 1
          });
        }
      }
    }

    const newSecondRound: RoundFixture = {
      roundValue: 1,
      roundName: roundName,
      type: secondRoundType,
      matches: matches
    };

    setSecondRoundFixture(newSecondRound);
    setShowSecondRound(true);
    setShowSecondRoundModal(false);
  };

  const getRound2Winners = () => {
    if (!secondRoundFixture || !secondRoundFixture.matches) return [];
    
    let winners;
    
    if (secondRoundFixture.type === 'KNOCKOUT') {
      // For knockout, get winners from each match
      winners = secondRoundFixture.matches.map((match, index) => {
        const placeholderName = `Match${index + 1}Winner`;
        
        return {
          teamId: match.winnerTeamId || -(index + 100),
          teamName: match.status === 'COMPLETED' && match.winnerTeamName 
            ? match.winnerTeamName 
            : placeholderName,
          isActual: match.status === 'COMPLETED' && match.winnerTeamName
        };
      });
    } else {
      // For round robin, get all participating teams but limit to best half
      const allTeams = new Set();
      secondRoundFixture.matches.forEach(match => {
        allTeams.add(match.team1Name);
        if (match.team2Name !== 'BYE') {
          allTeams.add(match.team2Name);
        }
      });
      
      const teamArray = Array.from(allTeams);
      const bestHalf = Math.ceil(teamArray.length / 2);
      
      winners = teamArray.slice(0, bestHalf).map((teamName, index) => ({
        teamId: -(index + 100),
        teamName: `Team ${index + 1} Winner Round 2`,
        isActual: false // These are placeholder names for round robin
      }));
    }
    
    return winners;
  };

  const generateThirdRound = () => {
    const winners = getRound2Winners();
    if (winners.length < 2) {
      setError('Need at least 2 winners from Round 2 to generate Round 3');
      return;
    }
    
    // Use all winners from getRound2Winners (it already handles the halving for Round Robin)
    const selectedWinners = winners;

    // Generate third round name based on number of teams
    let roundName = 'Round 3';
    if (selectedWinners.length === 8) roundName = 'Quarter Finals';
    else if (selectedWinners.length === 4) roundName = 'Semi Finals';
    else if (selectedWinners.length === 2) roundName = 'Final';

    // Generate matches for third round
    const matches: Match[] = [];
    
    if (thirdRoundType === 'KNOCKOUT') {
      // Pair teams for knockout matches
      for (let i = 0; i < selectedWinners.length; i += 2) {
        if (i + 1 < selectedWinners.length) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1, // Placeholder
            sportName: selectedTournament!.sportName,
            team1Id: selectedWinners[i].teamId,
            team1Name: selectedWinners[i].teamName,
            team2Id: selectedWinners[i + 1].teamId,
            team2Name: selectedWinners[i + 1].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 0 // Third round has lower value than second
          });
        }
      }
    } else {
      // Round robin - everyone plays everyone
      for (let i = 0; i < selectedWinners.length; i++) {
        for (let j = i + 1; j < selectedWinners.length; j++) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1, // Placeholder
            sportName: selectedTournament!.sportName,
            team1Id: selectedWinners[i].teamId,
            team1Name: selectedWinners[i].teamName,
            team2Id: selectedWinners[j].teamId,
            team2Name: selectedWinners[j].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 0
          });
        }
      }
    }

    const newThirdRound: RoundFixture = {
      roundValue: 0,
      roundName: roundName,
      type: thirdRoundType,
      matches: matches
    };

    setThirdRoundFixture(newThirdRound);
    setShowThirdRound(true);
    setShowThirdRoundModal(false);
  };

  const getRound3Winners = () => {
    if (!thirdRoundFixture || !thirdRoundFixture.matches) return [];
    
    let winners;
    
    if (thirdRoundFixture.type === 'KNOCKOUT') {
      // For knockout, get winners from each match
      winners = thirdRoundFixture.matches.map((match, index) => {
        const placeholderName = `Match${index + 1}Winner`;
        
        return {
          teamId: match.winnerTeamId || -(index + 200),
          teamName: match.status === 'COMPLETED' && match.winnerTeamName 
            ? match.winnerTeamName 
            : placeholderName,
          isActual: match.status === 'COMPLETED' && match.winnerTeamName
        };
      });
    } else {
      // For round robin, get all participating teams but limit to best half
      const allTeams = new Set();
      thirdRoundFixture.matches.forEach(match => {
        allTeams.add(match.team1Name);
        if (match.team2Name !== 'BYE') {
          allTeams.add(match.team2Name);
        }
      });
      
      const teamArray = Array.from(allTeams);
      const bestHalf = Math.ceil(teamArray.length / 2);
      
      winners = teamArray.slice(0, bestHalf).map((teamName, index) => ({
        teamId: -(index + 200),
        teamName: `Team ${index + 1} Winner Round 3`,
        isActual: false // These are placeholder names for round robin
      }));
    }
    
    return winners;
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
                              className={`flex items-center justify-between px-4 py-3 border rounded-lg transition-colors ${
                                match.status === 'COMPLETED' 
                                  ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 font-medium min-w-[60px]">
                                  Match {matchIndex + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className={`font-semibold ${match.status === 'COMPLETED' && match.winnerTeamId === match.team1Id ? 'text-green-700' : 'text-gray-900'}`}>
                                    {match.team1Name}
                                  </span>
                                  <span className="text-gray-500 font-medium">vs</span>
                                  <span className={`font-semibold ${
                                    match.team2Name === 'BYE' 
                                      ? 'text-gray-500 italic' 
                                      : match.status === 'COMPLETED' && match.winnerTeamId === match.team2Id 
                                        ? 'text-green-700' 
                                        : 'text-gray-900'
                                  }`}>
                                    {match.team2Name === 'BYE' ? 'BYE (Auto-advance)' : match.team2Name}
                                  </span>
                                </div>
                                {match.status === 'COMPLETED' && match.winnerTeamName && (
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className="text-xs text-green-600 font-medium">Winner:</span>
                                    <span className="text-sm font-semibold text-green-700">{match.winnerTeamName}</span>
                                  </div>
                                )}
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

                  {/* Expected Winners Display - After Matches */}
                  {(() => {
                    // Get winners using the proper function
                    const winners = getRound1Winners().map((winner, index) => ({
                      displayName: winner.teamName,
                      isActualWinner: winner.isActual,
                      matchIndex: index + 1
                    }));

                    return winners.length > 0 && round.type && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Round 1 Winners ({winners.length})
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Winners advancing from this round:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {winners.map((winner, index) => (
                            <div
                              key={`winner-slot-${index}`}
                              className={`px-4 py-2 rounded-md shadow-sm flex items-center gap-2 ${
                                winner.isActualWinner 
                                  ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-300'
                                  : 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                winner.isActualWinner ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></span>
                              <span className={`font-medium ${
                                winner.isActualWinner ? 'text-green-800' : 'text-gray-800'
                              }`}>
                                {winner.displayName}
                              </span>
                              {winner.isActualWinner && (
                                <span className="text-xs text-green-600 font-medium ml-auto">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Generate Second Round Button */}
                        {(() => {
                          const winners = getRound1Winners();
                          const hasEnoughWinners = winners.length >= 2;
                          const allMatchesCompleted = round.matches.every(match => match.status === 'COMPLETED');
                          
                          return hasEnoughWinners && (
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => setShowSecondRoundModal(true)}
                    
                                className={`px-4 py-2 rounded-md font-semibold text-sm ${
                                  allMatchesCompleted
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-white-500'
                                }`}
                                title={!allMatchesCompleted ? 'Complete all Round 1 matches first' : 'Generate next round'}
                              >
                                Generate Next Round
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()
                }
                </div>
              ))}
              
              {/* Second Round Display */}
              {showSecondRound && secondRoundFixture && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Round Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-white">{secondRoundFixture.roundName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoundTypeColor(secondRoundFixture.type)}`}>
                          {secondRoundFixture.type?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white text-sm">
                          {secondRoundFixture.matches.length} {secondRoundFixture.matches.length === 1 ? 'Match' : 'Matches'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Round Content */}
                  <div className="p-6">
                    {/* Matches Display */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Matches</h4>
                      <div className="space-y-2">
                        {secondRoundFixture.matches.map((match, matchIndex) => (
                          <div 
                            key={`second-round-match-${matchIndex}`} 
                            className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 font-medium min-w-[60px]">
                                Match {matchIndex + 1}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900">{match.team1Name}</span>
                                <span className="text-gray-500 font-medium">vs</span>
                                <span className="font-semibold text-gray-900">{match.team2Name}</span>
                              </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getMatchStatusColor(match.status)}`}>
                              {match.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Round 2 Winners Display */}
                    {(() => {
                      // Get winners using the proper function
                      const winners = getRound2Winners().map((winner, index) => ({
                        displayName: winner.teamName,
                        isActualWinner: winner.isActual,
                        matchIndex: index + 1
                      }));

                      return winners.length > 0 && secondRoundFixture.type && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            Round 2 Winners ({winners.length})
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Winners advancing from this round:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {winners.map((winner, index) => (
                              <div
                                key={`winner-slot-round2-${index}`}
                                className={`px-4 py-2 rounded-md shadow-sm flex items-center gap-2 ${
                                  winner.isActualWinner 
                                    ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-300'
                                    : 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${
                                  winner.isActualWinner ? 'bg-green-500' : 'bg-yellow-500'
                                }`}></span>
                                <span className={`font-medium ${
                                  winner.isActualWinner ? 'text-green-800' : 'text-gray-800'
                                }`}>
                                  {winner.displayName}
                                </span>
                                {winner.isActualWinner && (
                                  <span className="text-xs text-green-600 font-medium ml-auto">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Generate Third Round Button */}
                          {(() => {
                            const round2Winners = getRound2Winners();
                            const hasEnoughWinners = round2Winners.length >= 2;
                            const allRound2MatchesCompleted = secondRoundFixture.matches.every(match => match.status === 'COMPLETED');
                            
                            return hasEnoughWinners && (
                              <div className="mt-4 flex justify-end">
                                <button
                                  onClick={() => setShowThirdRoundModal(true)}
                                
                                  className={`px-4 py-2 rounded-md font-semibold text-sm ${
                                  allRound2MatchesCompleted
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-white-500'
                                }`}
                                title={!allRound2MatchesCompleted ? 'Complete all Round 1 matches first' : 'Generate next round'}
                              >
                                Generate Next Round
                              </button>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Third Round Display */}
              {showThirdRound && thirdRoundFixture && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Round Header */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-white">{thirdRoundFixture.roundName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoundTypeColor(thirdRoundFixture.type)}`}>
                          {thirdRoundFixture.type?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white text-sm">
                          {thirdRoundFixture.matches.length} {thirdRoundFixture.matches.length === 1 ? 'Match' : 'Matches'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Round Content */}
                  <div className="p-6">
                    {/* Matches Display */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Matches</h4>
                      <div className="space-y-2">
                        {thirdRoundFixture.matches.map((match, matchIndex) => (
                          <div 
                            key={`third-round-match-${matchIndex}`} 
                            className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 font-medium min-w-[60px]">
                                Match {matchIndex + 1}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900">{match.team1Name}</span>
                                <span className="text-gray-500 font-medium">vs</span>
                                <span className="font-semibold text-gray-900">{match.team2Name}</span>
                              </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getMatchStatusColor(match.status)}`}>
                              {match.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Round 3 Winners Display */}
                    {(() => {
                      // Get winners using the proper function
                      const winners = getRound3Winners().map((winner, index) => ({
                        displayName: winner.teamName,
                        isActualWinner: winner.isActual,
                        matchIndex: index + 1
                      }));

                      return winners.length > 0 && thirdRoundFixture.type && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            Round 3 Winners ({winners.length})
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Winners advancing from this round:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {winners.map((winner, index) => (
                              <div
                                key={`winner-slot-round3-${index}`}
                                className={`px-4 py-2 rounded-md shadow-sm flex items-center gap-2 ${
                                  winner.isActualWinner 
                                    ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-300'
                                    : 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${
                                  winner.isActualWinner ? 'bg-green-500' : 'bg-yellow-500'
                                }`}></span>
                                <span className={`font-medium ${
                                  winner.isActualWinner ? 'text-green-800' : 'text-gray-800'
                                }`}>
                                  {winner.displayName}
                                </span>
                                {winner.isActualWinner && (
                                  <span className="text-xs text-green-600 font-medium ml-auto">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
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

          {/* Generate Second Round Modal */}
          {showSecondRoundModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Second Round</h3>
                <p className="text-gray-600 mb-4">
                  Select the tournament type for the second round:
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Type
                  </label>
                  <select
                    value={secondRoundType}
                    onChange={(e) => setSecondRoundType(e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                {(() => {
                  const winners = getRound1Winners();
                  return (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800 font-medium">
                        Teams advancing: {winners.length}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {winners.filter(w => w.isActual).length} confirmed winners, {winners.filter(w => !w.isActual).length} pending
                      </p>
                    </div>
                  );
                })()}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSecondRoundModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateSecondRound}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Generate Second Round
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Third Round Modal */}
          {showThirdRoundModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Third Round</h3>
                <p className="text-gray-600 mb-4">
                  Select the tournament type for the third round:
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Type
                  </label>
                  <select
                    value={thirdRoundType}
                    onChange={(e) => setThirdRoundType(e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                {(() => {
                  const winners = getRound2Winners();
                  return (
                    <div className="mb-4 p-3 bg-purple-50 rounded-md">
                      <p className="text-sm text-purple-800 font-medium">
                        Teams advancing from Round 2: {winners.length}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {winners.filter(w => w.isActual).length} confirmed winners, {winners.filter(w => !w.isActual).length} pending
                      </p>
                    </div>
                  );
                })()}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowThirdRoundModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateThirdRound}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                  >
                    Generate Third Round
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