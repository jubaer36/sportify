'use client';

import React, { useEffect, useState } from 'react';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./hall-of-fame.css";

// --- Interfaces ---
interface Tournament {
    tournamentId: number;
    name: string;
    sportId: number;
    sportName: string;
    startDate: string;
    endDate?: string;
    championId?: number;
    championName?: string;
    runnerUpId?: number;
    runnerUpName?: string;
}

interface Sport {
    sportId: number;
    name: string;
    isTeamGame: boolean;
}

interface Team {
    teamId: number;
    teamName: string;
    logo?: string;
    members?: TeamMember[];
}

interface TeamMember {
    userId: number;
    name: string;
    profilePhoto?: string;
}

interface User {
    userId: number;
    name: string;
    profilePhoto?: string;
}

interface Winner {
    position: 1 | 2 | 3;
    id: number;
    name: string;
    isTeam: boolean;
    logo?: string;
    members?: TeamMember[];
    photo?: string;
}

// --- Sport logos mapping ---
const sportLogos: { [key: string]: string } = {
    Football: '/Photos/football_logo.png',
    Basketball: '/Photos/basketball_logo.png',
    Tennis: '/Photos/tennis_logo.png',
    Volleyball: '/Photos/volleyball_logo.png',
    'Table Tennis': '/Photos/tabletennis_logo.png',
    Carrom: '/Photos/carrom_logo.png',
    Scrabble: '/Photos/scrabble_logo.png',
    Chess: '/Photos/chess_logo.png',
    Cricket: '/Photos/cricket_logo.png',
    Badminton: '/Photos/badminton_logo.png',
};

function getSportLogo(sportName: string): string {
    const normalized = sportName.trim();
    if (sportLogos[normalized]) return sportLogos[normalized];
    const lower = normalized.toLowerCase();
    for (const [key, value] of Object.entries(sportLogos)) {
        if (key.toLowerCase() === lower) return value;
    }
    return '/Photos/logo1.png';
}

export default function HallOfFame() {
    const [sports, setSports] = useState<Sport[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const [modalTeam, setModalTeam] = useState<{ name: string; logo?: string; members: TeamMember[] } | null>(null);

    // Get available years from tournaments
    const getAvailableYears = () => {
        const years = new Set<number>();
        tournaments.forEach(tournament => {
            const year = new Date(tournament.startDate).getFullYear();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a); // Latest year first
    };

    // Fetch sports and tournaments on component mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sportsRes, tournamentsRes] = await Promise.all([
                    makeAuthenticatedRequest<Sport[]>("/api/sports"),
                    makeAuthenticatedRequest<Tournament[]>("/api/tournaments")
                ]);

                if (sportsRes.data && Array.isArray(sportsRes.data)) {
                    setSports(sportsRes.data);
                }

                if (tournamentsRes.data && Array.isArray(tournamentsRes.data)) {
                    setTournaments(tournamentsRes.data);
                    // Set current year as default
                    const currentYear = new Date().getFullYear().toString();
                    setSelectedYear(currentYear);
                }
            } catch (err) {
                setError("Failed to load data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch winners when year and sport are selected
    useEffect(() => {
        if (selectedYear && selectedSportId) {
            fetchWinners();
        } else {
            setWinners([]);
        }
    }, [selectedYear, selectedSportId, tournaments]);

    const fetchWinners = async () => {
        if (!selectedYear || !selectedSportId) return;

        setLoading(true);
        setError(null);
        setWinners([]);

        try {
            // Find tournaments for the selected year and sport
            const year = parseInt(selectedYear);
            const filteredTournaments = tournaments.filter(tournament => {
                const tournamentYear = new Date(tournament.startDate).getFullYear();
                return tournamentYear === year && tournament.sportId === selectedSportId;
            });

            if (filteredTournaments.length === 0) {
                setWinners([]);
                setLoading(false);
                return;
            }

            // Get the selected sport to determine if it's a team game
            const selectedSport = sports.find(sport => sport.sportId === selectedSportId);
            if (!selectedSport) {
                setError("Sport not found");
                setLoading(false);
                return;
            }

            const winnersData: Winner[] = [];

            // Process each tournament to get winners
            for (const tournament of filteredTournaments) {
                if (tournament.championId && tournament.championName) {
                    if (selectedSport.isTeamGame) {
                        // Fetch team members for team games
                        const teamMembersRes = await makeAuthenticatedRequest<any>(`/api/team-members/team/${tournament.championId}`);
                        const members = teamMembersRes.data?.teamMembers?.map((tm: any) => ({
                            userId: tm.userId,
                            name: tm.userName,
                            profilePhoto: tm.profilePhoto || '/Photos/profile.png'
                        })) || [];

                        winnersData.push({
                            position: 1,
                            id: tournament.championId,
                            name: tournament.championName,
                            isTeam: true,
                            logo: '/Photos/logo1.png', // Default team logo since we don't have it in tournament data
                            members: members
                        });
                    } else {
                        // For individual games, we already have the name from tournament
                        winnersData.push({
                            position: 1,
                            id: tournament.championId,
                            name: tournament.championName,
                            isTeam: false,
                            photo: '/Photos/profile.png' // Default user photo
                        });
                    }
                }

                if (tournament.runnerUpId && tournament.runnerUpName) {
                    if (selectedSport.isTeamGame) {
                        // Fetch team members for team games
                        const teamMembersRes = await makeAuthenticatedRequest<any>(`/api/team-members/team/${tournament.runnerUpId}`);
                        const members = teamMembersRes.data?.teamMembers?.map((tm: any) => ({
                            userId: tm.userId,
                            name: tm.userName,
                            profilePhoto: tm.profilePhoto || '/Photos/profile.png'
                        })) || [];

                        winnersData.push({
                            position: 2,
                            id: tournament.runnerUpId,
                            name: tournament.runnerUpName,
                            isTeam: true,
                            logo: '/Photos/logo1.png', // Default team logo
                            members: members
                        });
                    } else {
                        // For individual games, we already have the name from tournament
                        winnersData.push({
                            position: 2,
                            id: tournament.runnerUpId,
                            name: tournament.runnerUpName,
                            isTeam: false,
                            photo: '/Photos/profile.png' // Default user photo
                        });
                    }
                }
            }

            setWinners(winnersData);
        } catch (err) {
            setError("Failed to load winners. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderWinner = (winner: Winner) => {
        const positionClasses = {
            1: 'first-place',
            2: 'second-place',
            3: 'third-place'
        };

        const medals = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };

        const openMembersModal = () => {
            if (!winner.isTeam) return;
            setModalTeam({
                name: winner.name,
                logo: winner.logo,
                members: winner.members || []
            });
            setMembersModalOpen(true);
        };

        return (
            <div key={`${winner.position}-${winner.id}`} className={`winner-card ${positionClasses[winner.position]}`}>
                <div className="medal">{medals[winner.position]}</div>
                <div className="winner-content">
                    {winner.isTeam ? (
                        // Team display
                        <div className="team-winner">
                            <button type="button" className="team-header" onClick={openMembersModal} aria-haspopup="dialog">
                                <img
                                    src={winner.logo || '/Photos/logo1.png'}
                                    alt={winner.name}
                                    className="team-logo"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/Photos/logo1.png';
                                    }}
                                />
                                <h3 className="winner-name">{winner.name}</h3>
                                <span className="expand-indicator">View players</span>
                            </button>
                            {/* Members shown in modal now */}
                        </div>
                    ) : (
                        // Individual player display
                        <div className="player-winner">
                            <img
                                src={winner.photo || '/Photos/profile.png'}
                                alt={winner.name}
                                className="player-photo"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/Photos/profile.png';
                                }}
                            />
                            <h3 className="winner-name">{winner.name}</h3>
                        </div>
                    )}
                </div>
                <div className="position-number">{winner.position}</div>
            </div>
        );
    };

    return (
        <div className="hall-of-fame-page">
            <Topbar />

            <div className="hall-of-fame-container">
                <h1 className="page-title">Hall of Fame</h1>

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-group">
                        <label htmlFor="year-select">Year:</label>
                        <select
                            id="year-select"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">-- Select Year --</option>
                            {getAvailableYears().map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="sport-select">Sport:</label>
                        <select
                            id="sport-select"
                            value={selectedSportId || ''}
                            onChange={(e) => setSelectedSportId(e.target.value ? parseInt(e.target.value) : null)}
                            className="filter-select"
                        >
                            <option value="">-- Select Sport --</option>
                            {sports.map(sport => (
                                <option key={sport.sportId} value={sport.sportId}>
                                    {sport.name} {sport.isTeamGame ? '(Team)' : '(Individual)'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Selected sport display */}
                {selectedSportId && (
                    <div className="selected-sport">
                        {(() => {
                            const sport = sports.find(s => s.sportId === selectedSportId);
                            return sport ? (
                                <div className="sport-info">
                                    <img
                                        src={getSportLogo(sport.name)}
                                        alt={sport.name}
                                        className="sport-logo"
                                    />
                                    <span className="sport-name">{sport.name} - {selectedYear}</span>
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}

                {/* Winners Display */}
                <div className="winners-section">
                    {loading ? (
                        <div className="loading-message">Loading winners...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : !selectedYear || !selectedSportId ? (
                        <div className="no-selection">
                            <p>Please select both year and sport to view the Hall of Fame</p>
                        </div>
                    ) : winners.length === 0 ? (
                        <div className="no-winners">
                            <p>No winners found for {sports.find(s => s.sportId === selectedSportId)?.name} in {selectedYear}</p>
                        </div>
                    ) : (
                        <div className="podium">
                            {/* Render winners in order: 2nd, 1st, 3rd for podium effect */}
                            <div className="podium-positions">
                                {winners.find(w => w.position === 2) && (
                                    <div className="position-container second">
                                        {renderWinner(winners.find(w => w.position === 2)!)}
                                    </div>
                                )}
                                {winners.find(w => w.position === 1) && (
                                    <div className="position-container first">
                                        {renderWinner(winners.find(w => w.position === 1)!)}
                                    </div>
                                )}
                                {winners.find(w => w.position === 3) && (
                                    <div className="position-container third">
                                        {renderWinner(winners.find(w => w.position === 3)!)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {membersModalOpen && modalTeam && (
                    <div className="modal-overlay" role="dialog" aria-modal="true">
                        <div className="modal">
                            <div className="modal-header">
                                <div className="modal-title">
                                    <img
                                        src={modalTeam.logo || '/Photos/logo1.png'}
                                        alt={modalTeam.name}
                                        className="team-logo small"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/Photos/logo1.png';
                                        }}
                                    />
                                    <h3>{modalTeam.name}</h3>
                                </div>
                                <button className="modal-close" onClick={() => setMembersModalOpen(false)} aria-label="Close">
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                {modalTeam.members && modalTeam.members.length > 0 ? (
                                    <div className="team-members grid">
                                        {modalTeam.members.map(member => (
                                            <div key={member.userId} className="member">
                                                <img
                                                    src={member.profilePhoto || '/Photos/profile.png'}
                                                    alt={member.name}
                                                    className="member-photo"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/Photos/profile.png';
                                                    }}
                                                />
                                                <span className="member-name">{member.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-members">No players found for this team.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}