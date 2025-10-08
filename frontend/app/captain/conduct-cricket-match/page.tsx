"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./conduct-cricket-match.css";

interface Tournament {
  tournamentId: number;
  name: string;
}
export interface MatchDTO {
  matchId: number;
  tournamentId: number;
  tournamentName?: string;
  sportId: number;
  sportName?: string;
  team1Id: number;
  team1Name?: string;
  team2Id: number;
  team2Name?: string;
  scheduledTime: string;
  venue: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  winnerTeamId?: number;
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

interface CricketScore {
  cricketScoreId?: number;
  matchId: number;
  teamId: number;
  runs: number;
  wickets: number;
  overs: number;
}

export default function ConductCricketMatchPage() {
  const searchParams = useSearchParams();

  const tournamentId = Number(searchParams.get("tournamentId"));
  const matchId = Number(searchParams.get("matchId"));

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  // Local state for cricket scores (one per team per set)
  const [scores, setScores] = useState<CricketScore[][]>([]); // Array of sets, each set is [teamA, teamB]
  const [activeSetIdx, setActiveSetIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Button toggle states
  const [canCreate, setCanCreate] = useState(true);
  const [canComplete, setCanComplete] = useState(false);
  const [canEndMatch, setCanEndMatch] = useState(false);

  // Debug log helper
  const debugLog = (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[ConductCricketMatch]", ...args);
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

  // Set teamA and teamB after teams and match are loaded
  useEffect(() => {
    if (match && teams.length > 0) {
      setTeamA(teams.find((t) => t.teamId === match.team1Id) ?? null);
      setTeamB(teams.find((t) => t.teamId === match.team2Id) ?? null);
    }
  }, [match, teams]);

  useEffect(() => {
    if (scores.length > 0) {
      setActiveSetIdx(scores.length - 1);
    }
  }, [scores]);

  // Add new cricket score set (only once per match, or allow multiple sets)
  const handleNewGame = () => {
    if (!match || !teamA || !teamB) return;
    setPosting(true);

    const scoreA: CricketScore = {
      matchId: match.matchId,
      teamId: teamA.teamId,
      runs: 0,
      wickets: 0,
      overs: 0,
    };
    const scoreB: CricketScore = {
      matchId: match.matchId,
      teamId: teamB.teamId,
      runs: 0,
      wickets: 0,
      overs: 0,
    };

    setScores((prev) => [...prev, [scoreA, scoreB]]);
    setCanCreate(false);
    setCanComplete(true);
    setCanEndMatch(false);
    setPosting(false);
  };

  // Update cricket score locally
  const updateScoreLocal = (
    setIdx: number,
    teamIdx: number,
    field: "runs" | "wickets" | "overs",
    delta: number
  ) => {
    setScores((prev) =>
      prev.map((set, i) =>
        i === setIdx
          ? set.map((s, j) =>
              j === teamIdx
                ? { ...s, [field]: Math.max(0, s[field] + delta) }
                : s
            )
          : set
      )
    );
  };

  // Complete and save cricket match score for current set
  const handleCompleteMatch = async () => {
    if (activeSetIdx === null || scores.length === 0) return;
    setCompleting(true);

    try {
      // Post both team scores for the current set
      for (const score of scores[activeSetIdx]) {
        await makeAuthenticatedRequest<CricketScore>(`/api/cricket-scores/create`, {
          method: "POST",
          body: JSON.stringify(score),
        });
      }

      setCanComplete(false);
      setCanCreate(true);
      setCanEndMatch(true);

      alert("Cricket match scores saved!");
    } catch (err) {
      debugLog("Error in handleCompleteMatch:", err);
      alert("Error saving set. Please try again.");
    }
    setCompleting(false);
  };

  // End match and update winner in match table
  const handleEndMatch = async () => {
    if (!match || !teamA || !teamB || scores.length === 0) return;

    // Calculate set wins for each team (by runs)
    let teamAWins = 0;
    let teamBWins = 0;

    scores.forEach((set) => {
      const [scoreA, scoreB] = set;
      if (scoreA.runs > scoreB.runs) teamAWins += 1;
      else if (scoreB.runs > scoreA.runs) teamBWins += 1;
      // If tie, no one gets a win
    });

    // Determine winner team
    let winnerTeamId: number | undefined = undefined;
    if (teamAWins > teamBWins) winnerTeamId = teamA.teamId;
    else if (teamBWins > teamAWins) winnerTeamId = teamB.teamId;

    try {
      // Fetch the full match DTO first (with authentication)
      const matchRes = await makeAuthenticatedRequest<MatchDTO>(`/api/matches/${match.matchId}`);
      debugLog("EndMatch: fetched matchRes", matchRes);

      if (!matchRes.data) {
        alert("Could not fetch match details. Please try again.");
        return;
      }
      const matchData = matchRes.data;

      // Update only the necessary fields
      const updatedMatch: MatchDTO = {
        ...matchData,
        teamAFinalScore: teamAWins,
        teamBFinalScore: teamBWins,
        winnerTeamId: winnerTeamId,
        status: "COMPLETED",
      };

      debugLog("EndMatch: updatedMatch payload", updatedMatch);

      // Send the full object to the backend (with authentication)
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

      setCanCreate(false);
      setCanComplete(false);
      setCanEndMatch(false);
    } catch (err) {
      debugLog("Error in handleEndMatch:", err);
      alert("Error ending match. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="conduct-cricket-match-bg">
        <Topbar />
        <div className="conduct-cricket-match-content">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="conduct-cricket-match-bg">
      <Topbar />
      <div className="conduct-cricket-match-content">
        <h1 className="conduct-cricket-match-title">
          {tournament ? tournament.name : "Tournament"}
        </h1>
        <h2 className="match-heading">
          {teamA?.teamName ?? "Team A"} <span className="vs">vs</span>{" "}
          {teamB?.teamName ?? "Team B"}
        </h2>

        {/* --- Team Sections --- */}
        <div className="teams-score-section" style={{ display: "flex", gap: "3rem", justifyContent: "center", marginBottom: "2rem" }}>
          {/* Team A Section */}
          <div className="team-score-section" style={{ flex: 1, background: "#f9fafb", borderRadius: "1rem", padding: "1.2rem" }}>
            <h3 style={{ color: "#0284c7", marginBottom: "1rem" }}>{teamA?.teamName ?? "Team A"}</h3>
            {scores[activeSetIdx ?? 0] && (
              <div className="score-boxes" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {/* Runs */}
                <div className="score-box">
                  <span className="score-label">Runs</span>
                  <div className="score-controls">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 0, "runs", -1)}
                      disabled={scores[activeSetIdx ?? 0][0].runs <= 0 || activeSetIdx !== scores.length - 1}
                    >
                      -
                    </button>
                    <span className="score-value">{scores[activeSetIdx ?? 0][0].runs}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 0, "runs", 1)}
                      disabled={activeSetIdx !== scores.length - 1}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Wickets */}
                <div className="score-box">
                  <span className="score-label">Wickets</span>
                  <div className="score-controls">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 0, "wickets", -1)}
                      disabled={scores[activeSetIdx ?? 0][0].wickets <= 0 || activeSetIdx !== scores.length - 1}
                    >
                      -
                    </button>
                    <span className="score-value">{scores[activeSetIdx ?? 0][0].wickets}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 0, "wickets", 1)}
                      disabled={activeSetIdx !== scores.length - 1}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Overs */}
                <div className="score-box">
                  <span className="score-label">Overs</span>
                  <div className="score-controls">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 0, "overs", -1)}
                      disabled={scores[activeSetIdx ?? 0][0].overs <= 0 || activeSetIdx !== scores.length - 1}
                    >
                      -
                    </button>
                    <span className="score-value">{scores[activeSetIdx ?? 0][0].overs}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 0, "overs", 1)}
                      disabled={activeSetIdx !== scores.length - 1}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Team B Section */}
          <div className="team-score-section" style={{ flex: 1, background: "#f9fafb", borderRadius: "1rem", padding: "1.2rem" }}>
            <h3 style={{ color: "#0284c7", marginBottom: "1rem" }}>{teamB?.teamName ?? "Team B"}</h3>
            {scores[activeSetIdx ?? 0] && (
              <div className="score-boxes" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {/* Runs */}
                <div className="score-box">
                  <span className="score-label">Runs</span>
                  <div className="score-controls">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 1, "runs", -1)}
                      disabled={scores[activeSetIdx ?? 0][1].runs <= 0 || activeSetIdx !== scores.length - 1}
                    >
                      -
                    </button>
                    <span className="score-value">{scores[activeSetIdx ?? 0][1].runs}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 1, "runs", 1)}
                      disabled={activeSetIdx !== scores.length - 1}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Wickets */}
                <div className="score-box">
                  <span className="score-label">Wickets</span>
                  <div className="score-controls">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 1, "wickets", -1)}
                      disabled={scores[activeSetIdx ?? 0][1].wickets <= 0 || activeSetIdx !== scores.length - 1}
                    >
                      -
                    </button>
                    <span className="score-value">{scores[activeSetIdx ?? 0][1].wickets}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 1, "wickets", 1)}
                      disabled={activeSetIdx !== scores.length - 1}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Overs */}
                <div className="score-box">
                  <span className="score-label">Overs</span>
                  <div className="score-controls">
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 1, "overs", -1)}
                      disabled={scores[activeSetIdx ?? 0][1].overs <= 0 || activeSetIdx !== scores.length - 1}
                    >
                      -
                    </button>
                    <span className="score-value">{scores[activeSetIdx ?? 0][1].overs}</span>
                    <button
                      className="score-btn"
                      onClick={() => updateScoreLocal(activeSetIdx ?? 0, 1, "overs", 1)}
                      disabled={activeSetIdx !== scores.length - 1}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-row">
          <button
            className="new-game-btn"
            onClick={handleNewGame}
            disabled={!canCreate || posting || !teamA || !teamB}
          >
            {posting ? "Creating..." : "New Cricket Set"}
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