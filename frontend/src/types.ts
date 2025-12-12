/**
 * Type definitions for frontend (matching backend types)
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

export interface Schedule {
  scheduleId: string;
  rounds: Round[];
  players: string[];
  courts: number;
  matchType: "singles" | "doubles";
}
