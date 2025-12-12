/**
 * Simple in-memory store with optional JSON file persistence
 * Stores schedules and allows marking rounds as completed
 */

import { Schedule } from "./types";
import * as fs from "fs";
import * as path from "path";

const STORAGE_FILE = path.join(__dirname, "../data/schedules.json");

class Store {
  private schedules: Map<string, Schedule> = new Map();

  constructor() {
    this.loadFromFile();
  }

  /**
   * Load schedules from JSON file if it exists
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = fs.readFileSync(STORAGE_FILE, "utf-8");
        const parsed = JSON.parse(data);
        this.schedules = new Map(Object.entries(parsed));
        console.log(`Loaded ${this.schedules.size} schedules from file`);
      }
    } catch (error) {
      console.warn("Could not load schedules from file:", error);
    }
  }

  /**
   * Save schedules to JSON file
   */
  private saveToFile(): void {
    try {
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.schedules);
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      console.warn("Could not save schedules to file:", error);
    }
  }

  /**
   * Store a new schedule
   */
  saveSchedule(schedule: Schedule): void {
    this.schedules.set(schedule.id, schedule);
    this.saveToFile();
  }

  /**
   * Get a schedule by ID
   */
  getSchedule(scheduleId: string): Schedule | undefined {
    return this.schedules.get(scheduleId);
  }

  /**
   * Toggle completed status of a round
   */
  toggleRoundComplete(scheduleId: string, roundId: string): Schedule | null {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return null;
    }

    const round = schedule.rounds.find((r) => r.id === roundId);
    if (!round) {
      return null;
    }

    round.completed = !round.completed;
    this.saveToFile();

    return schedule;
  }

  /**
   * Get all schedules (for debugging)
   */
  getAllSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Clear all schedules (for testing)
   */
  clear(): void {
    this.schedules.clear();
    this.saveToFile();
  }
}

// Singleton instance
export const store = new Store();
