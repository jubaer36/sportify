"use client";

import { useEffect, useState } from "react";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./conduct-match.css";

interface Tournament {
  tournamentId: number;
  name: string;
  sportId: number;
}

interface Sport {
  sportId: number;
  name: string;
}

interface Match {
  matchId: number;
  team1Id: number;
  team2Id: number;
  roundId: number;
}

interface Team {
  teamId: number;
  name: string;
}

interface Round {
  roundId: number;
  name: string;
}

export default function ConductMatchPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [roundsLoading, setRoundsLoading] = useState(false);

  // Fetch tournaments and sports on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const tRes = await makeAuthenticatedRequest<Tournament[]>("/api/tournaments");
      const sRes = await makeAuthenticatedRequest<Sport[]>("/api/sports");
      setTournaments(Array.isArray(tRes.data) ? tRes.data : []);
      setSports(Array.isArray(sRes.data) ? sRes.data : []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Fetch matches, teams, and rounds when tournament is selected
  useEffect(() => {
    if (!selectedTournamentId) {
      setMatches([]);
      setTeams([]);
      setRounds([]);
      setSelectedMatchId(null);
      return;
    }

    // Fetch matches
    const fetchMatches = async () => {
      setMatchLoading(true);
      const mRes = await makeAuthenticatedRequest<Match[]>(
        `/api/matches/tournament/${selectedTournamentId}`
      );
      setMatches(Array.isArray(mRes.data) ? mRes.data : []);
      setMatchLoading(false);
    };

    // Fetch teams for the selected tournament
    const fetchTeams = async () => {
      setTeamsLoading(true);
      const teamRes = await makeAuthenticatedRequest<Team[]>(`/api/teams/tournament/${selectedTournamentId}`);
      setTeams(Array.isArray(teamRes.data) ? teamRes.data : []);
      setTeamsLoading(false);
    };

    // Fetch rounds for the selected tournament
    const fetchRounds = async () => {
      setRoundsLoading(true);
      const roundRes = await makeAuthenticatedRequest<Round[]>(`/api/tournaments/${selectedTournamentId}/rounds`);
      setRounds(Array.isArray(roundRes.data) ? roundRes.data : []);
      setRoundsLoading(false);
    };

    fetchMatches();
    fetchTeams();
    fetchRounds();
  }, [selectedTournamentId]);

  // Helper: get sport name by sportId
  const getSportName = (sportId: number) =>
    sports.find((s) => s.sportId === sportId)?.name || "Unknown";

  // Helper: get team name by teamId
  const getTeamName = (teamId: number) =>
    teams.find((t) => t.teamId === teamId)?.name || `Team ${teamId}`;

  // Helper: get round name by roundId
  const getRoundName = (roundId: number) =>
    rounds.find((r) => r.roundId === roundId)?.name || `Round ${roundId}`;

  // Get selected tournament's sport name
  const selectedTournament = tournaments.find(
    (t) => t.tournamentId === selectedTournamentId
  );
  const selectedSportName = selectedTournament
    ? getSportName(selectedTournament.sportId)
    : "";

  // Proceed button handler
  const handleProceed = () => {
    if (!selectedTournament || !selectedMatchId) return;
    if (selectedSportName.toLowerCase() === "cricket") {
      window.location.href = "/captain/conduct-cricket-match";
    } else {
      window.location.href = "/captain/conduct-all-match";
    }
  };

  return (
    <div className="conduct-match-bg">
      <Topbar />
      <div className="conduct-match-content">
        <h1 className="conduct-match-title">Conduct Match</h1>

        {/* Tournament Selection */}
        <div className="section">
          <label htmlFor="tournament-select" className="section-label">
            Select Tournament
          </label>
          <select
            id="tournament-select"
            className="dropdown"
            value={selectedTournamentId ?? ""}
            onChange={(e) =>
              setSelectedTournamentId(
                e.target.value ? Number(e.target.value) : null
              )
            }
            disabled={loading}
          >
            <option value="">-- Select Tournament --</option>
            {tournaments.map((t) => (
              <option key={t.tournamentId} value={t.tournamentId}>
                {t.name} [{getSportName(t.sportId)}]
              </option>
            ))}
          </select>
        </div>

        {/* Match Selection */}
        {selectedTournamentId && (
          <div className="section">
            <label htmlFor="match-select" className="section-label">
              Select Match
            </label>
            <select
              id="match-select"
              className="dropdown"
              value={selectedMatchId ?? ""}
              onChange={(e) =>
                setSelectedMatchId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={matchLoading}
            >
              <option value="">-- Select Match --</option>
              {matches.map((m) => (
                <option key={m.matchId} value={m.matchId}>
                  {getTeamName(m.team1Id)} vs {getTeamName(m.team2Id)} [{getRoundName(m.roundId)}]
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Proceed Button */}
        <div className="section">
          <button
            className="proceed-btn"
            onClick={handleProceed}
            disabled={!selectedTournamentId || !selectedMatchId}
          >
            Proceed to Conduct Match
          </button>
        </div>
      </div>
    </div>
  );
}
