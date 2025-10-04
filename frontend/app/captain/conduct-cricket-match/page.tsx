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

interface Match {
  matchId: number;
  team1Id: number;
  team2Id: number;
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
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  // Local state for cricket scores (one per team)
  const [scores, setScores] = useState<CricketScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Button toggle states
  const [canCreate, setCanCreate] = useState(true);
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

  // Add new cricket score set (only once per match)
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

    setScores([scoreA, scoreB]);
    setCanCreate(false);
    setCanComplete(true);
    setPosting(false);
  };

  // Update cricket score locally
  const updateScoreLocal = (
    idx: number,
    field: "runs" | "wickets" | "overs",
    delta: number
  ) => {
    setScores((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              [field]: Math.max(0, s[field] + delta),
            }
          : s
      )
    );
  };

  // Complete and save cricket match score
  const handleCompleteMatch = async () => {
    if (scores.length !== 2) return;
    setCompleting(true);

    // Post both team scores
    for (const score of scores) {
      await makeAuthenticatedRequest<CricketScore>(`/api/cricket-scores/create`, {
        method: "POST",
        body: JSON.stringify(score),
      });
    }

    setCanComplete(false);
    setCompleting(false);
    alert("Cricket match scores saved!");
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

        <div className="cricket-scores-section">
          {scores.map((s, idx) => {
            const team = idx === 0 ? teamA : teamB;
            return (
              <div className="cricket-score-row" key={idx}>
                <span className="team-name">{team?.teamName ?? `Team ${idx + 1}`}</span>
                <div className="score-boxes">
                  {/* Runs */}
                  <div className="score-box">
                    <span className="score-label">Runs</span>
                    <div className="score-controls">
                      <button
                        className="score-btn"
                        onClick={() => updateScoreLocal(idx, "runs", -1)}
                        disabled={s.runs <= 0}
                      >
                        -
                      </button>
                      <span className="score-value">{s.runs}</span>
                      <button
                        className="score-btn"
                        onClick={() => updateScoreLocal(idx, "runs", 1)}
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
                        onClick={() => updateScoreLocal(idx, "wickets", -1)}
                        disabled={s.wickets <= 0}
                      >
                        -
                      </button>
                      <span className="score-value">{s.wickets}</span>
                      <button
                        className="score-btn"
                        onClick={() => updateScoreLocal(idx, "wickets", 1)}
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
                        onClick={() => updateScoreLocal(idx, "overs", -1)}
                        disabled={s.overs <= 0}
                      >
                        -
                      </button>
                      <span className="score-value">{s.overs}</span>
                      <button
                        className="score-btn"
                        onClick={() => updateScoreLocal(idx, "overs", 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
      </div>
    </div>
  );
}