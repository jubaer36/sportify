// types/api.ts - API response types

export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'CAPTAIN' | 'PLAYER' | 'SCOREKEEPER';
  isActive?: boolean;
  createdOn?: string;
  updatedOn?: string;
}

export interface Tournament {
  tournamentId: number;
  name: string;
  sportId: number;
  sportName: string;
  type: 'ROUND_ROBIN' | 'KNOCKOUT';
  startDate: string;
  endDate: string;
  createdById: number;
  createdByName: string;
  championId?: number;
  championName?: string;
  runnerUpId?: number;
  runnerUpName?: string;
}

export interface Team {
  teamId: number;
  teamName: string;
  sportId: number;
  sportName: string;
  createdById: number;
  createdByName: string;
  logo?: string;
  tournamentId?: number;
}

export interface Sport {
  sportId: number;
  name: string;
  isTeamGame: boolean;
  rules?: string;
  captainId?: number;
  captainName?: string;
  recentChampionId?: number;
  recentChampionName?: string;
  recentRunnerUpId?: number;
  recentRunnerUpName?: string;
}

export interface Match {
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
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  winnerTeamId?: number;
  winnerTeamName?: string;
  round?: string;
}

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

export interface TournamentWithStatus extends Tournament {
  status: TournamentStatus;
  statusLabel: string;
}