/**
 * Core type definitions for the badminton scheduler
 */

export type Player = string;
export type Team = Player[];

export interface MatchObj {
  id: string;
  teamA: Team;
  teamB: Team;
}

export interface Round {
  id: string;
  matches: MatchObj[];
  resting: Player[];
  completed: boolean;
}

export interface Schedule {
  id: string;
  players: Player[];
  courts: number;
  matchType: "singles" | "doubles";
  rounds: Round[];
}

export interface ScheduleRequest {
  players: string[];
  courts: number;
  matchType: "singles" | "doubles";
}

export interface ScheduleResponse {
  scheduleId: string;
  rounds: Round[];
  warning?: string;
}

/**
 * Internal tracking structures for the scheduler algorithm
 */
export interface PlayerStats {
  playCount: number;
  restCount: number;
  lastPlayedRound: number;
}

export interface MatchCandidate {
  match: MatchObj;
  players: Set<Player>;
  rarity: number; // Lower = rarer (players appear in fewer remaining matches)
}
