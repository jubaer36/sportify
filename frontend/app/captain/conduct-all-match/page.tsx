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

interface Match {
  matchId: number;
  team1Id: number;
  team2Id: number;
}

interface Team {
  teamId: number;
  teamName: string;
}

interface Score {
  scoreId?: number; // optional for local sets
  matchId: number;
  teamAId: number;
  teamAPoints: number;
  teamBId: number;
  teamBPoints: number;
}

export default function ConductAllMatchPage() {
  const searchParams = useSearchParams();

  // Get tournamentId and matchId from query params
  const tournamentId = Number(searchParams.get("tournamentId"));
  const matchId = Number(searchParams.get("matchId"));

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  // Local state for sets/games
  const [games, setGames] = useState<Score[]>([]);
  const [activeGameIdx, setActiveGameIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Button toggle states
  const [canCreateNew, setCanCreateNew] = useState(true);
  const [canComplete, setCanComplete] = useState(false);

  // Fetch tournament, match, teams
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const tRes = await makeAuthenticatedRequest<Tournament>(
        `/api/tournaments/${tournamentId}`
      );
      setTournament(tRes.data ?? null);

      const mRes = await makeAuthenticatedRequest<Match>(`/api/matches/${matchId}`);
      setMatch(mRes.data ?? null);

      const teamRes = await makeAuthenticatedRequest<Team[]>(`/api/teams`);
      setTeams(Array.isArray(teamRes.data) ? teamRes.data : []);

      setLoading(false);
    };
    if (tournamentId && matchId) fetchAll();
  }, [tournamentId, matchId]);

  // Set teamA and teamB after teams and match are loaded
  useEffect(() => {
    if (match && teams.length > 0) {
      setTeamA(teams.find((t) => t.teamId === match.team1Id) ?? null);
      setTeamB(teams.find((t) => t.teamId === match.team2Id) ?? null);
    }
  }, [match, teams]);

  // Update activeGameIdx when games change
  useEffect(() => {
    if (games.length > 0) {
      setActiveGameIdx(games.length - 1);
    }
  }, [games]);

  // Add new game/set locally
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

    // After creating, disable new and enable complete
    setCanCreateNew(false);
    setCanComplete(true);

    setPosting(false);
  };

  // Update score locally
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

  // Complete one game/set
  const handleCompleteMatch = async () => {
    if (!games.length) return;
    setCompleting(true);

    const g = games[games.length - 1]; // only complete the latest game

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

    // Toggle back: disable complete, enable new game
    setCanComplete(false);
    setCanCreateNew(true);

    setCompleting(false);
    alert("Set completed and saved!");
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
      </div>
    </div>
  );
}
