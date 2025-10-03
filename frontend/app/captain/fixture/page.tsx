'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface Sport {
  sportId: number;
  name: string;
}

export default function FixtureViewer() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [captainSports, setCaptainSports] = useState<Sport[]>([]);
  const [showFixture, setShowFixture] = useState(false);
  const [fixtureExists, setFixtureExists] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'KNOCKOUT' | 'ROUND_ROBIN'>('KNOCKOUT');
  
  // Modular round system - can handle unlimited rounds
  const [additionalRounds, setAdditionalRounds] = useState<RoundFixture[]>([]);
  const [showRoundModal, setShowRoundModal] = useState<number | null>(null);
  const [selectedRoundType, setSelectedRoundType] = useState<'KNOCKOUT' | 'ROUND_ROBIN'>('KNOCKOUT');
  const [showRegenerateRoundModal, setShowRegenerateRoundModal] = useState<number | null>(null);
  const [regenerateRoundType, setRegenerateRoundType] = useState<'KNOCKOUT' | 'ROUND_ROBIN'>('KNOCKOUT');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchUserProfileAndTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTeams(selectedTournament.tournamentId);
      checkFixtureExists(selectedTournament.tournamentId);
      setFixture(null);
      setShowFixture(false);
      setAdditionalRounds([]); // Reset additional rounds
    } else {
      setTeams([]);
      setFixture(null);
      setShowFixture(false);
      setFixtureExists(false);
      setAdditionalRounds([]);
    }
  }, [selectedTournament]);

  // Generic function to get winners from any round
  const getRoundWinners = (roundNumber: number) => {
    let roundFixture: RoundFixture | null = null;
    
    if (roundNumber === 1) {
      roundFixture = fixture?.rounds?.[0] || null;
    } else {
      roundFixture = additionalRounds[roundNumber - 2] || null;
    }
    
    if (!roundFixture || !roundFixture.matches) return [];
    
    let winners;
    
    if (roundFixture.type === 'KNOCKOUT') {
      winners = roundFixture.matches.map((match, index) => {
        const placeholderName = `Match${index + 1}Winner`;
        
        return {
          teamId: match.winnerTeamId || -(index + roundNumber * 100),
          teamName: match.status === 'COMPLETED' && match.winnerTeamName 
            ? match.winnerTeamName 
            : placeholderName,
          isActual: match.status === 'COMPLETED' && match.winnerTeamName
        };
      });
    } else {
      const allTeams = new Set<string>();
      roundFixture.matches.forEach(match => {
        allTeams.add(match.team1Name);
        if (match.team2Name !== 'BYE') {
          allTeams.add(match.team2Name);
        }
      });
      
      const teamArray = Array.from(allTeams);
      const bestHalf = Math.ceil(teamArray.length / 2);
      
      winners = teamArray.slice(0, bestHalf).map((teamName, index) => ({
        teamId: -(index + roundNumber * 100),
        teamName: `Team ${index + 1} Winner Round ${roundNumber}`,
        isActual: false
      }));
    }
    
    return winners;
  };

  // Generic function to generate any round
  const generateNextRound = (roundNumber: number) => {
    const winners = getRoundWinners(roundNumber - 1);
    if (winners.length < 2) {
      setError(`Need at least 2 winners to generate ${getUIRoundName(roundNumber)}`);
      return;
    }

    const roundName = getRoundName(roundNumber, winners.length);

    const matches: Match[] = [];
    
    if (selectedRoundType === 'KNOCKOUT') {
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1,
            sportName: selectedTournament!.sportName,
            team1Id: winners[i].teamId,
            team1Name: winners[i].teamName,
            team2Id: winners[i + 1].teamId,
            team2Name: winners[i + 1].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 10 - roundNumber
          });
        }
      }
    } else {
      for (let i = 0; i < winners.length; i++) {
        for (let j = i + 1; j < winners.length; j++) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1,
            sportName: selectedTournament!.sportName,
            team1Id: winners[i].teamId,
            team1Name: winners[i].teamName,
            team2Id: winners[j].teamId,
            team2Name: winners[j].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 10 - roundNumber
          });
        }
      }
    }

    const newRound: RoundFixture = {
      roundValue: 10 - roundNumber,
      roundName: roundName,
      type: selectedRoundType,
      matches: matches
    };

    const newAdditionalRounds = [...additionalRounds];
    newAdditionalRounds[roundNumber - 2] = newRound;
    setAdditionalRounds(newAdditionalRounds);
    setShowRoundModal(null);
  };

  // Regenerate a specific round and delete all subsequent rounds
  const regenerateRound = async (roundNumber: number) => {
    if (roundNumber === 1) {
      // For Round 1, use the existing regenerateFixture function
      await regenerateFixture();
      return;
    }

    const winners = getRoundWinners(roundNumber - 1);
    if (winners.length < 2) {
      setError(`Need at least 2 winners to regenerate ${getUIRoundName(roundNumber)}`);
      return;
    }

    const roundName = getRoundName(roundNumber, winners.length);
    const matches: Match[] = [];
    
    if (regenerateRoundType === 'KNOCKOUT') {
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1,
            sportName: selectedTournament!.sportName,
            team1Id: winners[i].teamId,
            team1Name: winners[i].teamName,
            team2Id: winners[i + 1].teamId,
            team2Name: winners[i + 1].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 10 - roundNumber
          });
        }
      }
    } else {
      for (let i = 0; i < winners.length; i++) {
        for (let j = i + 1; j < winners.length; j++) {
          matches.push({
            tournamentId: selectedTournament!.tournamentId,
            tournamentName: selectedTournament!.name,
            sportId: 1,
            sportName: selectedTournament!.sportName,
            team1Id: winners[i].teamId,
            team1Name: winners[i].teamName,
            team2Id: winners[j].teamId,
            team2Name: winners[j].teamName,
            status: 'SCHEDULED',
            roundName: roundName,
            roundValue: 10 - roundNumber
          });
        }
      }
    }

    const newRound: RoundFixture = {
      roundValue: 10 - roundNumber,
      roundName: roundName,
      type: regenerateRoundType,
      matches: matches
    };

    // Delete all rounds from this round onwards (cascade deletion)
    const newAdditionalRounds = [...additionalRounds];
    // Keep only rounds before the regenerated round
    const roundsToKeep = Math.max(0, roundNumber - 2); // -2 because additionalRounds starts from round 2
    newAdditionalRounds.splice(roundsToKeep); // Remove from this index onwards
    
    // Add the regenerated round at the correct position
    const targetIndex = roundNumber - 2;
    if (targetIndex >= 0) {
      newAdditionalRounds[targetIndex] = newRound;
    }
    
    // Count how many rounds were deleted for the success message
    const deletedRounds = additionalRounds.length - newAdditionalRounds.length;
    
    setAdditionalRounds(newAdditionalRounds);
    setShowRegenerateRoundModal(null);
    
    const deletionMessage = deletedRounds > 0 
      ? ` ${deletedRounds} subsequent round${deletedRounds === 1 ? '' : 's'} have been deleted.`
      : '';
    alert(`${getUIRoundName(roundNumber)} regenerated successfully!${deletionMessage}`);
  };

  // Helper functions
  const getRoundName = (roundNumber: number, teamCount: number) => {
    // teamCount represents the number of teams IN this round (not advancing to next round)
    // Special cases for finals
    if (teamCount === 2) return 'Final';
    if (teamCount === 4) return 'Semi Final';
    if (teamCount === 8) return 'Quarter Final';
    
    // For other rounds, use "Round of X" format where X is the number of teams
    if (teamCount >= 16) {
      return `Round of ${teamCount}`;
    }
    
    // Fallback for very small tournaments or unusual sizes
    return `Round ${roundNumber}`;
  };

  // Get proper round name for UI display (for buttons, modals, etc.)
  const getUIRoundName = (roundNumber: number) => {
    const roundFixture = getRoundFixture(roundNumber);
    if (roundFixture && roundFixture.roundName) {
      return roundFixture.roundName;
    }
    
    // If no fixture exists, calculate expected round name based on previous round
    if (roundNumber === 1) {
      // For round 1, calculate based on total teams
      const round = getRoundFixture(1);
      if (round) {
        const allTeams = new Set<string>();
        round.matches.forEach(match => {
          allTeams.add(match.team1Name);
          if (match.team2Name !== 'BYE') {
            allTeams.add(match.team2Name);
          }
        });
        return getRoundName(1, allTeams.size);
      }
      return 'First Round';
    }
    
    const winners = getRoundWinners(roundNumber - 1);
    if (winners.length > 0) {
      return getRoundName(roundNumber, winners.length);
    }
    
    return `Round ${roundNumber}`;
  };

  // Removed areAllMatchesCompleted function - rounds can be generated regardless of match completion status

  const getRoundFixture = (roundNumber: number): RoundFixture | null => {
    if (roundNumber === 1) {
      return fixture?.rounds?.[0] || null;
    } else {
      return additionalRounds[roundNumber - 2] || null;
    }
  };

  const getMaxRoundNumber = () => {
    const round = getRoundFixture(1);
    if (!round) return 1;
    
    const allTeams = new Set<string>();
    round.matches.forEach(match => {
      allTeams.add(match.team1Name);
      if (match.team2Name !== 'BYE') {
        allTeams.add(match.team2Name);
      }
    });
    
    const teamCount = allTeams.size;
    return Math.ceil(Math.log2(teamCount)) + 1;
  };

  // Fetch user profile and tournaments filtered by captain's sports
  const fetchUserProfileAndTournaments = async () => {
    try {
      // First, fetch user profile
      const userResult = await makeAuthenticatedRequest<User>('/api/users/profile');
      if (userResult.error) {
        setError(userResult.error);
        return;
      }
      
      if (!userResult.data) {
        setError('Failed to fetch user profile');
        return;
      }

      setUserProfile(userResult.data);
      
      // Then fetch sports managed by this captain
      const sportsResult = await makeAuthenticatedRequest<Sport[]>(`/api/sports/captain/${userResult.data.userId}`);
      if (sportsResult.error) {
        setError(sportsResult.error);
        return;
      }
      
      if (!sportsResult.data) {
        setError('Failed to fetch captain sports');
        return;
      }

      setCaptainSports(sportsResult.data);
      
      // If captain has no sports, show empty tournaments
      if (sportsResult.data.length === 0) {
        setTournaments([]);
        return;
      }
      
      // Fetch all tournaments and filter by captain's sports
      const tournamentsResult = await makeAuthenticatedRequest<Tournament[]>('/api/tournaments');
      if (tournamentsResult.error) {
        setError(tournamentsResult.error);
        return;
      }
      
      if (!tournamentsResult.data) {
        setError('Failed to fetch tournaments');
        return;
      }

      // Filter tournaments to only include those from sports this captain manages
      const captainSportNames = sportsResult.data.map(sport => sport.name);
      const filteredTournaments = tournamentsResult.data.filter(tournament => 
        captainSportNames.includes(tournament.sportName)
      );
      
      setTournaments(filteredTournaments);
      
      // Check if there's a tournamentId in the query params and pre-select it
      const tournamentIdParam = searchParams.get('tournamentId');
      if (tournamentIdParam) {
        const tournamentId = parseInt(tournamentIdParam);
        const tournamentToSelect = filteredTournaments.find(t => t.tournamentId === tournamentId);
        if (tournamentToSelect) {
          setSelectedTournament(tournamentToSelect);
        }
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
      const existingResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture/existing`);
      
      if (existingResult.data && existingResult.data.rounds && existingResult.data.rounds.length > 0) {
        const allRounds = existingResult.data.rounds.sort((a, b) => b.roundValue - a.roundValue); // sort by roundValue descending (round 1 first)
        
        // Only load the first round (highest roundValue) from the database
        // Additional rounds are generated in memory and not persisted
        const firstRound = allRounds[0];
        
        const filteredFixture = {
          ...existingResult.data,
          rounds: [firstRound]
        };
        setFixture(filteredFixture);
        setAdditionalRounds([]); // Clear any additional rounds since they're not persisted
        setShowFixture(true);
      } else {
        const generateResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture`);
        
        if (generateResult.data && generateResult.data.rounds && generateResult.data.rounds.length > 0) {
          const allRounds = generateResult.data.rounds.sort((a, b) => b.roundValue - a.roundValue);
          
          // For newly generated fixtures, just include the first round
          const firstRound = allRounds[0];
          const additionalRoundsData: RoundFixture[] = []; // No additional rounds yet
          
          const filteredFixture = {
            ...generateResult.data,
            rounds: [firstRound]
          };
          setFixture(filteredFixture);
          setAdditionalRounds(additionalRoundsData);
          setShowFixture(true);
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

  // Rest of the existing functions...
  const generateFixture = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      const structureResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture`);
      
      if (structureResult.data && structureResult.data.rounds && structureResult.data.rounds.length > 0) {
        const rounds = structureResult.data.rounds;
        const round = rounds.find(round => 
          round.roundValue === Math.max(...rounds.map(r => r.roundValue))
        );
        
        if (round && round.roundId) {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8090/api/tournaments/rounds/${round.roundId}/select-type`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ type: selectedType }),
          });

          if (response.ok) {
            await new Promise(resolve => setTimeout(resolve, 500));
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
      // Get existing fixture to get all roundIds and types
      const existingResult = await makeAuthenticatedRequest<Fixture>(`/api/tournaments/${selectedTournament.tournamentId}/fixture/existing`);
      
      if (existingResult.data && existingResult.data.rounds && existingResult.data.rounds.length > 0) {
        const allRounds = existingResult.data.rounds.sort((a, b) => b.roundValue - a.roundValue);
        
        // Only regenerate the first round (highest roundValue) since additional rounds are not persisted
        const firstRound = allRounds[0];
        
        if (firstRound && firstRound.roundId) {
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
            // Clear additional rounds since they need to be regenerated based on new winners
            setAdditionalRounds([]);
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadFixture();
            setShowRegenerateModal(false);
            alert(`Fixture regenerated successfully with ${selectedType} format!`);
          } else {
            throw new Error('Failed to regenerate fixture');
          }
        }
        
        // Reload the fixture to get updated data
        await loadFixture();
        
        setShowRegenerateModal(false);
        alert(`Fixture regenerated successfully with ${selectedType} format! All rounds have been updated.`);
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

  // Render a single round component
  const renderRound = (roundFixture: RoundFixture, roundNumber: number) => {
    const headerColors = [
      'from-blue-500 to-blue-600',     // Round 1
      'from-purple-500 to-purple-600', // Round 2
      'from-green-500 to-green-600',   // Round 3
      'from-red-500 to-red-600',       // Round 4
      'from-yellow-500 to-yellow-600', // Round 5
      'from-indigo-500 to-indigo-600', // Round 6
      'from-pink-500 to-pink-600',     // Round 7+
    ];
    const colorIndex = Math.min(roundNumber - 1, headerColors.length - 1);

    return (
      <div key={`round-${roundNumber}`} className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Round Header */}
        <div className={`bg-gradient-to-r ${headerColors[colorIndex]} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold text-black">{roundFixture.roundName}</h3>
              {roundFixture.type && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoundTypeColor(roundFixture.type)}`}>
                  {roundFixture.type.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white text-sm">
                {roundFixture.matches.length} {roundFixture.matches.length === 1 ? 'Match' : 'Matches'}
              </span>
              <button
                onClick={() => setShowRegenerateRoundModal(roundNumber)}
                className="px-4 py-2 bg-green-500 hover:bg-red-600 text-white text-sm font-bold rounded-md transition-colors shadow-md"
                title={`Regenerate ${getUIRoundName(roundNumber)}`}
              >
                🔄 Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Round Content */}
        <div className="p-6">
          {/* Matches Display */}
          {roundFixture.matches.length > 0 ? (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Matches</h4>
              <div className="space-y-2">
                {roundFixture.matches.map((match, matchIndex) => (
                  <div 
                    key={`round-${roundNumber}-match-${matchIndex}`} 
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
            </div>
          )}

          {/* Round Winners Display */}
          {(() => {
            const winners = getRoundWinners(roundNumber).map((winner, index) => ({
              displayName: winner.teamName,
              isActualWinner: winner.isActual,
              matchIndex: index + 1
            }));

            return winners.length > 0 && roundFixture.type && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Round {roundNumber} Winners ({winners.length})
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Winners advancing from this round:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {winners.map((winner, index) => (
                    <div
                      key={`winner-slot-round${roundNumber}-${index}`}
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
                
                {/* Generate Next Round Button */}
                {(() => {
                  const currentRoundWinners = getRoundWinners(roundNumber);
                  const hasEnoughWinners = currentRoundWinners.length >= 2;
                  const nextRoundExists = getRoundFixture(roundNumber + 1) !== null;
                  const maxRounds = getMaxRoundNumber();
                  
                  return hasEnoughWinners && !nextRoundExists && roundNumber < maxRounds && currentRoundWinners.length > 1 && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setShowRoundModal(roundNumber + 1)}
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-purple-600 text-white hover:bg-purple-700"
                        title={`Generate ${getUIRoundName(roundNumber + 1)}`}
                      >
                        Generate {getUIRoundName(roundNumber + 1)}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      </div>
    );
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

          {/* Fixture Display */}
          {showFixture && fixture && fixture.rounds.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{fixture.tournamentName}</h2>
                <p className="text-gray-600 mb-4">Sport: {fixture.sportName}</p>
              </div>

              {/* Render Round 1 */}
              {fixture.rounds.map((round, index) => renderRound(round, 1))}
              
              {/* Render Additional Rounds */}
              {additionalRounds.map((roundFixture, index) => renderRound(roundFixture, index + 2))}
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

          {/* Regenerate Round Modal */}
          {showRegenerateRoundModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Regenerate {getUIRoundName(showRegenerateRoundModal)}</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800 text-sm font-medium">Warning</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    This will regenerate {getUIRoundName(showRegenerateRoundModal)} and DELETE all subsequent rounds. This action cannot be undone.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Tournament Type
                  </label>
                  <select
                    value={regenerateRoundType}
                    onChange={(e) => setRegenerateRoundType(e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                {(() => {
                  const winners = getRoundWinners(showRegenerateRoundModal - 1);
                  const subsequentRounds = additionalRounds.slice(showRegenerateRoundModal - 1).filter(r => r !== undefined).length;
                  return (
                    <div className="mb-4 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-800 font-medium">
                        Teams from Round {showRegenerateRoundModal - 1}: {winners.length}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {subsequentRounds > 0 ? `${subsequentRounds} subsequent round(s) will be deleted` : 'No subsequent rounds to delete'}
                      </p>
                    </div>
                  );
                })()}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRegenerateRoundModal(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => regenerateRound(showRegenerateRoundModal)}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                  >
                    Regenerate {getUIRoundName(showRegenerateRoundModal)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generic Round Generation Modal */}
          {showRoundModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Generate {getUIRoundName(showRoundModal)}</h3>
                <p className="text-gray-600 mb-4">
                  Select the tournament type for round {showRoundModal}:
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Type
                  </label>
                  <select
                    value={selectedRoundType}
                    onChange={(e) => setSelectedRoundType(e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                {(() => {
                  const winners = getRoundWinners(showRoundModal - 1);
                  return (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800 font-medium">
                        Teams advancing from Round {showRoundModal - 1}: {winners.length}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {winners.filter(w => w.isActual).length} confirmed winners, {winners.filter(w => !w.isActual).length} pending
                      </p>
                    </div>
                  );
                })()}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRoundModal(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => generateNextRound(showRoundModal)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Generate {getUIRoundName(showRoundModal)}
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