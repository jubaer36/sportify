"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./view-cricket-result.css";

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

interface CricketScore {
  cricketScoreId?: number;
  matchId: number;
  teamId: number;
  runs: number;
  wickets: number;
  overs: number;
}

export default function ViewCricketResultPage() {
  const searchParams = useSearchParams();

  const tournamentId = Number(searchParams.get("tournamentId"));
  const matchId = Number(searchParams.get("matchId"));

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  const [cricketScores, setCricketScores] = useState<CricketScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [noResult, setNoResult] = useState(false);

  // Fetch tournament, match, teams, and cricket scores
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

        // Fetch cricket scores for this match
        const scoreRes = await makeAuthenticatedRequest<CricketScore[]>(
          `/api/cricket-scores/match/${matchId}`
        );
        if (scoreRes.data && Array.isArray(scoreRes.data) && scoreRes.data.length > 0) {
          setCricketScores(scoreRes.data);
          setNoResult(false);
        } else {
          setCricketScores([]);
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
      <div className="view-cricket-result-bg">
        <Topbar />
        <div className="view-cricket-result-content">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (noResult) {
    return (
      <div className="view-cricket-result-bg">
        <Topbar />
        <div className="view-cricket-result-content">
          <h1 className="view-cricket-result-title">
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

  // Group scores by team
  const teamAScores = cricketScores.filter((s) => s.teamId === teamA?.teamId);
  const teamBScores = cricketScores.filter((s) => s.teamId === teamB?.teamId);

  // Calculate total runs for each team (sum all innings)
  const teamATotalRuns = teamAScores.reduce((sum, s) => sum + s.runs, 0);
  const teamBTotalRuns = teamBScores.reduce((sum, s) => sum + s.runs, 0);

  return (
    <div className="view-cricket-result-bg">
      <Topbar />
      <div className="view-cricket-result-content">
        <h1 className="view-cricket-result-title">
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
          <div className="cricket-final-scores">
            <div className="team-cricket-final">
              <span className="team-name-final">{teamA?.teamName ?? "Team A"}</span>
              <div className="cricket-score-summary">
                {teamAScores.map((score, idx) => (
                  <div key={idx} className="innings-summary">
                    <span className="runs">{score.runs}/{score.wickets}</span>
                    <span className="overs">({score.overs} overs)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="team-cricket-final">
              <span className="team-name-final">{teamB?.teamName ?? "Team B"}</span>
              <div className="cricket-score-summary">
                {teamBScores.map((score, idx) => (
                  <div key={idx} className="innings-summary">
                    <span className="runs">{score.runs}/{score.wickets}</span>
                    <span className="overs">({score.overs} overs)</span>
                  </div>
                ))}
              </div>
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

        {/* Detailed Scorecard */}
        <div className="scorecard-section">
          <h3 className="section-heading">Detailed Scorecard</h3>
          
          {/* Team A Scorecard */}
          <div className="team-scorecard">
            <h4 className="team-scorecard-title">{teamA?.teamName ?? "Team A"}</h4>
            {teamAScores.map((score, idx) => (
              <div key={idx} className="innings-card">
                <div className="innings-header">Innings {idx + 1}</div>
                <div className="innings-details">
                  <div className="detail-item">
                    <span className="detail-label">Runs:</span>
                    <span className="detail-value">{score.runs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Wickets:</span>
                    <span className="detail-value">{score.wickets}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Overs:</span>
                    <span className="detail-value">{score.overs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Team B Scorecard */}
          <div className="team-scorecard">
            <h4 className="team-scorecard-title">{teamB?.teamName ?? "Team B"}</h4>
            {teamBScores.map((score, idx) => (
              <div key={idx} className="innings-card">
                <div className="innings-header">Innings {idx + 1}</div>
                <div className="innings-details">
                  <div className="detail-item">
                    <span className="detail-label">Runs:</span>
                    <span className="detail-value">{score.runs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Wickets:</span>
                    <span className="detail-value">{score.wickets}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Overs:</span>
                    <span className="detail-value">{score.overs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
