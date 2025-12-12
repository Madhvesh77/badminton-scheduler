/**
 * Manual test script to visualize scheduler output
 * Run with: npx ts-node src/manual-test.ts
 */

import { generateSchedule } from "./scheduler";

console.log("=".repeat(80));
console.log("BADMINTON SCHEDULER - Manual Test");
console.log("=".repeat(80));

// Test Case 1: 8 players, 2 courts, doubles
console.log("\n🏸 Test Case: 8 players, 2 courts, doubles\n");

const players8 = ["Mad", "Mar", "Pri", "Vasu", "Shy", "Suri", "Md", "Anish"];
const { rounds: rounds8 } = generateSchedule(players8, 2, "doubles");

// Track team usage
const teamUsage = new Map<string, number[]>();

for (let i = 0; i < Math.min(10, rounds8.length); i++) {
  const round = rounds8[i];
  console.log(`\nRound ${i + 1}:`);
  console.log("-".repeat(60));

  round.matches.forEach((match, idx) => {
    const teamA = match.teamA.join(" + ");
    const teamB = match.teamB.join(" + ");
    console.log(`  Match ${idx + 1}: ${teamA} vs ${teamB}`);

    // Track teams
    const teamAKey = [...match.teamA].sort().join(",");
    const teamBKey = [...match.teamB].sort().join(",");

    if (!teamUsage.has(teamAKey)) teamUsage.set(teamAKey, []);
    if (!teamUsage.has(teamBKey)) teamUsage.set(teamBKey, []);

    teamUsage.get(teamAKey)!.push(i + 1);
    teamUsage.get(teamBKey)!.push(i + 1);
  });

  if (round.resting.length > 0) {
    console.log(`  Resting: ${round.resting.join(", ")}`);
  }
}

console.log("\n" + "=".repeat(80));
console.log("TEAM USAGE ANALYSIS (First 10 rounds)");
console.log("=".repeat(80));

// Sort teams by first appearance
const sortedTeams = Array.from(teamUsage.entries()).sort((a, b) => {
  return a[1][0] - b[1][0];
});

let teamsUsedOnce = 0;
let teamsUsedMultiple = 0;

for (const [team, rounds] of sortedTeams) {
  const usageStr =
    rounds.length === 1
      ? "✓ (fresh)"
      : `⚠ ${rounds.length}x (rounds: ${rounds.join(", ")})`;
  console.log(`  ${team.padEnd(20)} ${usageStr}`);

  if (rounds.length === 1) teamsUsedOnce++;
  else teamsUsedMultiple++;
}

console.log("\n" + "-".repeat(80));
console.log(`Teams used once: ${teamsUsedOnce}`);
console.log(`Teams used multiple times: ${teamsUsedMultiple}`);
console.log(`Total unique teams: ${teamUsage.size}`);
console.log(`Total possible teams (C(8,2)): 28`);

// Test Case 2: 7 players, 2 courts, doubles
console.log("\n\n" + "=".repeat(80));
console.log("🏸 Test Case: 7 players, 2 courts, doubles\n");

const players7 = ["Mad", "Mar", "Pri", "Vasu", "Shy", "Suri", "Md"];
const { rounds: rounds7 } = generateSchedule(players7, 2, "doubles");

for (let i = 0; i < Math.min(8, rounds7.length); i++) {
  const round = rounds7[i];
  console.log(`\nRound ${i + 1}:`);
  console.log("-".repeat(60));

  round.matches.forEach((match, idx) => {
    const teamA = match.teamA.join(" + ");
    const teamB = match.teamB.join(" + ");
    console.log(`  Match ${idx + 1}: ${teamA} vs ${teamB}`);
  });

  if (round.resting.length > 0) {
    console.log(`  Resting: ${round.resting.join(", ")}`);
  }
}

// Test Case 3: CRITICAL - 5 players, 1 court, doubles
console.log("\n\n" + "=".repeat(80));
console.log("🏸 CRITICAL TEST: 5 players, 1 court, doubles\n");

const players5 = ["A", "B", "C", "D", "E"];
const { rounds: rounds5 } = generateSchedule(players5, 1, "doubles");

console.log("This is the edge case where 4 play and 1 rests each round.");
console.log("Testing that no player rests for 3+ consecutive rounds.\n");

// Track consecutive rests
const consecutiveRestTracker = new Map<string, number>();
const maxConsecutiveRests = new Map<string, number>();

for (const player of players5) {
  consecutiveRestTracker.set(player, 0);
  maxConsecutiveRests.set(player, 0);
}

for (let i = 0; i < Math.min(10, rounds5.length); i++) {
  const round = rounds5[i];
  console.log(`\nRound ${i + 1}:`);
  console.log("-".repeat(60));

  round.matches.forEach((match, idx) => {
    const teamA = match.teamA.join(" + ");
    const teamB = match.teamB.join(" + ");
    console.log(`  Match ${idx + 1}: ${teamA} vs ${teamB}`);
  });

  console.log(`  Resting: ${round.resting.join(", ")}`);

  // Update consecutive rest tracking
  for (const player of players5) {
    if (round.resting.includes(player)) {
      const current = consecutiveRestTracker.get(player)! + 1;
      consecutiveRestTracker.set(player, current);
      maxConsecutiveRests.set(
        player,
        Math.max(maxConsecutiveRests.get(player)!, current)
      );
    } else {
      consecutiveRestTracker.set(player, 0);
    }
  }
}

console.log("\n" + "=".repeat(80));
console.log("CONSECUTIVE REST ANALYSIS");
console.log("=".repeat(80));

for (const player of players5) {
  const maxRests = maxConsecutiveRests.get(player)!;
  const status = maxRests <= 2 ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${player}: Max consecutive rests = ${maxRests} ${status}`);
}

// Test Case 4: 10 players, 2 courts
console.log("\n\n" + "=".repeat(80));
console.log("🏸 Test Case: 10 players, 2 courts, doubles\n");

const players10 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const schedule10 = generateSchedule(players10, 2, "doubles");

console.log(`Total rounds: ${schedule10.rounds.length}`);
console.log("\n" + "=".repeat(80));
console.log("CONSECUTIVE REST ANALYSIS (10 players)");
console.log("=".repeat(80));

const maxConsecutiveRests10 = new Map<string, number>();
const consecutiveRestTracker10 = new Map<string, number>();

for (const player of players10) {
  maxConsecutiveRests10.set(player, 0);
  consecutiveRestTracker10.set(player, 0);
}

for (const round of schedule10.rounds) {
  for (const player of players10) {
    if (round.resting.includes(player)) {
      const current = consecutiveRestTracker10.get(player)! + 1;
      consecutiveRestTracker10.set(player, current);
      maxConsecutiveRests10.set(
        player,
        Math.max(maxConsecutiveRests10.get(player)!, current)
      );
    } else {
      consecutiveRestTracker10.set(player, 0);
    }
  }
}

for (const player of players10) {
  const maxRests = maxConsecutiveRests10.get(player)!;
  const status = maxRests <= 2 ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${player}: Max consecutive rests = ${maxRests} ${status}`);
}

// Test Case 5: 11 players, 2 courts
console.log("\n\n" + "=".repeat(80));
console.log("🏸 Test Case: 11 players, 2 courts, doubles\n");

const players11 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
const schedule11 = generateSchedule(players11, 2, "doubles");

console.log(`Total rounds: ${schedule11.rounds.length}`);
console.log("\n" + "=".repeat(80));
console.log("CONSECUTIVE REST ANALYSIS (11 players)");
console.log("=".repeat(80));

const maxConsecutiveRests11 = new Map<string, number>();
const consecutiveRestTracker11 = new Map<string, number>();

for (const player of players11) {
  maxConsecutiveRests11.set(player, 0);
  consecutiveRestTracker11.set(player, 0);
}

for (const round of schedule11.rounds) {
  for (const player of players11) {
    if (round.resting.includes(player)) {
      const current = consecutiveRestTracker11.get(player)! + 1;
      consecutiveRestTracker11.set(player, current);
      maxConsecutiveRests11.set(
        player,
        Math.max(maxConsecutiveRests11.get(player)!, current)
      );
    } else {
      consecutiveRestTracker11.set(player, 0);
    }
  }
}

for (const player of players11) {
  const maxRests = maxConsecutiveRests11.get(player)!;
  const status = maxRests <= 2 ? "✅ PASS" : "❌ FAIL";
  console.log(`  ${player}: Max consecutive rests = ${maxRests} ${status}`);
}

console.log("\n" + "=".repeat(80));
console.log("Done!");
console.log("=".repeat(80));
