'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Topbar from '@/Component/topbar';
import { makeAuthenticatedRequest } from '@/utils/api';
import './fixture.css';

interface Team {
  teamId: number;
  teamName: string;
  dummy: boolean;
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

export default function FixtureViewPage() {
  const params = useParams();
  const tournamentId = parseInt(params.tournamentId as string);

  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTournamentFixture = useCallback(async () => {
    setLoading(true);
    setError(null);

    const loadRound = async (roundValue: number): Promise<RoundFixture | null> => {
      try {
        const result = await makeAuthenticatedRequest<RoundFixture>(
          `/api/tournaments/${tournamentId}/rounds/value/${roundValue}`
        );

        if (result.data && result.data.matches && result.data.matches.length > 0) {
          return result.data;
        }
        return null;
      } catch {
        return null;
      }
    };

    try {
      // First, get tournament info
      const tournamentResult = await makeAuthenticatedRequest<Tournament>(
        `/api/tournaments/${tournamentId}`
      );

      if (tournamentResult.error) {
        setError('Tournament not found');
        setLoading(false);
        return;
      }

      // Load all existing rounds (check up to 10 rounds max)
      const loadedRounds: RoundFixture[] = [];
      const maxRoundsToCheck = 10;

      for (let roundNum = 1; roundNum <= maxRoundsToCheck; roundNum++) {
        const roundData = await loadRound(roundNum);
        if (roundData) {
          loadedRounds.push({ ...roundData, roundValue: roundNum });
        }
      }

      if (loadedRounds.length > 0) {
        const fixtureData: Fixture = {
          tournamentId: tournamentId,
          tournamentName: tournamentResult.data!.name,
          sportName: tournamentResult.data!.sportName,
          rounds: loadedRounds,
        };

        setFixture(fixtureData);
      } else {
        setError('No fixture found for this tournament');
      }
    } catch {
      setError('Failed to load tournament fixture');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentFixture();
    }
  }, [tournamentId, loadTournamentFixture]);

  const getRoundWinners = async (roundNumber: number, roundFixture: RoundFixture): Promise<Team[]> => {
    if (roundFixture.type === "KNOCKOUT") {
      return getKnockOutRoundWinners(roundNumber, roundFixture);
    } else {
      return getRoundRobinRoundWinners(roundNumber, roundFixture);
    }
  };

  const getKnockOutRoundWinners = async (roundNumber: number, roundFixture: RoundFixture): Promise<Team[]> => {
    const winners: Team[] = [];
    
    // First, compile all actual winners from completed matches
    const actualWinners: { [index: number]: Team } = {};
    roundFixture.matches.forEach((match, index) => {
      if (match.status === "COMPLETED" && match.winnerTeamId && match.winnerTeamName) {
        actualWinners[index] = {
          teamId: match.winnerTeamId,
          teamName: match.winnerTeamName,
          dummy: false,
        };
      }
    });

    // Fetch all dummy teams for this tournament and round in one API call
    let dummyTeams: Team[] = [];
    try {
      const result = await makeAuthenticatedRequest<{ teams: Team[] }>(
        `/api/teams/dummy/tournament/${tournamentId}/round/${roundNumber}`
      );

      if (result.data && result.data.teams) {
        dummyTeams = result.data.teams;
      }
    } catch (error) {
      console.error("Error fetching dummy teams:", error);
    }

    // Compile the complete list of winners
    for (let index = 0; index < roundFixture.matches.length; index++) {
      if (actualWinners[index]) {
        // Use actual winner
        winners.push(actualWinners[index]);
      } else {
        // Use dummy team or create fallback
        if (dummyTeams.length > index) {
          winners.push({
            teamId: dummyTeams[index].teamId,
            teamName: dummyTeams[index].teamName,
            dummy: true,
          });
        } else {
          // Fallback: create the expected dummy team structure
          winners.push({
            teamId: -1,
            teamName: `Winner Team Match ${index + 1} Round ${roundNumber}`,
            dummy: true,
          });
        }
      }
    }

    return winners;
  };

  const getRoundRobinRoundWinners = async (roundNumber: number, roundFixture: RoundFixture): Promise<Team[]> => {
    const allTeams = new Set<number>();
    roundFixture.matches.forEach((match) => {
      allTeams.add(match.team1Id);
      if (match.team2Name !== "BYE" && match.team2Id !== null) {
        allTeams.add(match.team2Id);
      }
    });

    const teamArray = Array.from(allTeams);
    let bestHalf = Math.floor(teamArray.length / 2);
    
    // Ensure even number of winners for proper knockout progression
    if (bestHalf % 2 !== 0) {
      bestHalf = bestHalf - 1;
    }
    
    if (bestHalf < 2) {
      bestHalf = Math.min(2, teamArray.length);
    }

    const winners: Team[] = [];

    // Fetch dummy teams from the database for this tournament and round
    try {
      const result = await makeAuthenticatedRequest<{ teams: Team[] }>(
        `/api/teams/dummy/tournament/${tournamentId}/round/${roundFixture.roundValue}`
      );

      if (result.data && result.data.teams) {
        result.data.teams.forEach(team => {
          winners.push({
            teamId: team.teamId,
            teamName: team.teamName,
            dummy: team.dummy,
          });
        });
      } else {
        for (let i = 0; i < bestHalf; i++) {
          winners.push({
            teamId: -1,
            teamName: `Winner Team ${i + 1} Round ${roundFixture.roundValue}`,
            dummy: true,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dummy teams:", error);
      for (let i = 0; i < bestHalf; i++) {
        winners.push({
          teamId: -1,
          teamName: `Winner Team ${i + 1} Round ${roundFixture.roundValue}`,
          dummy: true,
        });
      }
    }

    return winners;
  };

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return 'Not Scheduled';
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ONGOING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoundTypeColor = (type: string | null) => {
    if (type === "KNOCKOUT") return "bg-blue-100 text-blue-600";
    if (type === "ROUND_ROBIN") return "bg-green-100 text-green-600";
    return "bg-gray-100 text-gray-600";
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

  // Render a single round component
  const RoundCard = ({ roundFixture, roundNumber }: { roundFixture: RoundFixture; roundNumber: number }) => {
    const [winners, setWinners] = useState<Team[]>([]);
    const [isLoadingWinners, setIsLoadingWinners] = useState(true);

    useEffect(() => {
      const fetchWinners = async () => {
        setIsLoadingWinners(true);
        const fetchedWinners = await getRoundWinners(roundNumber, roundFixture);
        setWinners(fetchedWinners);
        setIsLoadingWinners(false);
      };
      fetchWinners();
    }, [roundFixture, roundNumber]);

    const headerColors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-red-500 to-red-600",
      "from-yellow-500 to-yellow-600",
      "from-indigo-500 to-indigo-600",
      "from-pink-500 to-pink-600",
    ];
    const colorIndex = Math.min(roundNumber - 1, headerColors.length - 1);

    return (
      <div
        key={roundFixture.roundId || `round-${roundNumber}`}
        className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden"
      >
        <div
          className={`p-4 bg-gradient-to-r ${headerColors[colorIndex]} text-white flex justify-between items-center`}
        >
          <h3 className="text-2xl font-bold">{roundFixture.roundName}</h3>
          <div className="flex items-center space-x-4">
            {roundFixture.type && (
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoundTypeColor(
                  roundFixture.type
                )}`}
              >
                {roundFixture.type.replace("_", " ")}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Matches Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Matches</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roundFixture.matches.map((match, index) => (
                <div
                  key={match.matchId || `match-${index}`}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">Match {index + 1}</p>
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${getMatchStatusColor(
                        match.status
                      )}`}
                    >
                      {match.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{match.team1Name}</span>
                      <span className="font-bold">vs</span>
                      <span className="font-semibold">
                        {match.team2Name || "TBD"}
                      </span>
                    </div>
                    {match.winnerTeamName && (
                      <div className="text-center text-sm text-green-600 font-semibold pt-1">
                        Winner: {match.winnerTeamName}
                      </div>
                    )}
                    {match.scheduledTime && (
                      <div className="text-center text-xs text-gray-500 pt-1">
                        {formatDateTime(match.scheduledTime)}
                      </div>
                    )}
                    {match.venue && (
                      <div className="text-center text-xs text-gray-500">
                        Venue: {match.venue}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winners Section */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Round Winners</h4>
            {isLoadingWinners ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading winners...</span>
              </div>
            ) : winners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {winners.map((winner, index) => (
                  <div
                    key={`winner-${winner.teamId}-${index}`}
                    className={`p-3 rounded-lg border-2 ${
                      winner.dummy 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                        : 'bg-green-50 border-green-200 text-green-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{winner.teamName}</span>
                      {winner.dummy && (
                        <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-1 rounded">
                          TBD
                        </span>
                      )}
                      {!winner.dummy && (
                        <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No winners determined yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">
          {fixture?.tournamentName} - {fixture?.sportName} Fixture
        </h1>

        {fixture && (
          <div>
            {fixture.rounds.map((round, index) => (
              <RoundCard
                key={round.roundId || `round-${index}`}
                roundFixture={round}
                roundNumber={index + 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}