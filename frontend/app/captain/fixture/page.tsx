"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeAuthenticatedRequest } from "../../../../utils/api";
import Topbar from "../../../../Component/topbar";
import Sidebar from "../../../../Component/captain_sidebar";

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
  type: "ROUND_ROBIN" | "KNOCKOUT" | null;
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
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
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
  const [selectedType, setSelectedType] = useState<"KNOCKOUT" | "ROUND_ROBIN">(
    "KNOCKOUT"
  );

  // Modular round system - can handle unlimited rounds
  const [additionalRounds, setAdditionalRounds] = useState<RoundFixture[]>([]);
  const [showRoundModal, setShowRoundModal] = useState<number | null>(null);
  const [selectedRoundType, setSelectedRoundType] = useState<
    "KNOCKOUT" | "ROUND_ROBIN"
  >("KNOCKOUT");
  const [showRegenerateRoundModal, setShowRegenerateRoundModal] = useState<
    number | null
  >(null);
  const [regenerateRoundType, setRegenerateRoundType] = useState<
    "KNOCKOUT" | "ROUND_ROBIN"
  >("KNOCKOUT");
  const [currentRoundValue, setCurrentRoundValue] = useState<number>(1);
  const [nextRoundWinners, setNextRoundWinners] = useState<{ teamId: number; teamName: string; isActual: boolean; }[]>([]);

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
      setCurrentRoundValue(1);
    }
  }, [selectedTournament]);

  // Update currentRoundValue when teams are loaded
  useEffect(() => {
    if (teams.length > 0) {
      setCurrentRoundValue(getMaxRoundNumber());
    }
  }, [teams]);

  // Generic function to get winners from any round
  const getRoundWinners = async (roundNumber: number) => {
    let roundFixture: RoundFixture | null = null;

    if (roundNumber === 1) {
      roundFixture = fixture?.rounds?.[0] || null;
    } else {
      roundFixture = additionalRounds[roundNumber - 2] || null;
    }

    if (!roundFixture || !roundFixture.matches) return [];

    const winners: { teamId: number; teamName: string; isActual: boolean }[] = [];

    if (roundFixture.type === "KNOCKOUT") {
      for (const match of roundFixture.matches) {
        if (match.winnerTeamId) {
          winners.push({
            teamId: match.winnerTeamId,
            teamName: match.winnerTeamName!,
            isActual: true,
          });
        } else {
          const dummyTeamName = `Winner of ${match.team1Name} vs ${match.team2Name || "TBD"}`;
          const dummyTeam = await createDummyTeam(dummyTeamName);
          if (dummyTeam) {
            winners.push({
              teamId: dummyTeam.teamId,
              teamName: dummyTeam.teamName,
              isActual: false,
            });
          }
        }
      }
    } else { // ROUND_ROBIN or other types
      const allTeams = new Set<string>();
      roundFixture.matches.forEach((match) => {
        if (match.team1Name) allTeams.add(match.team1Name);
        if (match.team2Name) allTeams.add(match.team2Name);
      });

      const teamArray = Array.from(allTeams);
      const bestHalf = Math.ceil(teamArray.length / 2);
      const roundRobinWinners = teamArray.slice(0, bestHalf);

      for (let i = 0; i < roundRobinWinners.length; i++) {
        const dummyTeamName = `Round ${roundNumber} Winner ${i + 1}`;
        const dummyTeam = await createDummyTeam(dummyTeamName);
        if (dummyTeam) {
          winners.push({
            teamId: dummyTeam.teamId,
            teamName: dummyTeam.teamName,
            isActual: false,
          });
        }
      }
    }

    return winners;
  };

  const createDummyTeam = async (teamName: string) => {
    if (!selectedTournament || !userProfile) return null;

    const sport = captainSports.find(s => s.name === selectedTournament.sportName);
    if (!sport) {
      setError("Could not find sport to create dummy team.");
      return null;
    }

    const dummyTeamData = {
      teamName: teamName,
      sportId: sport.sportId,
      tournamentId: selectedTournament.tournamentId,
      createdById: userProfile.userId,
    };

    try {
      console.log("[fixture] Creating dummy team:", dummyTeamData);
      const result = await makeAuthenticatedRequest<{ team: Team }>(
        "/api/teams/dummy",
        {
          method: "POST",
          body: JSON.stringify(dummyTeamData),
        }
      );

      if (result.data && result.data.team) {
        console.log("[fixture] Dummy team created:", result.data.team);
        return result.data.team;
      } else {
        setError("Failed to create dummy team.");
        console.error("Dummy team creation error:", result.error);
        return null;
      }
    } catch (error) {
      setError("Error creating dummy team.");
      console.error("Dummy team creation exception:", error);
      return null;
    }
  };

  // Generic function to generate any round
  const generateNextRound = async (roundNumber: number) => {
    const winners = await getRoundWinners(roundNumber - 1);
    if (winners.length < 2) {
      setError(
        `Need at least 2 winners to generate ${getUIRoundName(roundNumber)}`
      );
      return;
    }

    setLoading(true);
    const roundName = getRoundName(roundNumber, winners.length);
    const roundValue = getRoundValue(roundNumber);

    try {
      // Create the round data structure
      const roundData = {
        roundValue: roundValue,
        roundName: roundName,
        type: selectedRoundType,
      };

      console.log(
        `[fixture] Creating round ${roundNumber}: POST /api/tournaments/${selectedTournament!.tournamentId}/rounds/value/${roundValue}`
      );
      
      const result = await makeAuthenticatedRequest<RoundFixture>(
        `/api/tournaments/${selectedTournament!.tournamentId}/rounds/value/${roundValue}`,
        {
          method: 'POST',
          body: JSON.stringify(roundData),
        }
      );
      
      if (result.data) {
        // Reload all rounds to get the updated state
        await loadAllRounds();
        setShowRoundModal(null);
        alert(`${getUIRoundName(roundNumber)} generated successfully!`);
      } else {
        throw new Error(`Failed to create ${getUIRoundName(roundNumber)}`);
      }
    } catch (error) {
      setError(`Error generating ${getUIRoundName(roundNumber)}`);
      console.error("Generate round error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Regenerate a specific round and delete all subsequent rounds
  const regenerateRound = async (roundNumber: number) => {
    if (roundNumber === 1) {
      // For Round 1, use the regenerateFirstRound function
      await regenerateFirstRound();
      return;
    }

    const winners = await getRoundWinners(roundNumber - 1);
    if (winners.length < 2) {
      setError(
        `Need at least 2 winners to regenerate ${getUIRoundName(roundNumber)}`
      );
      return;
    }

    setLoading(true);

    try {
      const roundValue = getRoundValue(roundNumber);
      const maxRounds = getMaxRoundNumber();
      
      // Delete all rounds from this round onwards
      for (let rNum = roundNumber; rNum <= maxRounds; rNum++) {
        const rValue = getRoundValue(rNum);
        try {
          console.log(
            `[fixture] Deleting round ${rNum}: DELETE /api/tournaments/${selectedTournament!.tournamentId}/rounds/value/${rValue}`
          );
          await makeAuthenticatedRequest(
            `/api/tournaments/${selectedTournament!.tournamentId}/rounds/value/${rValue}`,
            { method: 'DELETE' }
          );
        } catch {
          // Continue even if delete fails (round might not exist)
        }
      }

      // Create the new round
      const roundData = {
        roundValue: roundValue,
        roundName: getRoundName(roundNumber, winners.length),
        type: regenerateRoundType,
      };

      console.log(
        `[fixture] Creating new round ${roundNumber}: POST /api/tournaments/${selectedTournament!.tournamentId}/rounds/value/${roundValue}`
      );
      
      const result = await makeAuthenticatedRequest<RoundFixture>(
        `/api/tournaments/${selectedTournament!.tournamentId}/rounds/value/${roundValue}`,
        {
          method: 'POST',
          body: JSON.stringify(roundData),
        }
      );
      
      if (result.data) {
        // Reload all rounds to get the updated state
        await loadAllRounds();
        setShowRegenerateRoundModal(null);
        alert(`${getUIRoundName(roundNumber)} regenerated successfully! All subsequent rounds have been deleted.`);
      } else {
        throw new Error(`Failed to regenerate ${getUIRoundName(roundNumber)}`);
      }
    } catch (error) {
      setError(`Error regenerating ${getUIRoundName(roundNumber)}`);
      console.error("Regenerate round error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getRoundName = (roundNumber: number, teamCount: number) => {
    // teamCount represents the number of teams IN this round (not advancing to next round)
    // Special cases for finals
    if (teamCount === 2) return "Final";
    if (teamCount === 4) return "Semi Final";
    if (teamCount === 8) return "Quarter Final";

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
        round.matches.forEach((match) => {
          allTeams.add(match.team1Name);
          if (match.team2Name !== "BYE") {
            allTeams.add(match.team2Name);
          }
        });
        return getRoundName(1, allTeams.size);
      }
      return "First Round";
    }

    // This part can't be async, so we'll just show a generic name if we don't have the fixture.
    // The actual round name will be correct when generated.
    // const winners = await getRoundWinners(roundNumber - 1);
    // if (winners.length > 0) {
    //   return getRoundName(roundNumber, winners.length);
    // }

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
  
    const teamCount = teams.length;
    let maxRounds = Math.ceil(Math.log2(teamCount));
    if(teamCount<2)maxRounds=1;
    console.log(`Team Count ${teamCount} and max rounds: ${maxRounds}`)
    return maxRounds;
    
  };

  // Map a UI roundNumber (1-based) to a descending roundValue so that
  // round 1 has the highest value and later rounds decrease by 1.
  // Uses the dynamically computed maximum rounds from team count.
  const getRoundValue = (roundNumber: number) => {
    const maxRounds = getMaxRoundNumber();
    // roundNumber 1 => value = maxRounds, roundNumber = maxRounds => value = 1
    const value = maxRounds - (roundNumber - 1);
    return Math.max(1, Math.round(value));
  };

  // Fetch user profile and tournaments filtered by captain's sports
  const fetchUserProfileAndTournaments = async () => {
    try {
      // First, fetch user profile
      console.log("[fixture] Fetching user profile: GET /api/users/profile");
      const userResult = await makeAuthenticatedRequest<User>(
        "/api/users/profile"
      );
      console.log("[fixture] User profile response:", userResult);
      if (userResult.error) {
        setError(userResult.error);
        return;
      }

      if (!userResult.data) {
        setError("Failed to fetch user profile");
        return;
      }

      setUserProfile(userResult.data);

      // Then fetch sports managed by this captain
      console.log(
        `[fixture] Fetching captain sports: GET /api/sports/captain/${userResult.data.userId}`
      );
      const sportsResult = await makeAuthenticatedRequest<Sport[]>(
        `/api/sports/captain/${userResult.data.userId}`
      );
      console.log("[fixture] Captain sports response:", sportsResult);
      if (sportsResult.error) {
        setError(sportsResult.error);
        return;
      }

      if (!sportsResult.data) {
        setError("Failed to fetch captain sports");
        return;
      }

      setCaptainSports(sportsResult.data);

      // If captain has no sports, show empty tournaments
      if (sportsResult.data.length === 0) {
        setTournaments([]);
        return;
      }

      // Fetch all tournaments and filter by captain's sports
      console.log("[fixture] Fetching tournaments: GET /api/tournaments");
      const tournamentsResult = await makeAuthenticatedRequest<Tournament[]>(
        "/api/tournaments"
      );
      console.log("[fixture] Tournaments response:", tournamentsResult);
      if (tournamentsResult.error) {
        setError(tournamentsResult.error);
        return;
      }

      if (!tournamentsResult.data) {
        setError("Failed to fetch tournaments");
        return;
      }

      // Filter tournaments to only include those from sports this captain manages
      const captainSportNames = sportsResult.data.map((sport) => sport.name);
      const filteredTournaments = tournamentsResult.data.filter((tournament) =>
        captainSportNames.includes(tournament.sportName)
      );

      setTournaments(filteredTournaments);

      // Check if there's a tournamentId in the query params and pre-select it
      const tournamentIdParam = searchParams.get("tournamentId");
      if (tournamentIdParam) {
        const tournamentId = parseInt(tournamentIdParam);
        const tournamentToSelect = filteredTournaments.find(
          (t) => t.tournamentId === tournamentId
        );
        if (tournamentToSelect) {
          setSelectedTournament(tournamentToSelect);
        }
      }
    } catch {
      setError("Error fetching tournaments");
    }
  };

  const fetchTeams = async (tournamentId: number) => {
    try {
      console.log(
        `[fixture] Fetching teams: GET /api/teams/tournament/${tournamentId}`
      );
      const result = await makeAuthenticatedRequest<Team[]>(
        `/api/teams/tournament/${tournamentId}`
      );
      console.log("[fixture] Teams response:", result);
      if (result.data) {
        setTeams(result.data);
      }
    } catch {
      // best-effort; do not block UI
    }
  };

  const checkRoundExists = async (tournamentId: number, roundValue: number) => {
    try {
      console.log(
        `[fixture] Checking existing round: GET /api/tournaments/${tournamentId}/rounds/value/${roundValue}`
      );
      const result = await makeAuthenticatedRequest<RoundFixture>(
        `/api/tournaments/${tournamentId}/rounds/value/${roundValue}`
      );
      console.log("[fixture] Existing round response:", result);
      return !!(result.data && result.data.matches && result.data.matches.length > 0);
    } catch {
      return false;
    }
  };

  const checkFixtureExists = async (tournamentId: number) => {
    try {
      // Check if the first round exists
      const exists = await checkRoundExists(tournamentId, getMaxRoundNumber());
      setFixtureExists(exists);
    } catch {
      setFixtureExists(false);
    }
  };

  const loadRound = async (roundValue: number) => {
    if (!selectedTournament) return null;

    try {
      console.log(
        `[fixture] Loading round: GET /api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
      );
      const result = await makeAuthenticatedRequest<RoundFixture>(
        `/api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
      );
      console.log("[fixture] Round response:", result);
      
      if (result.data && result.data.matches && result.data.matches.length > 0) {
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadAllRounds = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      const maxRounds = getMaxRoundNumber();
      const loadedRounds: RoundFixture[] = [];
      
      // Load all existing rounds
      for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
        const roundValue = roundNum;
        const roundData = await loadRound(roundValue);
        if (roundData) {
          loadedRounds.push({ ...roundData, roundValue });
        } else {
          break; // Stop loading if a round doesn't exist
        }
      }

      if (loadedRounds.length > 0) {
        // Set the first round as the main fixture
        const firstRound = loadedRounds[0];
        const mockFixture: Fixture = {
          tournamentId: selectedTournament.tournamentId,
          tournamentName: selectedTournament.name,
          sportName: selectedTournament.sportName,
          rounds: [firstRound],
        };
        
        setFixture(mockFixture);
        setAdditionalRounds(loadedRounds.slice(1)); // Store additional rounds
        setShowFixture(true);
      } else {
        setError("No rounds found for this tournament");
      }
    } catch {
      setError("Error loading rounds");
    } finally {
      setLoading(false);
    }
  };

  const generateFirstRound = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      const roundValue = 1; // Get round value for first round
      
      // Create the round data structure
      const roundData = {
        roundValue: roundValue,
        roundName: getRoundName(1, teams.length),
        type: selectedType,
      };
      console.log(roundData);

      // First check if the round already exists
      console.log(
        `[fixture] Checking if first round exists: GET /api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
      );
      
      const existingRoundResult = await makeAuthenticatedRequest<RoundFixture>(
        `/api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
      );
      console.log(`Exisiting round Values: ${existingRoundResult.data}`);
      let result;
      if (existingRoundResult.data) {
        // Round exists, update it with PUT request
        console.log(
          `[fixture] Updating existing first round: PUT /api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
        );
        
        result = await makeAuthenticatedRequest<RoundFixture>(
          `/api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`,
          {
            method: 'PUT',
            body: JSON.stringify(roundData),
          }
        );
      } else {
        // Round doesn't exist, create it with POST request
        console.log(
          `[fixture] Creating first round: POST /api/tournaments/${selectedTournament.tournamentId}/rounds/`
        );
        
        result = await makeAuthenticatedRequest<RoundFixture>(
          `/api/tournaments/${selectedTournament.tournamentId}/rounds`,
          {
            method: 'POST',
            body: JSON.stringify(roundData),
          }
        );
      }
      getMaxRoundNumber();
      
      console.log("[fixture] Round operation result:", result);

      if (result.data) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadAllRounds();
        setFixtureExists(true);
        setShowGenerateModal(false);
        const actionText = existingRoundResult.data ? "updated" : "generated";
        alert(
          `First round ${actionText} successfully with ${selectedType} format!`
        );
      } else {
        throw new Error(`Failed to ${existingRoundResult.data ? "update" : "create"} first round`);
      }
    } catch (error) {
      setError("Error generating first round");
      console.error("Generate first round error:", error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateFirstRound = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);

    try {
      const roundValue = getRoundValue(1); // Get round value for first round
      
      // Delete the existing first round
      console.log(
        `[fixture] Deleting existing first round: DELETE /api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
      );
      
      await makeAuthenticatedRequest(
        `/api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`,
        { method: 'DELETE' }
      );

      // Create new first round
      const roundData = {
        roundValue: roundValue,
        roundName: getRoundName(1, teams.length),
        type: selectedType,
      };

      console.log(
        `[fixture] Creating new first round: POST /api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
      );
      
      const result = await makeAuthenticatedRequest<RoundFixture>(
        `/api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`,
        {
          method: 'POST',
          body: JSON.stringify(roundData),
        }
      );
      
      if (result.data) {
        // Clear additional rounds since they need to be regenerated
        setAdditionalRounds([]);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadAllRounds();
        setShowRegenerateModal(false);
        alert(
          `First round regenerated successfully with ${selectedType} format!`
        );
      } else {
        throw new Error("Failed to regenerate first round");
      }
    } catch (error) {
      setError("Error regenerating first round");
      console.error("Regenerate first round error:", error);
    } finally {
      setLoading(false);
    }
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

  // Render a single round component
  const RoundCard = ({ roundFixture, roundNumber }: { roundFixture: RoundFixture, roundNumber: number }) => {
    const [winners, setWinners] = useState<{ teamId: number; teamName: string; isActual: boolean; }[]>([]);
    const [isLoadingWinners, setIsLoadingWinners] = useState(true);

    useEffect(() => {
      const fetchWinners = async () => {
        setIsLoadingWinners(true);
        const fetchedWinners = await getRoundWinners(roundNumber);
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

    const canGenerateNextRound = winners.length >= 2;
    const nextRoundNumber = roundNumber + 1;
    const nextRoundValue = getRoundValue(nextRoundNumber);
    const nextUIRoundName = getUIRoundName(nextRoundNumber);

    return (
      <div
        key={roundFixture.roundId || `round-${roundNumber}`}
        className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden"
      >
        <div
          className={`p-4 bg-gradient-to-r ${headerColors[colorIndex]} text-white flex justify-between items-center`}
        >
          <h3 className="text-2xl font-bold">
            {getUIRoundName(roundNumber)}
          </h3>
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
            <button
              onClick={() => setShowRegenerateRoundModal(roundNumber)}
              className="text-white hover:text-yellow-300 transition-colors"
              title={`Regenerate ${getUIRoundName(roundNumber)}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h5M20 20v-5h-5M4 4l16 16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roundFixture.matches.map((match, index) => (
              <div
                key={match.matchId || `match-${index}`}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">
                    Match {index + 1}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full text-white ${getMatchStatusColor(
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Next Round Section */}
        {roundNumber < getMaxRoundNumber() && (
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-bold text-lg mb-2">
              Next Round: {nextUIRoundName}
            </h4>
            {isLoadingWinners ? (
              <p>Calculating winners...</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  {canGenerateNextRound
                    ? `Ready to generate with ${winners.length} teams.`
                    : `Need at least 2 teams to proceed. Found ${winners.length}.`}
                </p>
                {canGenerateNextRound && (
                  <button
                    onClick={() => setShowRoundModal(nextRoundNumber)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Generate {nextUIRoundName}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRound = (roundFixture: RoundFixture, roundNumber: number) => {
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
          <h3 className="text-2xl font-bold">
            {getUIRoundName(roundNumber)}
          </h3>
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
            <button
              onClick={() => setShowRegenerateRoundModal(roundNumber)}
              className="text-white hover:text-yellow-300 transition-colors"
              title={`Regenerate ${getUIRoundName(roundNumber)}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h5M20 20v-5h-5M4 4l16 16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roundFixture.matches.map((match, index) => (
              <div
                key={match.matchId || `match-${index}`}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">
                    Match {index + 1}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full text-white ${getMatchStatusColor(
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Next Round Section */}
        {roundNumber < getMaxRoundNumber() && (
          <div className="p-4 bg-gray-50 border-t">
            <h4 className="font-bold text-lg mb-2">
              Next Round: {getUIRoundName(roundNumber + 1)}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Click here to generate the next round.
            </p>
            <button
              onClick={() => setShowRoundModal(roundNumber + 1)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Generate {getUIRoundName(roundNumber + 1)}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6">Fixture Management</h1>

          {/* Tournament Selector */}
          <div className="mb-6 max-w-md">
            <label
              htmlFor="tournament-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Tournament
            </label>
            <select
              id="tournament-select"
              value={selectedTournament?.tournamentId || ""}
              onChange={(e) => {
                const tournament =
                  tournaments.find(
                    (t) => t.tournamentId === parseInt(e.target.value)
                  ) || null;
                setSelectedTournament(tournament);
                // Update URL without reloading page
                router.push(
                  `/captain/fixture?tournamentId=${e.target.value}`
                );
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="" disabled>
                -- Select a Tournament --
              </option>
              {tournaments.map((t) => (
                <option key={t.tournamentId} value={t.tournamentId}>
                  {t.name} ({t.sportName})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {loading && <p>Loading...</p>}

          {selectedTournament && !loading && (
            <div>
              {!fixture && !fixtureExists && (
                <div className="text-center p-8 bg-white rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">
                    No fixture generated for {selectedTournament.name}.
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Number of registered teams: {teams.length}
                  </p>
                  {teams.length >= 2 ? (
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Generate Fixture
                    </button>
                  ) : (
                    <p className="text-red-500">
                      Need at least 2 teams to generate a fixture.
                    </p>
                  )}
                </div>
              )}

              {!fixture && fixtureExists && (
                <div className="text-center p-8 bg-white rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">
                    Fixture exists for {selectedTournament.name}.
                  </h2>
                  <button
                    onClick={loadAllRounds}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Show Fixture
                  </button>
                </div>
              )}

              {fixture && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                      Fixture for {fixture.tournamentName}
                    </h2>
                    <button
                      onClick={loadAllRounds}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Refresh Fixture
                    </button>
                  </div>

                  {fixture.rounds.map((round, index) => (
                    <RoundCard
                      key={round.roundId || `round-${index}`}
                      roundFixture={round}
                      roundNumber={index + 1}
                    />
                  ))}

                  {additionalRounds.map((round, index) => (
                     <RoundCard
                      key={round.roundId || `additional-round-${index}`}
                      roundFixture={round}
                      roundNumber={fixture.rounds.length + index + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate First Round Modal */}
          {showGenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">
                  Generate First Round
                </h2>
                <p className="mb-4">
                  Select the type of fixture for the first round. This will
                  generate matches for all{" "}
                  <span className="font-bold">{teams.length}</span> registered
                  teams.
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fixture Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) =>
                      setSelectedType(e.target.value as "KNOCKOUT" | "ROUND_ROBIN")
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      generateFirstRound();
                      setShowGenerateModal(false);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regenerate First Round Modal */}
          {showRegenerateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-red-600">
                  Regenerate Fixture
                </h2>
                <p className="mb-4">
                  Are you sure you want to regenerate the entire fixture? This
                  will delete all existing rounds and matches and create a new
                  one. This action cannot be undone.
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Fixture Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) =>
                      setSelectedType(e.target.value as "KNOCKOUT" | "ROUND_ROBIN")
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowRegenerateModal(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      regenerateFirstRound();
                      setShowRegenerateModal(false);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Additional Round Modal */}
          {showRoundModal !== null && (() => {
            const roundNumber = showRoundModal;
            const uiRoundName = getUIRoundName(roundNumber);
            const winners = nextRoundWinners;

            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-4">
                    Generate {uiRoundName}
                  </h2>
                  <p className="mb-4">
                    This will generate the next round with{" "}
                    <span className="font-bold">{winners.length}</span> teams
                    advancing from the previous round.
                  </p>
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg max-h-48 overflow-y-auto">
                    <h4 className="font-semibold mb-2">Advancing Teams:</h4>
                    <ul className="list-disc list-inside text-sm">
                      {winners.map((winner, index) => (
                        <li key={index} className={!winner.isActual ? 'italic text-gray-500' : ''}>
                          {winner.teamName}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Round Type
                    </label>
                    <select
                      value={selectedRoundType}
                      onChange={(e) =>
                        setSelectedRoundType(
                          e.target.value as "KNOCKOUT" | "ROUND_ROBIN"
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="KNOCKOUT">Knockout</option>
                      <option value="ROUND_ROBIN">Round Robin</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowRoundModal(null)}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        generateNextRound(roundNumber);
                        setShowRoundModal(null);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Regenerate Round Modal */}
          {showRegenerateRoundModal !== null && (() => {
            const roundNumber = showRegenerateRoundModal;
            const uiRoundName = getUIRoundName(roundNumber);
            const winners = nextRoundWinners;

            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-4 text-red-600">
                    Regenerate {uiRoundName}
                  </h2>
                  <p className="mb-4">
                    This will delete this round and any subsequent rounds, then
                    regenerate it. This action cannot be undone.
                  </p>
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg max-h-48 overflow-y-auto">
                    <h4 className="font-semibold mb-2">Teams for new round ({winners.length}):</h4>
                    <ul className="list-disc list-inside text-sm">
                       {winners.map((winner, index) => (
                        <li key={index} className={!winner.isActual ? 'italic text-gray-500' : ''}>
                          {winner.teamName} ({winner.isActual ? 'Confirmed' : 'Projected'})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Round Type
                    </label>
                    <select
                      value={regenerateRoundType}
                      onChange={(e) =>
                        setRegenerateRoundType(
                          e.target.value as "KNOCKOUT" | "ROUND_ROBIN"
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="KNOCKOUT">Knockout</option>
                      <option value="ROUND_ROBIN">Round Robin</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowRegenerateRoundModal(null)}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        regenerateRound(roundNumber);
                        setShowRegenerateRoundModal(null);
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
}
