"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./fixture.css";
import Sidebar from "@/Component/captain_sidebar";
import { Console } from "console";

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
  const [fixtureExistsUpTo, setFixtureExistsUpTo] = useState<number>(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [
    atLeastOneMatchCompleteInThisRound,
    setAtLeastOneMatchCompleteInThisRound,
  ] = useState(false);
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
  const [selectedCurrentRoundValue, setSelectedCurrentRoundValue] =
    useState<number>(1);
  const [nextRoundWinners, setNextRoundWinners] = useState<
    { teamId: number; teamName: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      setSelectedCurrentRoundValue(1);
      
    }
  }, [selectedTournament]);

  // Update selectedCurrentRoundValue when teams are loaded
  useEffect(() => {
    if (teams.length > 0) {
      setSelectedCurrentRoundValue(1);
    }
  }, [teams]);

  const getMatchStatusByRound = async (
    roundNumber: number,
    roundFixture: RoundFixture
  ) => {
    const status = roundFixture.matches.map(async (match, index) => {
      if (match.status === "COMPLETED") {
        setAtLeastOneMatchCompleteInThisRound(true);
      }
    });
  };

  const getRoundWinners = async (roundNumber: number) => {
    if (!selectedTournament) {
      console.error("getRoundWinners called without a selected tournament.");
      return [];
    }

    let roundFixture: RoundFixture | null = null;

    if (roundNumber === 1) {
      roundFixture = fixture?.rounds?.[0] || null;
    } else {
      roundFixture = additionalRounds[roundNumber - 2] || null;
    }
    if (roundFixture !== null) getMatchStatusByRound(roundNumber, roundFixture);
    console.log(`Fetching Winners for round: ${roundNumber}`);
    

    if (!roundFixture || !roundFixture.matches) return [];

    let winners;

    if (roundFixture.type === "KNOCKOUT") {
      winners = await getKnockOutRoundWinners(roundNumber, roundFixture);
    } else {
      winners = await getRoundRobinRoundWinners(roundNumber, roundFixture);
    }

    return winners;
  };

  const getKnockOutRoundWinners = async (
    roundNumber: number,
    roundFixture: RoundFixture
  ) => {
    // 1. Explicitly type the array of promises.
    const winnerPromises: Promise<
      Team | { teamId: number; teamName: string }
    >[] = roundFixture.matches.map(async (match, index) => {
      if (
        match.status === "COMPLETED" &&
        match.winnerTeamId &&
        match.winnerTeamName
      ) {
        // Return the actual winner
        return {
          teamId: match.winnerTeamId,
          teamName: match.winnerTeamName,
        };
      } else {
        // Fetch dummy teams from the database for this tournament and round
        try {
          if (!selectedTournament) {
            throw new Error("No tournament selected");
          }

          const result = await makeAuthenticatedRequest<Team[]>(
            `/api/teams/tournament/${selectedTournament.tournamentId}`
          );

          if (result.data) {
            // Filter for dummy teams that match the expected pattern for this match
            const dummyTeamName = `Winner Team Match ${
              index + 1
            } Round ${roundNumber}`;
            const dummyTeam = result.data.find(
              (team) => team.dummy && team.teamName === dummyTeamName
            );

            if (dummyTeam) {
              return {
                teamId: dummyTeam.teamId,
                teamName: dummyTeam.teamName,
              };
            } else {
              // Fallback: create the expected dummy team structure
              return {
                teamId: -1, // Temporary ID for unresolved matches
                teamName: dummyTeamName,
              };
            }
          } else {
            // Fallback for API error
            return {
              teamId: -1,
              teamName: `Winner Team Match ${index + 1} Round ${roundNumber}`,
            };
          }
        } catch (error) {
          console.error("Error fetching dummy teams:", error);
          // Fallback for any error
          return {
            teamId: -1,
            teamName: `Winner Team Match ${index + 1} Round ${roundNumber}`,
          };
        }
      }
    });

    try {
      // 2. Await all promises at once, outside the map.
      const winners = await Promise.all(winnerPromises);
      return winners;
    } catch (error) {
      console.error("Error resolving winners:", error);
      // Return an empty array or handle the error as needed.
      return [];
    }
  };

  const getRoundRobinRoundWinners = async (
    roundNumber: number,
    roundFixture: RoundFixture
  ) => {
    const allTeams = new Set<number>();
    roundFixture.matches.forEach((match) => {
      allTeams.add(match.team1Id);
      if (match.team2Name !== "BYE" && match.team2Id !== null) {
        allTeams.add(match.team2Id);
      }
    });

    const teamArray = Array.from(allTeams);
    const bestHalf = Math.floor(teamArray.length / 2);

    // Fetch dummy teams from the database for this tournament and round
    try {
      if (!selectedTournament) {
        throw new Error("No tournament selected");
      }

      const result = await makeAuthenticatedRequest<Team[]>(
        `/api/teams/tournament/${selectedTournament.tournamentId}`
      );

      if (result.data) {
        const dummyTeams: { teamId: number; teamName: string }[] = [];

        // Look for dummy teams that match the expected pattern for this round
        for (let i = 0; i < bestHalf; i++) {
          const dummyTeamName = `Winner Team ${i + 1} Round ${
            roundFixture.roundValue
          }`;

          const dummyTeam = result.data.find(
            (team) => team.dummy && team.teamName === dummyTeamName
          );

          if (dummyTeam) {
            dummyTeams.push({
              teamId: dummyTeam.teamId,
              teamName: dummyTeam.teamName,
            });
          } else {
            // Fallback: create the expected dummy team structure
            dummyTeams.push({
              teamId: -1, // Temporary ID for unresolved matches
              teamName: dummyTeamName,
            });
          }
        }

        return dummyTeams;
      } else {
        // Fallback for API error - create expected structures
        const fallbackTeams: { teamId: number; teamName: string }[] = [];
        for (let i = 0; i < bestHalf; i++) {
          fallbackTeams.push({
            teamId: -1,
            teamName: `Winner Team ${i + 1} Round ${roundFixture.roundValue}`,
          });
        }
        return fallbackTeams;
      }
    } catch (error) {
      console.error("Error fetching dummy teams:", error);
      // Fallback for any error
      const fallbackTeams: { teamId: number; teamName: string }[] = [];
      for (let i = 0; i < bestHalf; i++) {
        fallbackTeams.push({
          teamId: -1,
          teamName: `Winner Team ${i + 1} Round ${roundFixture.roundValue}`,
        });
      }
      return fallbackTeams;
    }
  };

  // Generic function to get winners from any round
  const setRoundWinners = async (roundNumber: number , fixture: Fixture | null) => {
    if (!selectedTournament) {
      console.error("getRoundWinners called without a selected tournament.");
      return [];
    }
    
    console.log(`Fixture exists up to round: ${fixtureExistsUpTo}`);
    console.log(`Fixture data:`, fixture);
    let roundFixture: RoundFixture | null = null;

    if (roundNumber === 1) {
      roundFixture = fixture?.rounds?.[0] || null;
    } else {
      roundFixture = additionalRounds[roundNumber - 2] || null;
    }
    console.log(`Fetching Winners for round: ${roundNumber}`);
    

    if (!roundFixture || !roundFixture.matches) return [];

    let winners;

    if (roundFixture.type === "KNOCKOUT") {
      console.log(`Fetching Knockout winners for round ${roundNumber}`);
      winners = setKnockOutRoundWinners(roundNumber, roundFixture);
    } else {
      console.log(`Fetching Round Robin winners for round ${roundNumber}`);
      winners = setRoundRobinRoundWinners(roundNumber, roundFixture);
    }

    return winners;
  };

  const setKnockOutRoundWinners = async (
    roundNumber: number,
    roundFixture: RoundFixture
  ) => {
    console.log('[setKnockOutRoundWinners] Step 1: Preparing winnerPromises for round', roundNumber, roundFixture);
    // 1. Explicitly type the array of promises.
    const winnerPromises: Promise<
      Team | { teamId: number; teamName: string }
    >[] = roundFixture.matches.map((match, index) => {
      console.log(`[setKnockOutRoundWinners] Step 2: Processing match ${index + 1}`, match);
      if (
        match.status !== "COMPLETED" ||
        !match.winnerTeamId ||
        !match.winnerTeamName
      ) {
        const dummyTeamName = `Winner Team Match ${
          index + 1
        } Round ${roundNumber}`;
        console.log(`[setKnockOutRoundWinners] Step 2a: Creating dummy team for match ${index + 1} with name`, dummyTeamName);
        // 2. Return the promise from createDummyTeam.
        return createDummyTeam(dummyTeamName).then((team) => {
          console.log(`[setKnockOutRoundWinners] Step 2a-i: Dummy team created for match ${index + 1}`, team);
          return team;
        });
      } else {
        // 3. Return a resolved promise for completed matches.
        console.log(`[setKnockOutRoundWinners] Step 2b: Match ${index + 1} completed, winner:`, {
          teamId: match.winnerTeamId,
          teamName: match.winnerTeamName,
        });
        return Promise.resolve({
          teamId: match.winnerTeamId,
          teamName: match.winnerTeamName,
        });
      }
    });

    try {
      // 4. Await all promises at once, outside the map.
      console.log('[setKnockOutRoundWinners] Step 3: Awaiting all winnerPromises...');
      const winners = await Promise.all(winnerPromises);
      console.log('[setKnockOutRoundWinners] Step 4: All winners resolved:', winners);
      return winners;
    } catch (error) {
      console.error('[setKnockOutRoundWinners] Step 5: Error resolving winners:', error);
      // Return an empty array or handle the error as needed.
      return [];
    }
  };

  const setRoundRobinRoundWinners = async (
    roundNumber: number,
    roundFixture: RoundFixture
  ) => {
    const allTeams = new Set<number>();
    roundFixture.matches.forEach((match) => {
      allTeams.add(match.team1Id);
      if (match.team2Name !== "BYE" && match.team2Id !== null) {
        allTeams.add(match.team2Id);
      }
    });

    const teamArray = Array.from(allTeams);
    const bestHalf = Math.floor(teamArray.length / 2);
    const winningTeams = teamArray.slice(0, bestHalf);

    const winnerPromises = [];
    for (let i = 0; i < winningTeams.length; i++) {
      const dummyTeamName = `Winner Team ${i + 1} Round ${
        roundFixture.roundValue
      }`;
      winnerPromises.push(createDummyTeam(dummyTeamName));
    }
    try {
      const winners = await Promise.all(winnerPromises);
      return winners.map((team) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        tournamentId: selectedTournament?.tournamentId,
      }));
    } catch (error) {
      console.error("Failed to create one or more dummy teams:", error);
      setError("Failed to create winner teams for the next round.");
      return []; // Return empty array on failure
    }
  };

  const createDummyTeam = async (teamName: string): Promise<Team> => {
    if (!selectedTournament || !userProfile) {
      throw new Error("Selected tournament or user profile is not available.");
    }
    
    const sport = captainSports.find(
      (s) => s.name === selectedTournament.sportName
    );
    if (!sport) {
      throw new Error("Sport not found for the current tournament.");
    }

    const dummyTeamData = {
      teamName: teamName,
      sportId: sport.sportId,
      tournamentId: selectedTournament.tournamentId,
      createdById: userProfile.userId,
    };
    console.log(dummyTeamData);
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

  const deleteDummyTeamsByTournamentAndRoundValue = async (
    tournamentId: number,
    roundValue: number
  ) => {
    try {
      console.log(
        `[fixture] Deleting dummy teams for tournament ${tournamentId}, round ${roundValue}: DELETE /api/teams/dummy/tournament/${tournamentId}/round/${roundValue}`
      );
      const result = await makeAuthenticatedRequest(
        `/api/teams/dummy/tournament/${tournamentId}/round/${roundValue}`,
        {
          method: "DELETE",
        }
      );
      
      if (result.error) {
        console.error("Dummy team deletion error:", result.error);
        setError(`Error deleting dummy teams: ${result.error}`);
        return;
      }
      
      console.log(
        `[fixture] Dummy teams for tournament ${tournamentId}, round ${roundValue} deleted successfully.`
      );
    } catch (error) {
      setError("Error deleting dummy teams.");
      console.error("Dummy team deletion exception:", error);
    }
  };


  

  // Helper functions
  const getRoundName = (roundNumber: number, teamCount: number) => {
    // teamCount represents the number of teams IN this round (not advancing to next round)
    // Special cases for finals
    if (teamCount === 2) return "Final";
    if (teamCount <= 4) return "Semi Final";
    if (teamCount <= 8) return "Quarter Final";

    // For other rounds, use "Round of X" format where X is the number of teams
    if (teamCount >= 16) {
      return `Round of ${Math.pow(2, Math.ceil(Math.log2(teamCount)))}`;
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


    return `Round ${roundNumber}`;
  };

 
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
    if (teamCount < 2) maxRounds = 1;
    console.log(`Team Count ${teamCount} and max rounds: ${maxRounds}`);
    return maxRounds;
  };

  const getRoundValue = (roundNumber: number) => {
    const value = roundNumber;
    return Math.max(1, Math.round(value));
  };

  // Fetch user profile and tournaments filtered by captain's sports
  const fetchUserProfileAndTournaments = async () => {
    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      console.log("[fixture] Token check:", token ? "Token exists" : "No token found");
      
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      // First, fetch user profile
      console.log("[fixture] Fetching user profile: GET /api/users/profile");
      const userResult = await makeAuthenticatedRequest<User>(
        "/api/users/profile"
      );
      console.log("[fixture] User profile response status:", userResult.status);
      console.log("[fixture] User profile response:", userResult);
      
      if (userResult.error) {
        console.error("[fixture] User profile error:", userResult.error);
        setError(`Failed to fetch user profile: ${userResult.error}`);
        return;
      }

      if (!userResult.data) {
        console.error("[fixture] No user data received");
        setError("Failed to fetch user profile - no data received");
        return;
      }

      console.log("[fixture] User profile loaded successfully:", userResult.data);
      setUserProfile(userResult.data);

      // Then fetch sports managed by this captain
      console.log(
        `[fixture] Fetching captain sports: GET /api/sports/captain/${userResult.data.userId}`
      );
      const sportsResult = await makeAuthenticatedRequest<Sport[]>(
        `/api/sports/captain/${userResult.data.userId}`
      );
      console.log("[fixture] Captain sports response status:", sportsResult.status);
      console.log("[fixture] Captain sports response:", sportsResult);
      
      if (sportsResult.error) {
        console.error("[fixture] Captain sports error:", sportsResult.error);
        setError(`Failed to fetch captain sports: ${sportsResult.error}`);
        return;
      }

      if (!sportsResult.data) {
        console.error("[fixture] No sports data received");
        setError("Failed to fetch captain sports - no data received");
        return;
      }

      setCaptainSports(sportsResult.data);

      // If captain has no sports, show empty tournaments
      if (sportsResult.data.length === 0) {
        console.log("[fixture] Captain has no sports assigned");
        setTournaments([]);
        return;
      }

      // Fetch all tournaments and filter by captain's sports
      console.log("[fixture] Fetching tournaments: GET /api/tournaments");
      const tournamentsResult = await makeAuthenticatedRequest<Tournament[]>(
        "/api/tournaments"
      );
      console.log("[fixture] Tournaments response status:", tournamentsResult.status);
      console.log("[fixture] Tournaments response:", tournamentsResult);
      
      if (tournamentsResult.error) {
        console.error("[fixture] Tournaments error:", tournamentsResult.error);
        setError(`Failed to fetch tournaments: ${tournamentsResult.error}`);
        return;
      }

      if (!tournamentsResult.data) {
        console.error("[fixture] No tournaments data received");
        setError("Failed to fetch tournaments - no data received");
        return;
      }

      // Filter tournaments to only include those from sports this captain manages
      const captainSportNames = sportsResult.data.map((sport) => sport.name);
      const filteredTournaments = tournamentsResult.data.filter((tournament) =>
        captainSportNames.includes(tournament.sportName)
      );

      console.log("[fixture] Filtered tournaments:", filteredTournaments);
      setTournaments(filteredTournaments);

      // Check if there's a tournamentId in the query params and pre-select it
      const tournamentIdParam = searchParams.get("tournamentId");
      if (tournamentIdParam) {
        const tournamentId = parseInt(tournamentIdParam);
        const tournamentToSelect = filteredTournaments.find(
          (t) => t.tournamentId === tournamentId
        );
        if (tournamentToSelect) {
          console.log("[fixture] Pre-selecting tournament from URL:", tournamentToSelect);
          setSelectedTournament(tournamentToSelect);
        }
      }
    } catch (error) {
      console.error("[fixture] Unexpected error in fetchUserProfileAndTournaments:", error);
      setError(`Error fetching tournaments: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        const actualTeams = result.data.filter((team) => !team.dummy);
        setTeams(actualTeams);
        console.log(`Total Actual Teams: ${actualTeams.length}`);
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
      return !!(
        result.data &&
        result.data.matches &&
        result.data.matches.length > 0
      );
    } catch {
      return false;
    }
  };

  const checkFixtureExists = async (tournamentId: number): Promise<number> => {
    try {
      const maxRounds = getMaxRoundNumber();
      let lastExistingRound = 0;
      let anyFixtureExists = false;
      console.log(`Checking if fixture exists for max round ${maxRounds}`);

      for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
        const roundValue = getRoundValue(roundNum);
        const exists = await checkRoundExists(tournamentId, roundValue);
        if (exists) {
          anyFixtureExists = true;
          lastExistingRound = roundNum;
        } else {
          // Stop checking if a round is missing
          break;
        }
      }

      setFixtureExists(anyFixtureExists);
      setFixtureExistsUpTo(lastExistingRound);
      console.log(
        `Fixture exists: ${anyFixtureExists}, up to round: ${lastExistingRound}`
      );
      
      return lastExistingRound;
    } catch {
      setFixtureExists(false);
      setFixtureExistsUpTo(0);
      return 0;
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

      if (
        result.data &&
        result.data.matches &&
        result.data.matches.length > 0
      ) {
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadAllRounds = async (upToRound?: number): Promise<Fixture | null> => {
    if (!selectedTournament) return null;

    setLoading(true);
    setError(null);

    try {
      
      const loadedRounds: RoundFixture[] = [];
      const roundsToLoad = upToRound !== undefined ? upToRound : fixtureExistsUpTo;

      // Load all existing rounds
      console.log(`Fixture exists up to round: ${roundsToLoad}`)
      for (let roundNum = 1; roundNum <= roundsToLoad; roundNum++) {
        const roundValue = roundNum;
        const roundData = await loadRound(roundValue);
        console.log(`Round Data: ${roundData}`);
        if (roundData) {
          loadedRounds.push({ ...roundData, roundValue });
        } else {
          break; // Stop loading if a round doesn't exist
        }
      }
      console.log(`Loaded Rounds length: ${loadedRounds.length}`);

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
        
        return mockFixture;
      } else {
        setError("No rounds found for this tournament");
        return null;
      }
    } catch {
      setError("Error loading rounds");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateNextRound = async (roundNumber:number) => {
    if (!selectedTournament) return;

    setLoading(true);
    setError(null);
    const roundsWithFixture = await checkFixtureExists(selectedTournament.tournamentId);
    console.log(`Rounds with fixture: ${roundsWithFixture}`);

    try {
      const roundValue = roundNumber; // Get round value for first round
      console.log(`Generating for round ${roundNumber}`);
      setSelectedCurrentRoundValue(roundNumber);
      let rName;
      if (roundNumber == 1) {
        rName = getRoundName(roundNumber, teams.length);
        console.log(`[generateNextRound] Step 1: Total teams: ${teams.length}`);
        console.log(`[generateNextRound] Step 1: Round name for round ${roundNumber} is`, rName);
      } else {
        // For subsequent rounds, we need to get winners from previous round
        const previousRoundWinners = await getRoundWinners(
          roundNumber - 1
        );
        rName = getRoundName(
          roundNumber,
          previousRoundWinners.length
        );
      }

      // Create the round data structure
      const roundData = {
        roundValue: roundValue,
        roundName: rName,
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
      console.log(`Exisiting round Values: ${existingRoundResult.data?.matches}`);
      let result;
      if (existingRoundResult.data) {
        // Round exists, update it with PUT request
        console.log(
          `[fixture] Updating existing first round: PUT /api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`
        );
        if (!atLeastOneMatchCompleteInThisRound || 1==1) {
          console.log(`Regenerating round as no matches are completed`);
          console.log(`Deleting dummy teams from round ${roundNumber} up to ${roundsWithFixture}`);
          for (let i = roundsWithFixture; i >= roundNumber; i--) {
            deleteDummyTeamsByTournamentAndRoundValue(selectedTournament.tournamentId, i);
            console.log(`Deleted dummy teams for round value ${i}`);
          }
          result = await makeAuthenticatedRequest<RoundFixture>(
            `/api/tournaments/${selectedTournament.tournamentId}/rounds/value/${roundValue}`,
            {
              method: "PUT",
              body: JSON.stringify(roundData),
            }
          );
        } else {
          console.log(`Regeneration not allowed as already some matches are completed`);
          setError("Cannot regenerate round as some matches are already completed");
          return; // Exit early if regeneration is not allowed
        }
      } else {
        // Round doesn't exist, create it with POST request
        console.log(
          `[fixture] Creating first round: POST /api/tournaments/${selectedTournament.tournamentId}/rounds/`
        );

        result = await makeAuthenticatedRequest<RoundFixture>(
          `/api/tournaments/${selectedTournament.tournamentId}/rounds`,
          {
            method: "POST",
            body: JSON.stringify(roundData),
          }
        );
      }
      

      console.log("[fixture] Round operation result:", result);

      if (result && result.data) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Store the new values in variables first
        const newFixtureExistsUpTo = result.data.roundValue;
        const newSelectedCurrentRoundValue = roundNumber;
        
        // Then update the state
        setFixtureExists(true);
        setShowGenerateModal(false);
        setFixtureExistsUpTo(newFixtureExistsUpTo);
        setSelectedCurrentRoundValue(newSelectedCurrentRoundValue);
        setAtLeastOneMatchCompleteInThisRound(false);
        
        // Use the local variables for logging and further operations
        console.log(`Fixture exists up to round: ${newFixtureExistsUpTo}`);
        console.log(`Selected result round value: ${result.data.roundValue}`);
        console.log(`Selected type: ${selectedType}`);
        console.log(`Result data:`, result.data);
        console.log(`Loading all rounds...`);
        
        const fixture = await loadAllRounds(newFixtureExistsUpTo);
        const actionText = existingRoundResult.data ? "updated" : "generated";
        console.log(`Setting round winners for round ${newSelectedCurrentRoundValue}...`);
        await setRoundWinners(newSelectedCurrentRoundValue , fixture);
        
        alert(
          `First round ${actionText} successfully with ${selectedType} format!`
        );

      } else {
        throw new Error(
          `Failed to ${
            existingRoundResult.data ? "update" : "create"
          } first round`
        );
      }
      
      
      
    } catch (error) {
      setError("Error generating first round");
      console.error("Generate first round error:", error);
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
  const RoundCard = ({
    roundFixture,
    roundNumber,
  }: {
    roundFixture: RoundFixture;
    roundNumber: number;
  }) => {
    const [winners, setWinners] = useState<
      { teamId: number; teamName: string }[]
    >([]);
    const [isLoadingWinners, setIsLoadingWinners] = useState(true);

    useEffect(() => {
      const fetchWinners = async () => {
        setIsLoadingWinners(true);
        const fetchedWinners = await getRoundWinners(roundNumber);
        // console.log(
        //   `Fetched Winners for Round ${roundNumber}:`,
        //   fetchedWinners
        // );
        console.log(`Number of winners: ${fetchedWinners.length}`);
        fetchedWinners.forEach((winner, index) => {
          console.log(
            `Winner ${index + 1}: ID=${winner.teamId}, Name="${
              winner.teamName
            }"`
          );
        });
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
          <h3 className="text-2xl font-bold">{getUIRoundName(roundNumber)}</h3>
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
              onClick={() => {
                setShowRegenerateRoundModal(roundNumber);
                setSelectedCurrentRoundValue(roundNumber);
                setAtLeastOneMatchCompleteInThisRound(false);
              }}
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
                  <p className="text-sm text-gray-500">Match {index + 1}</p>
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
                    onClick={() => {
                      setShowRoundModal(nextRoundNumber);
                      setSelectedCurrentRoundValue(nextRoundNumber);
                      setAtLeastOneMatchCompleteInThisRound(false);
                    }}
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
          <h3 className="text-2xl font-bold">{getUIRoundName(roundNumber)}</h3>
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
              onClick={() => {
                setShowRegenerateRoundModal(roundNumber);
                setSelectedCurrentRoundValue(roundNumber);
                setAtLeastOneMatchCompleteInThisRound(false);
              }}
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
                  <p className="text-sm text-gray-500">Match {index + 1}</p>
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
              onClick={() => {
                setShowRoundModal(roundNumber + 1);
                setSelectedCurrentRoundValue(roundNumber + 1);
                setAtLeastOneMatchCompleteInThisRound(false);
              }}
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
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
                router.push(`/captain/fixture?tournamentId=${e.target.value}`);
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
                    onClick={() => loadAllRounds()}
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
                      onClick={() => loadAllRounds()}
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
                      setSelectedType(
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
                    onClick={() => setShowGenerateModal(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      generateNextRound(1);
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
                      setSelectedType(
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
                    onClick={() => setShowRegenerateModal(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      generateNextRound(1);
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
          {showRoundModal !== null &&
            (() => {
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
                          <li key={index}>{winner.teamName}</li>
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
          {showRegenerateRoundModal !== null &&
            (() => {
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
                      This will delete this round and any subsequent rounds,
                      then regenerate it. This action cannot be undone.
                    </p>
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg max-h-48 overflow-y-auto">
                      <h4 className="font-semibold mb-2">
                        Teams for new round ({winners.length}):
                      </h4>
                      <ul className="list-disc list-inside text-sm">
                        {winners.map((winner, index) => (
                          <li key={index}>{winner.teamName}</li>
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
                          generateNextRound(roundNumber);
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
