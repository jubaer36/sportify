"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./conduct-all-match.css";

interface Tournament {
  tournamentId: number;
  name: string;
}

interface MatchDTO {
  matchId: number;
  tournamentId: number;
  tournamentName?: string;
  sportId: number;
  sportName?: string;
  team1Id: number;
  team1Name?: string;
  team2Id: number;
  team2Name?: string;
  scheduledTime?: string;
  venue?: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  winnerTeamId?: number; // Use undefined, not null
  winnerTeamName?: string;
  roundId?: number;
  roundName?: string;
  roundValue?: number;
  teamAFinalScore?: number;
  teamBFinalScore?: number;
}

interface Team {
  teamId: number;
  teamName: string;
}

interface Score {
  scoreId?: number;
  matchId: number;
  teamAId: number;
  teamAPoints: number;
  teamBId: number;
  teamBPoints: number;
}

export default function ConductAllMatchPage() {
  const searchParams = useSearchParams();

  const tournamentId = Number(searchParams.get("tournamentId"));
  const matchId = Number(searchParams.get("matchId"));

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  const [games, setGames] = useState<Score[]>([]);
  const [activeGameIdx, setActiveGameIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [canCreateNew, setCanCreateNew] = useState(true);
  const [canComplete, setCanComplete] = useState(false);
  const [canEndMatch, setCanEndMatch] = useState(false);

  // Debug log helper
  const debugLog = (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[ConductAllMatch]", ...args);
    }
  };

  // Fetch tournament, match, teams
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const tRes = await makeAuthenticatedRequest<Tournament>(
          `/api/tournaments/${tournamentId}`
        );
        debugLog("Tournament response:", tRes);
        setTournament(tRes.data ?? null);

        const mRes = await makeAuthenticatedRequest<MatchDTO>(`/api/matches/${matchId}`);
        debugLog("Match response:", mRes);
        setMatch(mRes.data ?? null);

        const teamRes = await makeAuthenticatedRequest<Team[]>(`/api/teams`);
        debugLog("Teams response:", teamRes);
        setTeams(Array.isArray(teamRes.data) ? teamRes.data : []);
      } catch (err) {
        debugLog("Error in fetchAll:", err);
      }
      setLoading(false);
    };
    if (tournamentId && matchId) fetchAll();
  }, [tournamentId, matchId]);

  useEffect(() => {
    if (match && teams.length > 0) {
      setTeamA(teams.find((t) => t.teamId === match.team1Id) ?? null);
      setTeamB(teams.find((t) => t.teamId === match.team2Id) ?? null);
    }
  }, [match, teams]);

  useEffect(() => {
    if (games.length > 0) {
      setActiveGameIdx(games.length - 1);
    }
  }, [games]);

  const handleNewGame = () => {
    if (!match || !teamA || !teamB) return;
    setPosting(true);

    const newGame: Score = {
      matchId: match.matchId,
      teamAId: teamA.teamId,
      teamAPoints: 0,
      teamBId: teamB.teamId,
      teamBPoints: 0,
    };

    setGames((prev) => [...prev, newGame]);
    setCanCreateNew(false);
    setCanComplete(true);
    setCanEndMatch(false);

    setPosting(false);
  };

  const updateScoreLocal = (idx: number, team: "A" | "B", delta: number) => {
    setGames((prev) =>
      prev.map((g, i) =>
        i === idx
          ? {
              ...g,
              teamAPoints: team === "A" ? Math.max(0, g.teamAPoints + delta) : g.teamAPoints,
              teamBPoints: team === "B" ? Math.max(0, g.teamBPoints + delta) : g.teamBPoints,
            }
          : g
      )
    );
  };

  const handleCompleteMatch = async () => {
    if (!games.length) return;
    setCompleting(true);

    const g = games[games.length - 1];

    try {
      if (g.scoreId) {
        await makeAuthenticatedRequest<Score>(`/api/scores/${g.scoreId}`, {
          method: "PUT",
          body: JSON.stringify(g),
        });
      } else {
        const created = await makeAuthenticatedRequest<Score>(`/api/scores/createSet`, {
          method: "POST",
          body: JSON.stringify(g),
        });
        g.scoreId = created.data?.scoreId;
      }

      setCanComplete(false);
      setCanCreateNew(true);
      setCanEndMatch(true);

      alert("Set completed and saved!");
    } catch (err) {
      debugLog("Error in handleCompleteMatch:", err);
      alert("Error saving set. Please try again.");
    }
    setCompleting(false);
  };

  // --- FIXED: End Match handler ---
  const handleEndMatch = async () => {
    if (!match || !teamA || !teamB || games.length === 0) return;

    let teamAWins = 0;
    let teamBWins = 0;

    games.forEach((g) => {
      if (g.teamAPoints > g.teamBPoints) teamAWins += 1;
      else if (g.teamBPoints > g.teamAPoints) teamBWins += 1;
    });

    let winnerTeamId: number | undefined = undefined;
    if (teamAWins > teamBWins) winnerTeamId = teamA.teamId;
    else if (teamBWins > teamAWins) winnerTeamId = teamB.teamId;
    // If tie, winnerTeamId stays undefined

    try {
      // 1. Fetch the full match DTO first (with authentication)
      const matchRes = await makeAuthenticatedRequest<MatchDTO>(`/api/matches/${match.matchId}`);
      debugLog("EndMatch: fetched matchRes", matchRes);

      if (!matchRes.data) {
        alert("Could not fetch match details. Please try again.");
        return;
      }
      const matchData = matchRes.data;

      // 2. Update only the necessary fields
      const updatedMatch: MatchDTO = {
        ...matchData,
        teamAFinalScore: teamAWins,
        teamBFinalScore: teamBWins,
        winnerTeamId: winnerTeamId, // undefined if tie
        status: "COMPLETED",
      };

      debugLog("EndMatch: updatedMatch payload", updatedMatch);

      // 3. Send the full object to the backend (with authentication)
      const response = await makeAuthenticatedRequest<MatchDTO>(`/api/matches/${match.matchId}`, {
        method: "PUT",
        body: JSON.stringify(updatedMatch),
      });

      debugLog("EndMatch: update response", response);

      if (response.status === 401) {
        alert("Unauthorized. Please login again.");
        return;
      }
      if (!response.data) {
        alert("Could not update match. Please try again.");
        return;
      }

      alert(
        `Match ended!\nFinal Score: ${teamA.teamName} ${teamAWins} - ${teamBWins} ${teamB.teamName}\n${
          winnerTeamId !== undefined
            ? `Winner: ${winnerTeamId === teamA.teamId ? teamA.teamName : teamB.teamName}`
            : "It's a tie!"
        }`
      );

      setCanCreateNew(false);
      setCanComplete(false);
      setCanEndMatch(false);
    } catch (err) {
      debugLog("Error in handleEndMatch:", err);
      alert("Error ending match. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="conduct-all-match-bg">
        <Topbar />
        <div className="conduct-all-match-content">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="conduct-all-match-bg">
      <Topbar />
      <div className="conduct-all-match-content">
        <h1 className="conduct-all-match-title">
          {tournament ? tournament.name : "Tournament"}
        </h1>
        <h2 className="match-heading">
          {teamA?.teamName ?? "Team A"} <span className="vs">vs</span>{" "}
          {teamB?.teamName ?? "Team B"}
        </h2>

        <div className="games-section">
          {games.map((g, idx) => (
            <div
              key={idx}
              className={`game-card${activeGameIdx === idx ? " active" : ""}`}
            >
              <div className="game-title">Game {idx + 1}</div>
              <div className="score-row">
                <div className="team-score">
                  <span className="team-name">{teamA?.teamName ?? "Team A"}</span>
                  <div className="score-box">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(idx, "A", -1)}
                      disabled={g.teamAPoints <= 0}
                    >
                      -
                    </button>
                    <span className="score-value">{g.teamAPoints}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(idx, "A", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="score-divider">:</div>
                <div className="team-score">
                  <span className="team-name">{teamB?.teamName ?? "Team B"}</span>
                  <div className="score-box">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(idx, "B", -1)}
                      disabled={g.teamBPoints <= 0}
                    >
                      -
                    </button>
                    <span className="score-value">{g.teamBPoints}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(idx, "B", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="actions-row">
          <button
            className="new-game-btn"
            onClick={handleNewGame}
            disabled={!canCreateNew || posting || !teamA || !teamB}
          >
            {posting ? "Creating..." : "New Game / Set"}
          </button>
          <button
            className="complete-btn"
            onClick={handleCompleteMatch}
            disabled={!canComplete || completing}
          >
            {completing ? "Completing..." : "Complete Set"}
          </button>
        </div>
        <div className="actions-row">
          <button
            className="end-match-btn"
            onClick={handleEndMatch}
            disabled={!canEndMatch}
            style={{
              background: "#0ea5e9",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1.1rem",
              padding: "0.9rem 2.2rem",
              borderRadius: "0.8rem",
              border: "none",
              cursor: canEndMatch ? "pointer" : "not-allowed",
              opacity: canEndMatch ? 1 : 0.6,
            }}
          >
            End Match
          </button>
        </div>
      </div>
    </div>
  );
}
