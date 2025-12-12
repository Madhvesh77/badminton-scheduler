import { generateSchedule } from "./scheduler";

const players = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const schedule = generateSchedule(players, 2, "doubles");

console.log("\nAnalyzing 10 players, 2 courts\n");
console.log(`Total rounds: ${schedule.rounds.length}\n`);

// Track consecutive rests for each player
const consecutiveRests = new Map<string, number>();
const currentStreak = new Map<string, number>();

for (const player of players) {
  consecutiveRests.set(player, 0);
  currentStreak.set(player, 0);
}

for (let i = 0; i < schedule.rounds.length; i++) {
  const round = schedule.rounds[i];

  for (const player of players) {
    if (round.resting.includes(player)) {
      const streak = currentStreak.get(player)! + 1;
      currentStreak.set(player, streak);
      consecutiveRests.set(
        player,
        Math.max(consecutiveRests.get(player)!, streak)
      );

      // Log when someone hits 3 consecutive rests
      if (streak === 3) {
        console.log(
          `❌ Round ${
            i + 1
          }: Player ${player} has now rested 3 consecutive rounds (rounds ${
            i - 1
          }, ${i}, ${i + 1})`
        );
        console.log(`   Playing in round ${i + 1}:`, round.matches);
        console.log(`   Resting in round ${i + 1}:`, round.resting);
      }
    } else {
      currentStreak.set(player, 0);
    }
  }
}

console.log("\n" + "=".repeat(80));
console.log("FINAL RESULTS:");
for (const player of players) {
  const max = consecutiveRests.get(player)!;
  console.log(`${player}: ${max} consecutive rests ${max <= 2 ? "✅" : "❌"}`);
}
