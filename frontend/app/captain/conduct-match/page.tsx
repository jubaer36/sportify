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
  teamName: string;
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

  // Custom dropdown state
  const [tournamentDropdownOpen, setTournamentDropdownOpen] = useState(false);
  const [matchDropdownOpen, setMatchDropdownOpen] = useState(false);

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

    const fetchMatches = async () => {
      setMatchLoading(true);
      const mRes = await makeAuthenticatedRequest<Match[]>(`/api/matches/tournament/${selectedTournamentId}`);
      setMatches(Array.isArray(mRes.data) ? mRes.data : []);
      setMatchLoading(false);
    };

    const fetchTeams = async () => {
      setTeamsLoading(true);
      const teamRes = await makeAuthenticatedRequest<Team[]>(`/api/teams/tournament/${selectedTournamentId}`);
      setTeams(Array.isArray(teamRes.data) ? teamRes.data : []);
      setTeamsLoading(false);
    };

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
    teams.find((t) => t.teamId === teamId)?.teamName || `Team ${teamId}`;

  // Helper: get round name by roundId
  const getRoundName = (roundId: number) =>
    rounds.find((r) => r.roundId === roundId)?.name || `Round ${roundId}`;

  const selectedTournament = tournaments.find(t => t.tournamentId === selectedTournamentId);
  const selectedSportName = selectedTournament ? getSportName(selectedTournament.sportId) : "";

  const handleProceed = () => {
    if (!selectedTournament || !selectedMatchId) return;
    if (selectedSportName.toLowerCase() === "cricket") {
      window.location.href = `/captain/conduct-cricket-match?tournamentId=${selectedTournament.tournamentId}&matchId=${selectedMatchId}`;
    } else {
      window.location.href = `/captain/conduct-all-match?tournamentId=${selectedTournament.tournamentId}&matchId=${selectedMatchId}`;
    }
  };

  return (
    <div className="conduct-match-bg">
      <Topbar />
      <div className="conduct-match-content">
        <h1 className="conduct-match-title">Conduct Match</h1>

        {/* Tournament Selection */}
        <div className="section dropdown-section">
          <label className="section-label">Select Tournament</label>
          <div className="custom-dropdown">
            <div
              className="custom-dropdown-selected"
              onClick={() => setTournamentDropdownOpen(!tournamentDropdownOpen)}
            >
              {selectedTournament ? selectedTournament.name : "-- Select Tournament --"}
              <span className="arrow">{tournamentDropdownOpen ? "▲" : "▼"}</span>
            </div>
            {tournamentDropdownOpen && (
              <ul className="custom-dropdown-list">
                {tournaments.map((t) => (
                  <li
                    key={t.tournamentId}
                    className="custom-dropdown-item"
                    onClick={() => {
                      setSelectedTournamentId(t.tournamentId);
                      setTournamentDropdownOpen(false);
                    }}
                  >
                    <span className="tournament-name">{t.name}</span>
                    <span className="sport-tag">{getSportName(t.sportId)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Match Selection */}
        {selectedTournamentId && (
          <div className="section dropdown-section">
            <label className="section-label">Select Match</label>
            <div className="custom-dropdown">
              <div
                className="custom-dropdown-selected"
                onClick={() => setMatchDropdownOpen(!matchDropdownOpen)}
              >
                {selectedMatchId
                  ? (() => {
                      const match = matches.find(m => m.matchId === selectedMatchId);
                      if (!match) return "-- Select Match --";
                      return `${getTeamName(match.team1Id)} vs ${getTeamName(match.team2Id)}`;
                    })()
                  : "-- Select Match --"}
                <span className="arrow">{matchDropdownOpen ? "▲" : "▼"}</span>
              </div>
              {matchDropdownOpen && (
                <ul className="custom-dropdown-list">
                  {matches.map((m) => (
                    <li
                      key={m.matchId}
                      className="custom-dropdown-item"
                      onClick={() => {
                        setSelectedMatchId(m.matchId);
                        setMatchDropdownOpen(false);
                      }}
                    >
                      <span className="team-names">{getTeamName(m.team1Id)} vs {getTeamName(m.team2Id)}</span>
                      <span className="round-tag">{getRoundName(m.roundId)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
