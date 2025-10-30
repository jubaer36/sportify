"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./view-score-result.css";

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

interface Score {
  scoreId?: number;
  matchId: number;
  teamAId: number;
  teamAPoints: number;
  teamBId: number;
  teamBPoints: number;
}

export default function ViewScoreResultPage() {
  const searchParams = useSearchParams();

  const tournamentId = Number(searchParams.get("tournamentId"));
  const matchId = Number(searchParams.get("matchId"));

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [noResult, setNoResult] = useState(false);

  // Fetch tournament, match, teams, and scores
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const tRes = await makeAuthenticatedRequest<Tournament>(
          `/api/tournaments/${tournamentId}`
        );
        setTournament(tRes.data ?? null);

        const mRes = await makeAuthenticatedRequest<MatchDTO>(`/api/matches/${matchId}`);
        setMatch(mRes.data ?? null);

        const teamRes = await makeAuthenticatedRequest<Team[]>(`/api/teams`);
        setTeams(Array.isArray(teamRes.data) ? teamRes.data : []);

        // Fetch scores for this match
        const scoreRes = await makeAuthenticatedRequest<Score[]>(`/api/scores/match/${matchId}`);
        if (scoreRes.data && Array.isArray(scoreRes.data) && scoreRes.data.length > 0) {
          setScores(scoreRes.data);
          setNoResult(false);
        } else {
          setScores([]);
          setNoResult(true);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setNoResult(true);
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

  if (loading) {
    return (
      <div className="view-score-result-bg">
        <Topbar />
        <div className="view-score-result-content">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (noResult) {
    return (
      <div className="view-score-result-bg">
        <Topbar />
        <div className="view-score-result-content">
          <h1 className="view-score-result-title">
            {tournament ? tournament.name : "Tournament"}
          </h1>
          <h2 className="match-heading">
            {teamA?.teamName ?? "Team A"} <span className="vs">vs</span>{" "}
            {teamB?.teamName ?? "Team B"}
          </h2>
          <div className="no-result-message">
            <p>This match has not been conducted yet.</p>
            <p>Please check back later for results.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate set wins for each team
  let teamAWins = 0;
  let teamBWins = 0;

  scores.forEach((s) => {
    if (s.teamAPoints > s.teamBPoints) teamAWins += 1;
    else if (s.teamBPoints > s.teamAPoints) teamBWins += 1;
  });

  return (
    <div className="view-score-result-bg">
      <Topbar />
      <div className="view-score-result-content">
        <h1 className="view-score-result-title">
          {tournament ? tournament.name : "Tournament"}
        </h1>
        <h2 className="match-heading">
          {teamA?.teamName ?? "Team A"} <span className="vs">vs</span>{" "}
          {teamB?.teamName ?? "Team B"}
        </h2>

        {/* Match Status */}
        <div className="match-status">
          <span className={`status-badge ${match?.status?.toLowerCase()}`}>
            {match?.status || "UNKNOWN"}
          </span>
        </div>

        {/* Final Score */}
        <div className="final-score-section">
          <h3 className="section-heading">Final Score</h3>
          <div className="final-score-display">
            <div className="team-final-score">
              <span className="team-name-final">{teamA?.teamName ?? "Team A"}</span>
              <span className="team-score-final">{teamAWins}</span>
            </div>
            <div className="score-separator">-</div>
            <div className="team-final-score">
              <span className="team-score-final">{teamBWins}</span>
              <span className="team-name-final">{teamB?.teamName ?? "Team B"}</span>
            </div>
          </div>
          {match?.winnerTeamId && (
            <div className="winner-display">
              <span className="winner-label">Winner: </span>
              <span className="winner-name">
                {match.winnerTeamId === teamA?.teamId
                  ? teamA.teamName
                  : teamB?.teamName}
              </span>
            </div>
          )}
        </div>

        {/* Set by Set Scores */}
        <div className="games-section">
          <h3 className="section-heading">Set by Set Scores</h3>
          {scores.map((s, idx) => (
            <div key={idx} className="game-card">
              <div className="game-title">Set {idx + 1}</div>
              <div className="score-row">
                <div className="team-score">
                  <span className="team-name">{teamA?.teamName ?? "Team A"}</span>
                  <span className="score-value">{s.teamAPoints}</span>
                </div>
                <div className="score-divider">:</div>
                <div className="team-score">
                  <span className="team-name">{teamB?.teamName ?? "Team B"}</span>
                  <span className="score-value">{s.teamBPoints}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
