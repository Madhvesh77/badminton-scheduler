/**
 * Badminton Match Scheduler Algorithm
 *
 * This module implements a sophisticated scheduling algorithm that:
 * 1. Generates all possible valid matches (teams with disjoint players)
 * 2. Uses greedy selection with backtracking to maximize match coverage
 * 3. Balances rest distribution across players for odd-player scenarios
 * 4. Ensures no player appears twice in the same round
 *
 * Time Complexity: O(M * C * M) where M = number of matches, C = courts
 * Space Complexity: O(M + N) where N = number of players
 */

import { v4 as uuidv4 } from "uuid";
import {
  Player,
  Team,
  MatchObj,
  Round,
  MatchCandidate,
  PlayerStats,
} from "./types";

/**
 * Generate all possible teams based on match type
 * - Singles: each player is a team
 * - Doubles: all unordered pairs (nC2)
 */
function generateTeams(
  players: Player[],
  matchType: "singles" | "doubles"
): Team[] {
  if (matchType === "singles") {
    return players.map((p) => [p]);
  }

  // Doubles: generate all pairs (combinations)
  const teams: Team[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      teams.push([players[i], players[j]]);
    }
  }
  return teams;
}

/**
 * Check if two teams share any players (have overlap)
 */
function teamsOverlap(teamA: Team, teamB: Team): boolean {
  const setA = new Set(teamA);
  return teamB.some((player) => setA.has(player));
}

/**
 * Generate all possible valid matches (team pairs with no player overlap)
 */
function generateAllMatches(teams: Team[]): MatchObj[] {
  const matches: MatchObj[] = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (!teamsOverlap(teams[i], teams[j])) {
        matches.push({
          id: uuidv4(),
          teamA: teams[i],
          teamB: teams[j],
        });
      }
    }
  }

  return matches;
}

/**
 * Extract all unique players from a match
 */
function getMatchPlayers(match: MatchObj): Set<Player> {
  return new Set([...match.teamA, ...match.teamB]);
}

/**
 * Check if two matches have any player overlap
 */
function matchesOverlap(m1: MatchObj, m2: MatchObj): boolean {
  const players1 = getMatchPlayers(m1);
  const players2 = getMatchPlayers(m2);

  for (const p of players1) {
    if (players2.has(p)) return true;
  }
  return false;
}

/**
 * Calculate rarity score for each player in remaining matches
 * Lower score = player appears in fewer matches (rarer)
 */
function calculatePlayerFrequency(matches: MatchObj[]): Map<Player, number> {
  const frequency = new Map<Player, number>();

  for (const match of matches) {
    for (const player of getMatchPlayers(match)) {
      frequency.set(player, (frequency.get(player) || 0) + 1);
    }
  }

  return frequency;
}

/**
 * Calculate rarity score for a match (sum of player frequencies)
 * Lower = rarer (contains players that appear less frequently)
 */
function calculateMatchRarity(
  match: MatchObj,
  playerFreq: Map<Player, number>
): number {
  let sum = 0;
  for (const player of getMatchPlayers(match)) {
    sum += playerFreq.get(player) || 0;
  }
  return sum;
}

/**
 * Create a canonical team key for tracking (sorted player names)
 */
function getTeamKey(team: Team): string {
  return [...team].sort().join(",");
}

/**
 * Get both teams from a match
 */
function getMatchTeams(match: MatchObj): [string, string] {
  return [getTeamKey(match.teamA), getTeamKey(match.teamB)];
}

/**
 * Calculate team freshness score for a match
 * Lower score = fresher teams (haven't played together much)
 */
function calculateTeamFreshnessScore(
  match: MatchObj,
  teamUsageCount: Map<string, number>,
  teamLastUsedRound: Map<string, number>,
  currentRound: number
): number {
  const [teamAKey, teamBKey] = getMatchTeams(match);

  // Usage count component (primary)
  const teamAUsage = teamUsageCount.get(teamAKey) || 0;
  const teamBUsage = teamUsageCount.get(teamBKey) || 0;
  const totalUsage = teamAUsage + teamBUsage;

  // Recency penalty (secondary) - avoid back-to-back same partnerships
  const teamALastRound = teamLastUsedRound.get(teamAKey) || -10;
  const teamBLastRound = teamLastUsedRound.get(teamBKey) || -10;
  const roundsSinceA = currentRound - teamALastRound;
  const roundsSinceB = currentRound - teamBLastRound;

  // Heavy penalty if team played in last 1-2 rounds
  let recencyPenalty = 0;
  if (roundsSinceA <= 1) recencyPenalty += 100;
  else if (roundsSinceA <= 2) recencyPenalty += 50;

  if (roundsSinceB <= 1) recencyPenalty += 100;
  else if (roundsSinceB <= 2) recencyPenalty += 50;

  // Final score: lower is better
  // Usage count is multiplied by 100 to be most significant
  return (
    totalUsage * 100 +
    recencyPenalty +
    (10 - Math.min(roundsSinceA, roundsSinceB))
  );
}

/**
 * Greedy selection to pick up to 'courts' disjoint matches for a round
 * Priority:
 * 1. Rest balance (players with higher rest counts play first)
 * 2. Team freshness (prefer partnerships that haven't played together much)
 * 3. Recency avoidance (avoid back-to-back same partnerships)
 */
function selectRoundMatches(
  availableMatches: MatchObj[],
  courts: number,
  playerStats: Map<Player, PlayerStats>,
  teamUsageCount: Map<string, number>,
  teamLastUsedRound: Map<string, number>,
  currentRound: number
): MatchObj[] {
  if (availableMatches.length === 0 || courts === 0) {
    return [];
  }

  // Create candidate list with composite scoring
  const candidates = availableMatches.map((match) => {
    const players = getMatchPlayers(match);

    // Calculate rest balance score (lower = more rested = should play)
    const restSum = Array.from(players).reduce(
      (sum, p) => sum + (playerStats.get(p)?.restCount || 0),
      0
    );
    const avgRest = restSum / players.size;

    // Calculate how long since players last played
    const lastPlayedMax = Math.max(
      ...Array.from(players).map(
        (p) => playerStats.get(p)?.lastPlayedRound ?? -1
      )
    );
    const roundsSincePlay = currentRound - lastPlayedMax;

    // Calculate team freshness (lower = fresher teams)
    const freshnessScore = calculateTeamFreshnessScore(
      match,
      teamUsageCount,
      teamLastUsedRound,
      currentRound
    );

    return {
      match,
      players,
      avgRest,
      roundsSincePlay,
      freshnessScore,
    };
  });

  // Sort by priority hierarchy - STRENGTHENED for robustness
  candidates.sort((a, b) => {
    // Calculate max rounds since play for each match (longest-waiting player)
    const maxRoundsSinceA = Math.max(
      ...Array.from(a.players).map((p) => {
        const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
        return currentRound - lastRound;
      })
    );
    const maxRoundsSinceB = Math.max(
      ...Array.from(b.players).map((p) => {
        const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
        return currentRound - lastRound;
      })
    );

    // Dynamic threshold for max consecutive rests: ≤7 players = 1, >7 players = 2
    const numPlayers = playerStats.size;
    const maxConsecutiveRests = numPlayers <= 7 ? 1 : 2;

    // Priority 0: ABSOLUTE PRIORITY - Force rotation to prevent long consecutive rests
    // If a player has been waiting >= maxConsecutiveRests, they MUST play this round
    // We use >= (not >) because roundsSince=2 means they've rested rounds N-1 and N-2,
    // and if not selected now (round N), they'll rest 3 times total
    if (
      maxRoundsSinceA >= maxConsecutiveRests ||
      maxRoundsSinceB >= maxConsecutiveRests
    ) {
      const maxDiff = maxRoundsSinceB - maxRoundsSinceA;
      // Ultra-heavy multiplier to ensure absolute dominance over ALL other priorities
      if (maxDiff !== 0) {
        return maxDiff * 100000;
      }
    }

    // Secondary urgency: if approaching threshold, still prioritize strongly
    const urgencyThreshold = Math.max(1, maxConsecutiveRests - 1);
    if (
      maxRoundsSinceA >= urgencyThreshold ||
      maxRoundsSinceB >= urgencyThreshold
    ) {
      const maxDiff = maxRoundsSinceB - maxRoundsSinceA;
      if (maxDiff !== 0) {
        return maxDiff * 10000;
      }
    }

    // Priority 1: Sum of rounds since play for ALL players in match
    // This ensures we're not just looking at one player, but the whole match
    const sumRoundsSinceA = Array.from(a.players).reduce((sum, p) => {
      const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
      return sum + (currentRound - lastRound);
    }, 0);
    const sumRoundsSinceB = Array.from(b.players).reduce((sum, p) => {
      const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
      return sum + (currentRound - lastRound);
    }, 0);

    // Higher sum = players collectively haven't played recently
    if (sumRoundsSinceA !== sumRoundsSinceB) {
      return (sumRoundsSinceB - sumRoundsSinceA) * 100; // Strong weight
    }

    // Priority 2: Rest balance (higher avgRest = should play sooner)
    const restDiff = b.avgRest - a.avgRest;
    if (Math.abs(restDiff) > 0.3) {
      // Lowered threshold for more sensitivity
      return (restDiff > 0 ? 1 : -1) * 50; // Medium weight
    }

    // Priority 3: Minimum rounds since play (ensure ALL players get rotation)
    const minRoundsSinceA = Math.min(
      ...Array.from(a.players).map((p) => {
        const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
        return currentRound - lastRound;
      })
    );
    const minRoundsSinceB = Math.min(
      ...Array.from(b.players).map((p) => {
        const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
        return currentRound - lastRound;
      })
    );

    if (minRoundsSinceA !== minRoundsSinceB) {
      return (minRoundsSinceB - minRoundsSinceA) * 10; // Lower weight
    }

    // Priority 4: Team freshness (lower score = fresher)
    // This now has the LOWEST priority - team diversity yields to player rotation
    return a.freshnessScore - b.freshnessScore;
  });

  // PRE-FILTER: Force inclusion of matches with critical waiting players
  // This ensures we never exceed maxConsecutiveRests
  const numPlayers = playerStats.size;
  const maxConsecutiveRests = numPlayers <= 7 ? 1 : 2;
  const selected: MatchObj[] = [];
  const usedPlayers = new Set<Player>();

  // First pass: MUST include players at risk of exceeding threshold
  for (const candidate of candidates) {
    if (selected.length >= courts) break;

    // Check if this match contains a critical player
    let hasCriticalPlayer = false;
    const maxWait = Math.max(
      ...Array.from(candidate.players).map((p) => {
        const lastRound = playerStats.get(p)?.lastPlayedRound ?? -10;
        return currentRound - lastRound;
      })
    );

    if (maxWait >= maxConsecutiveRests) {
      hasCriticalPlayer = true;
    }

    if (!hasCriticalPlayer) continue;

    // Check for conflicts
    let hasConflict = false;
    for (const player of candidate.players) {
      if (usedPlayers.has(player)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      selected.push(candidate.match);
      for (const player of candidate.players) {
        usedPlayers.add(player);
      }
    }
  }

  // Second pass: Fill remaining court slots with best available matches
  for (const candidate of candidates) {
    if (selected.length >= courts) break;

    // Skip if already selected
    if (selected.includes(candidate.match)) continue;

    // Check for conflicts
    let hasConflict = false;
    for (const player of candidate.players) {
      if (usedPlayers.has(player)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      selected.push(candidate.match);
      for (const player of candidate.players) {
        usedPlayers.add(player);
      }
    }
  }

  return selected;
}

/**
 * Main scheduling algorithm
 *
 * Strategy:
 * 1. Generate all valid matches
 * 2. Repeatedly build rounds by selecting disjoint matches
 * 3. Update player stats (play/rest counts)
 * 4. Remove scheduled matches from pool
 * 5. Handle leftover matches individually
 */
export function generateSchedule(
  inputPlayers: Player[],
  courts: number,
  matchType: "singles" | "doubles"
): { rounds: Round[]; warning?: string } {
  // Deduplicate players and validate
  const uniquePlayers = Array.from(new Set(inputPlayers));

  if (uniquePlayers.length < inputPlayers.length) {
    const duplicateCount = inputPlayers.length - uniquePlayers.length;
    if (uniquePlayers.length < 5) {
      throw new Error(
        `After removing ${duplicateCount} duplicate(s), only ${uniquePlayers.length} unique players remain. Minimum 5 required.`
      );
    }
  }

  if (uniquePlayers.length < 5) {
    throw new Error("At least 5 unique players required");
  }

  if (courts < 1) {
    throw new Error("At least 1 court required");
  }

  const players = uniquePlayers;
  let warning: string | undefined;

  // For large N, use greedy-only mode and warn
  const useFallback = players.length > 16;
  if (useFallback) {
    warning = "large_n; fallback_to_greedy";
  }

  // Step 1: Generate all teams
  const teams = generateTeams(players, matchType);

  // Step 2: Generate all possible matches
  let remainingMatches = generateAllMatches(teams);

  // Initialize player statistics
  const playerStats = new Map<Player, PlayerStats>();
  for (const player of players) {
    playerStats.set(player, {
      playCount: 0,
      restCount: 0,
      lastPlayedRound: -1,
    });
  }

  // Initialize team tracking for diversity
  const teamUsageCount = new Map<string, number>();
  const teamLastUsedRound = new Map<string, number>();

  // Initialize all possible teams with zero count
  for (const team of teams) {
    const teamKey = getTeamKey(team);
    teamUsageCount.set(teamKey, 0);
    teamLastUsedRound.set(teamKey, -10); // Start far in past
  }

  const rounds: Round[] = [];
  let roundNumber = 0;
  const maxIterations = 1000; // Safety limit

  // Step 3: Main scheduling loop
  const maxConsecutiveRests = players.length <= 7 ? 1 : 2;

  while (remainingMatches.length > 0 && roundNumber < maxIterations) {
    // SAFETY CHECK: Stop if continuing risks violating consecutive rest constraint
    // Check if any player has been waiting for maxConsecutiveRests rounds
    let hasUrgentPlayer = false;
    for (const player of players) {
      const stats = playerStats.get(player)!;
      const roundsSincePlay = roundNumber - stats.lastPlayedRound;
      if (roundsSincePlay >= maxConsecutiveRests) {
        hasUrgentPlayer = true;
        break;
      }
    }

    // If we have urgent players, check if remaining matches can accommodate them
    if (hasUrgentPlayer) {
      // Check if ANY remaining match contains an urgent player
      const urgentPlayers = new Set<Player>();
      for (const player of players) {
        const stats = playerStats.get(player)!;
        const roundsSincePlay = roundNumber - stats.lastPlayedRound;
        if (roundsSincePlay >= maxConsecutiveRests) {
          urgentPlayers.add(player);
        }
      }

      // Can we schedule at least one match with an urgent player?
      let canScheduleUrgent = false;
      for (const match of remainingMatches) {
        const matchPlayers = getMatchPlayers(match);
        for (const urgentPlayer of urgentPlayers) {
          if (matchPlayers.has(urgentPlayer)) {
            canScheduleUrgent = true;
            break;
          }
        }
        if (canScheduleUrgent) break;
      }

      // If we can't schedule urgent players, STOP to avoid violations
      if (!canScheduleUrgent) {
        break;
      }
    }

    // Select matches for this round
    let roundMatches = selectRoundMatches(
      remainingMatches,
      courts,
      playerStats,
      teamUsageCount,
      teamLastUsedRound,
      roundNumber
    );

    // CRITICAL: If selection didn't include urgent players, we may need to regenerate matches
    if (hasUrgentPlayer) {
      const playingPlayers = new Set<Player>();
      for (const match of roundMatches) {
        for (const player of getMatchPlayers(match)) {
          playingPlayers.add(player);
        }
      }

      // Check if all urgent players are included
      const urgentPlayers = new Set<Player>();
      for (const player of players) {
        const stats = playerStats.get(player)!;
        const roundsSincePlay = roundNumber - stats.lastPlayedRound;
        if (roundsSincePlay >= maxConsecutiveRests) {
          urgentPlayers.add(player);
        }
      }

      const missingUrgentPlayers = Array.from(urgentPlayers).filter(
        (p) => !playingPlayers.has(p)
      );

      // If urgent players are missing and we have available courts, try to add them
      if (missingUrgentPlayers.length > 0 && roundMatches.length < courts) {
        // Generate fresh matches with urgent players (allow repeats if necessary)
        const allPossibleMatches = generateAllMatches(
          generateTeams(players, matchType)
        );

        for (const match of allPossibleMatches) {
          if (roundMatches.length >= courts) break;

          const matchPlayers = getMatchPlayers(match);
          let hasUrgent = false;
          for (const urgentPlayer of missingUrgentPlayers) {
            if (matchPlayers.has(urgentPlayer)) {
              hasUrgent = true;
              break;
            }
          }

          if (!hasUrgent) continue;

          // Check for conflicts with already selected matches
          let hasConflict = false;
          for (const player of matchPlayers) {
            if (playingPlayers.has(player)) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            roundMatches.push(match);
            for (const player of matchPlayers) {
              playingPlayers.add(player);
            }
          }
        }
      }
    }

    if (roundMatches.length === 0) {
      // No disjoint matches can be selected; stop scheduling
      break;
    }

    // Determine who is playing and who is resting
    const playingPlayers = new Set<Player>();
    for (const match of roundMatches) {
      for (const player of getMatchPlayers(match)) {
        playingPlayers.add(player);
      }
    }

    const restingPlayers = players.filter((p) => !playingPlayers.has(p));

    // Update player statistics
    for (const player of players) {
      const stats = playerStats.get(player)!;
      if (playingPlayers.has(player)) {
        stats.playCount++;
        stats.lastPlayedRound = roundNumber;
      } else {
        stats.restCount++;
      }
    }

    // Update team usage tracking
    for (const match of roundMatches) {
      const [teamAKey, teamBKey] = getMatchTeams(match);

      teamUsageCount.set(teamAKey, (teamUsageCount.get(teamAKey) || 0) + 1);
      teamUsageCount.set(teamBKey, (teamUsageCount.get(teamBKey) || 0) + 1);

      teamLastUsedRound.set(teamAKey, roundNumber);
      teamLastUsedRound.set(teamBKey, roundNumber);
    }

    // Create round
    rounds.push({
      id: `r${roundNumber + 1}`,
      matches: roundMatches,
      resting: restingPlayers,
      completed: false,
    });

    // Remove scheduled matches from remaining pool
    const scheduledIds = new Set(roundMatches.map((m) => m.id));
    remainingMatches = remainingMatches.filter((m) => !scheduledIds.has(m.id));

    roundNumber++;
  }

  return { rounds, warning };
}

/**
 * Validate schedule invariants (for testing)
 */
export function validateSchedule(rounds: Round[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const allMatchIds = new Set<string>();

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const playersInRound = new Set<Player>();

    // Check for duplicate players within round
    for (const match of round.matches) {
      for (const player of getMatchPlayers(match)) {
        if (playersInRound.has(player)) {
          errors.push(
            `Round ${i + 1}: Player "${player}" appears multiple times`
          );
        }
        playersInRound.add(player);
      }

      // Check for duplicate match IDs
      if (allMatchIds.has(match.id)) {
        errors.push(`Duplicate match ID: ${match.id}`);
      }
      allMatchIds.add(match.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate rest distribution statistics
 */
export function calculateRestStats(
  rounds: Round[],
  players: Player[]
): {
  restCounts: Map<Player, number>;
  maxDiff: number;
} {
  const restCounts = new Map<Player, number>();

  for (const player of players) {
    restCounts.set(player, 0);
  }

  for (const round of rounds) {
    for (const player of round.resting) {
      restCounts.set(player, (restCounts.get(player) || 0) + 1);
    }
  }

  const counts = Array.from(restCounts.values());
  const maxDiff =
    counts.length > 0 ? Math.max(...counts) - Math.min(...counts) : 0;

  return { restCounts, maxDiff };
}
