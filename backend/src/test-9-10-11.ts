import { generateSchedule } from "./scheduler";

function testPlayers(players: string[], courts: number) {
  console.log(`\nTesting ${players.length} players, ${courts} court(s)...\n`);

  const schedule = generateSchedule(players, courts, "doubles");

  console.log(`Total rounds: ${schedule.rounds.length}`);

  // Check consecutive rests
  const maxConsecutiveRests = new Map<string, number>();
  const currentStreak = new Map<string, number>();

  for (const player of players) {
    maxConsecutiveRests.set(player, 0);
    currentStreak.set(player, 0);
  }

  for (const round of schedule.rounds) {
    for (const player of players) {
      if (round.resting.includes(player)) {
        const streak = currentStreak.get(player)! + 1;
        currentStreak.set(player, streak);
        maxConsecutiveRests.set(
          player,
          Math.max(maxConsecutiveRests.get(player)!, streak)
        );
      } else {
        currentStreak.set(player, 0);
      }
    }
  }

  // Check rest counts
  const restCounts = new Map<string, number>();
  for (const player of players) {
    restCounts.set(player, 0);
  }

  for (const round of schedule.rounds) {
    for (const player of round.resting) {
      restCounts.set(player, restCounts.get(player)! + 1);
    }
  }

  const restValues = Array.from(restCounts.values());
  const minRest = Math.min(...restValues);
  const maxRest = Math.max(...restValues);
  const maxDiff = maxRest - minRest;

  console.log("\nConsecutive Rests:");
  for (const player of players) {
    const max = maxConsecutiveRests.get(player)!;
    console.log(`  ${player}: ${max} ${max <= 2 ? "✅" : "❌"}`);
  }

  console.log("\nOverall Rest Balance:");
  console.log(`  Min rests: ${minRest}`);
  console.log(`  Max rests: ${maxRest}`);
  console.log(`  Difference: ${maxDiff} ${maxDiff <= 2 ? "✅" : "❌"}`);

  return { maxConsecutiveRests, maxDiff };
}

testPlayers(["A", "B", "C", "D", "E", "F", "G", "H", "I"], 2);
testPlayers(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"], 2);
testPlayers(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"], 2);
