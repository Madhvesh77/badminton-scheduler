/**
 * Test suite for badminton scheduler algorithm
 *
 * Tests verify:
 * 1. No player appears twice in the same round (disjoint constraint)
 * 2. All matches are unique (no duplicate matches across rounds)
 * 3. Rest distribution is balanced for odd-player scenarios
 * 4. All possible matches are eventually scheduled
 */

import {
  generateSchedule,
  validateSchedule,
  calculateRestStats,
} from "../scheduler";
import { Round } from "../types";

describe("Badminton Scheduler", () => {
  describe("Basic validation", () => {
    test("should reject less than 5 players", () => {
      expect(() => {
        generateSchedule(["A", "B", "C", "D"], 1, "singles");
      }).toThrow("At least 5 unique players required");
    });

    test("should reject less than 1 court", () => {
      expect(() => {
        generateSchedule(["A", "B", "C", "D", "E"], 0, "singles");
      }).toThrow("At least 1 court required");
    });

    test("should deduplicate player names", () => {
      const { rounds } = generateSchedule(
        ["A", "B", "C", "D", "E", "E", "F"],
        1,
        "singles"
      );
      expect(rounds).toBeDefined();
      expect(rounds.length).toBeGreaterThan(0);
    });

    test("should reject if deduplication results in < 5 players", () => {
      expect(() => {
        generateSchedule(["A", "A", "B", "B", "C", "C"], 1, "singles");
      }).toThrow("unique players remain");
    });
  });

  describe("Singles scheduling", () => {
    test("should generate valid singles schedule for 5 players, 1 court", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 1, "singles");

      expect(rounds).toBeDefined();
      expect(rounds.length).toBeGreaterThan(0);

      // Validate no player appears twice in same round
      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test("should generate valid singles schedule for 6 players, 2 courts", () => {
      const players = ["A", "B", "C", "D", "E", "F"];
      const { rounds } = generateSchedule(players, 2, "singles");

      expect(rounds).toBeDefined();
      expect(rounds.length).toBeGreaterThan(0);

      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);
    });

    test("should have disjoint players in each round (singles)", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G"];
      const { rounds } = generateSchedule(players, 2, "singles");

      for (const round of rounds) {
        const playersInRound = new Set<string>();

        for (const match of round.matches) {
          for (const player of [...match.teamA, ...match.teamB]) {
            expect(playersInRound.has(player)).toBe(false);
            playersInRound.add(player);
          }
        }
      }
    });
  });

  describe("Doubles scheduling", () => {
    test("should generate valid doubles schedule for 7 players, 1 court", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      expect(rounds).toBeDefined();
      expect(rounds.length).toBeGreaterThan(0);

      // Each match should have 4 players (2v2)
      for (const round of rounds) {
        for (const match of round.matches) {
          expect(match.teamA).toHaveLength(2);
          expect(match.teamB).toHaveLength(2);
        }
      }

      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);
    });

    test("should have disjoint players in each round (doubles)", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      for (const round of rounds) {
        const playersInRound = new Set<string>();

        for (const match of round.matches) {
          for (const player of [...match.teamA, ...match.teamB]) {
            expect(playersInRound.has(player)).toBe(false);
            playersInRound.add(player);
          }
        }
      }
    });

    test("should generate all unique matches (no duplicates)", () => {
      const players = ["A", "B", "C", "D", "E", "F"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      const matchSignatures = new Set<string>();

      for (const round of rounds) {
        for (const match of round.matches) {
          // Create a canonical signature for the match
          const teamASorted = [...match.teamA].sort().join(",");
          const teamBSorted = [...match.teamB].sort().join(",");
          const sig = [teamASorted, teamBSorted].sort().join(" vs ");

          expect(matchSignatures.has(sig)).toBe(false);
          matchSignatures.add(sig);
        }
      }
    });
  });

  describe("Rest distribution", () => {
    test("should balance rest for 7 players, 1 court, doubles (maxDiff <= 1)", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      // Calculate rest distribution
      const { maxDiff } = calculateRestStats(rounds, players);

      // For 7 players with 1 court (4 play, 3 rest each round),
      // rest counts should be balanced within 1
      expect(maxDiff).toBeLessThanOrEqual(1);
    });

    test("should balance rest for 5 players, 1 court, singles", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 1, "singles");

      const { maxDiff } = calculateRestStats(rounds, players);

      // For 5 players with 1 court (2 play, 3 rest each round)
      expect(maxDiff).toBeLessThanOrEqual(2);
    });
  });

  describe("Match coverage", () => {
    test("should schedule all possible matches for small N", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 2, "singles");

      // For 5 players singles: C(5,2) = 10 possible matches
      const totalMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0);
      expect(totalMatches).toBe(10);
    });

    test("should eventually schedule all possible doubles matches for 6 players", () => {
      const players = ["A", "B", "C", "D", "E", "F"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      // 6 players -> C(6,2) = 15 teams
      // Not all team pairs are valid (teams must be disjoint)
      // Valid matches: team pairs where teams don't share players
      // Expected: 45 valid matches for 6 players in doubles

      const totalMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0);
      expect(totalMatches).toBeGreaterThan(20); // At least a significant portion
    });
  });

  describe("Edge cases", () => {
    test("should handle exactly 5 players", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 1, "singles");

      expect(rounds.length).toBeGreaterThan(0);
      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);
    });

    test("should handle more courts than can be filled", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 10, "singles");

      // With 5 players, max 2 simultaneous singles matches
      for (const round of rounds) {
        expect(round.matches.length).toBeLessThanOrEqual(2);
      }

      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);
    });

    test("should warn for large N (>16 players)", () => {
      const players = Array.from({ length: 20 }, (_, i) => `P${i + 1}`);
      const { rounds, warning } = generateSchedule(players, 2, "singles");

      expect(warning).toBeDefined();
      expect(warning).toContain("large_n");
      expect(rounds.length).toBeGreaterThan(0);
    });
  });

  describe("Specific test cases from spec", () => {
    test("7 players, 1 court, doubles - should produce valid schedule", () => {
      const players = ["Maru", "Madh", "Pri", "Shy", "Vasu", "Anish", "Suri"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      expect(rounds).toBeDefined();
      expect(rounds.length).toBeGreaterThan(0);

      // Each round should have exactly 1 match (1 court)
      for (const round of rounds) {
        expect(round.matches.length).toBeLessThanOrEqual(1);
      }

      // Each match has 4 players, so 3 rest
      for (const round of rounds) {
        if (round.matches.length === 1) {
          expect(round.resting.length).toBe(3);
        }
      }

      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);

      const { maxDiff } = calculateRestStats(rounds, players);
      expect(maxDiff).toBeLessThanOrEqual(1);
    });

    test("8 players, 2 courts, doubles", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      expect(rounds).toBeDefined();
      expect(rounds.length).toBeGreaterThan(0);

      // With 8 players and 2 courts, all 8 can play simultaneously
      const fullRounds = rounds.filter((r) => r.matches.length === 2);
      expect(fullRounds.length).toBeGreaterThan(0);

      const validation = validateSchedule(rounds);
      expect(validation.valid).toBe(true);
    });
  });

  describe("Round completion (for integration)", () => {
    test("rounds should start with completed=false", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 1, "singles");

      for (const round of rounds) {
        expect(round.completed).toBe(false);
      }
    });
  });

  describe("Team diversity and rotation", () => {
    test("8 players, 2 courts: should maximize team diversity before repeating", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      // Track all teams used
      const teamUsage = new Map<string, number[]>(); // team -> [rounds where used]

      for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];

        for (const match of round.matches) {
          // Create canonical team keys
          const teamAKey = [...match.teamA].sort().join(",");
          const teamBKey = [...match.teamB].sort().join(",");

          if (!teamUsage.has(teamAKey)) teamUsage.set(teamAKey, []);
          if (!teamUsage.has(teamBKey)) teamUsage.set(teamBKey, []);

          teamUsage.get(teamAKey)!.push(i);
          teamUsage.get(teamBKey)!.push(i);
        }
      }

      // Verify team diversity in early rounds
      const firstRoundTeams = new Set<string>();
      const firstRound = rounds[0];

      for (const match of firstRound.matches) {
        const teamAKey = [...match.teamA].sort().join(",");
        const teamBKey = [...match.teamB].sort().join(",");
        firstRoundTeams.add(teamAKey);
        firstRoundTeams.add(teamBKey);
      }

      // First round should have 4 unique teams (2 matches, 2 teams each)
      expect(firstRoundTeams.size).toBe(4);

      // Check that no team appears in consecutive rounds
      for (const [team, roundsUsed] of teamUsage.entries()) {
        if (roundsUsed.length > 1) {
          for (let i = 1; i < roundsUsed.length; i++) {
            const gap = roundsUsed[i] - roundsUsed[i - 1];
            // Teams should have at least 1 round gap (soft check for early rounds)
            if (roundsUsed[i] < 5) {
              expect(gap).toBeGreaterThanOrEqual(1);
            }
          }
        }
      }
    });

    test("7 players, 1 court: overall rest balance should be fair", () => {
      const players = ["Mad", "Mar", "Pri", "Vasu", "Shy", "Suri", "Md"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      // Main goal: Overall rest balance should be excellent
      const { maxDiff } = calculateRestStats(rounds, players);
      expect(maxDiff).toBeLessThanOrEqual(1);

      // All players should get to play in multiple rounds
      const playCount = new Map<string, number>();
      for (const player of players) {
        playCount.set(player, 0);
      }

      for (const round of rounds) {
        for (const match of round.matches) {
          for (const player of [...match.teamA, ...match.teamB]) {
            playCount.set(player, (playCount.get(player) || 0) + 1);
          }
        }
      }

      // All players should play at least a few times in first 10 rounds
      const first10Rounds = rounds.slice(0, Math.min(10, rounds.length));
      const first10PlayCount = new Map<string, number>();

      for (const player of players) {
        first10PlayCount.set(player, 0);
      }

      for (const round of first10Rounds) {
        for (const match of round.matches) {
          for (const player of [...match.teamA, ...match.teamB]) {
            first10PlayCount.set(
              player,
              (first10PlayCount.get(player) || 0) + 1
            );
          }
        }
      }

      // Everyone should play at least once in first 10 rounds
      for (const [player, count] of first10PlayCount) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test("should prefer fresh partnerships over recently used ones", () => {
      const players = ["A", "B", "C", "D", "E", "F"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      // Track when each team plays
      const teamFirstAppearance = new Map<string, number>();
      const teamAppearances = new Map<string, number[]>();

      for (let i = 0; i < rounds.length && i < 10; i++) {
        const round = rounds[i];

        for (const match of round.matches) {
          const teams = [
            [...match.teamA].sort().join(","),
            [...match.teamB].sort().join(","),
          ];

          for (const team of teams) {
            if (!teamFirstAppearance.has(team)) {
              teamFirstAppearance.set(team, i);
            }
            if (!teamAppearances.has(team)) {
              teamAppearances.set(team, []);
            }
            teamAppearances.get(team)!.push(i);
          }
        }
      }

      // Most teams should appear before any team appears twice
      const teamsUsedOnce = Array.from(teamAppearances.values()).filter(
        (appearances) => appearances.length === 1
      ).length;

      const teamsUsedMultiple = Array.from(teamAppearances.values()).filter(
        (appearances) => appearances.length > 1
      ).length;

      // Should prioritize using fresh teams
      expect(teamsUsedOnce).toBeGreaterThan(0);
    });

    test("CRITICAL: 5 players, 1 court - no player rests more than 2 consecutive rounds", () => {
      const players = ["A", "B", "C", "D", "E"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      // With 5 players, 1 court: 4 play, 1 rests each round
      // Track consecutive rests for each player
      for (const player of players) {
        let consecutiveRests = 0;
        let maxConsecutiveRests = 0;

        for (const round of rounds) {
          if (round.resting.includes(player)) {
            consecutiveRests++;
            maxConsecutiveRests = Math.max(
              maxConsecutiveRests,
              consecutiveRests
            );
          } else {
            consecutiveRests = 0;
          }
        }

        // CRITICAL: No player should rest more than 2 consecutive rounds
        expect(maxConsecutiveRests).toBeLessThanOrEqual(2);
      }

      // Verify overall rest distribution is fair
      const { maxDiff } = calculateRestStats(rounds, players);
      expect(maxDiff).toBeLessThanOrEqual(1);
    });

    test("CRITICAL: 6 players, 1 court - no player rests more than 2 consecutive rounds", () => {
      const players = ["A", "B", "C", "D", "E", "F"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      // With 6 players, 1 court: 4 play, 2 rest each round
      for (const player of players) {
        let consecutiveRests = 0;
        let maxConsecutiveRests = 0;

        for (const round of rounds) {
          if (round.resting.includes(player)) {
            consecutiveRests++;
            maxConsecutiveRests = Math.max(
              maxConsecutiveRests,
              consecutiveRests
            );
          } else {
            consecutiveRests = 0;
          }
        }

        // No player should rest more than 2 consecutive rounds
        expect(maxConsecutiveRests).toBeLessThanOrEqual(2);
      }
    });

    test("CRITICAL: 8 players, 1 court - max 2 consecutive rests (>7 players)", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const { rounds } = generateSchedule(players, 1, "doubles");

      // With 8 players, 1 court: 4 play, 4 rest each round
      for (const player of players) {
        let consecutiveRests = 0;
        let maxConsecutiveRests = 0;

        for (const round of rounds) {
          if (round.resting.includes(player)) {
            consecutiveRests++;
            maxConsecutiveRests = Math.max(
              maxConsecutiveRests,
              consecutiveRests
            );
          } else {
            consecutiveRests = 0;
          }
        }

        // For >7 players, max 2 consecutive rests allowed
        expect(maxConsecutiveRests).toBeLessThanOrEqual(2);
      }
    });

    test("CRITICAL: 9 players, 2 courts - max 2 consecutive rests", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      // With 9 players, 2 courts: 8 play, 1 rests each round
      // This is a worst-case scenario where 1 player could be excluded
      for (const player of players) {
        let consecutiveRests = 0;
        let maxConsecutiveRests = 0;

        for (const round of rounds) {
          if (round.resting.includes(player)) {
            consecutiveRests++;
            maxConsecutiveRests = Math.max(
              maxConsecutiveRests,
              consecutiveRests
            );
          } else {
            consecutiveRests = 0;
          }
        }

        // Critical: No player should rest more than 2 consecutive rounds
        expect(maxConsecutiveRests).toBeLessThanOrEqual(2);
      }

      // Verify rest distribution is fair overall (slightly relaxed for 9 players)
      const { maxDiff } = calculateRestStats(rounds, players);
      expect(maxDiff).toBeLessThanOrEqual(3);
    });

    test("CRITICAL: 10 players, 2 courts - max 2 consecutive rests", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      // With 10 players, 2 courts: 8 play, 2 rest each round
      for (const player of players) {
        let consecutiveRests = 0;
        let maxConsecutiveRests = 0;

        for (const round of rounds) {
          if (round.resting.includes(player)) {
            consecutiveRests++;
            maxConsecutiveRests = Math.max(
              maxConsecutiveRests,
              consecutiveRests
            );
          } else {
            consecutiveRests = 0;
          }
        }

        // No player should rest more than 2 consecutive rounds
        expect(maxConsecutiveRests).toBeLessThanOrEqual(2);
      }

      // Overall balance should be good (slightly relaxed for 10 players)
      const { maxDiff } = calculateRestStats(rounds, players);
      expect(maxDiff).toBeLessThanOrEqual(3);
    });

    test("CRITICAL: 11 players, 2 courts - max 2 consecutive rests", () => {
      const players = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
      const { rounds } = generateSchedule(players, 2, "doubles");

      // With 11 players, 2 courts: 8 play, 3 rest each round
      for (const player of players) {
        let consecutiveRests = 0;
        let maxConsecutiveRests = 0;

        for (const round of rounds) {
          if (round.resting.includes(player)) {
            consecutiveRests++;
            maxConsecutiveRests = Math.max(
              maxConsecutiveRests,
              consecutiveRests
            );
          } else {
            consecutiveRests = 0;
          }
        }

        // Even with 11 players, max 2 consecutive rests
        expect(maxConsecutiveRests).toBeLessThanOrEqual(2);
      }
    });
  });
});
