/**
 * Express server for Badminton Scheduler API
 *
 * Endpoints:
 * - POST /api/schedule - Generate a new schedule
 * - GET /api/schedule/:scheduleId - Retrieve a schedule
 * - POST /api/schedule/:scheduleId/round/:roundId/complete - Toggle round completion
 */

import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { generateSchedule } from "./scheduler";
import { store } from "./store";
import { ScheduleRequest, ScheduleResponse, Schedule } from "./types";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/schedule
 * Generate a new badminton match schedule
 */
app.post("/api/schedule", (req: Request, res: Response) => {
  try {
    const { players, courts, matchType }: ScheduleRequest = req.body;

    // Validation
    if (!players || !Array.isArray(players)) {
      return res.status(400).json({
        error: "Invalid request: players must be an array of strings",
      });
    }

    if (players.length === 0) {
      return res.status(400).json({
        error: "Invalid request: at least one player required",
      });
    }

    if (typeof courts !== "number" || courts < 1) {
      return res.status(400).json({
        error: "Invalid request: courts must be a number >= 1",
      });
    }

    if (matchType !== "singles" && matchType !== "doubles") {
      return res.status(400).json({
        error: 'Invalid request: matchType must be "singles" or "doubles"',
      });
    }

    // Trim and filter empty player names
    const cleanedPlayers = players
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter((p) => p.length > 0);

    if (cleanedPlayers.length < 5) {
      return res.status(400).json({
        error: `Invalid request: at least 5 non-empty players required (got ${cleanedPlayers.length})`,
      });
    }

    // Generate schedule
    const { rounds, warning } = generateSchedule(
      cleanedPlayers,
      courts,
      matchType
    );

    // Create and store schedule
    const scheduleId = `sch_${uuidv4()}`;
    const schedule: Schedule = {
      id: scheduleId,
      players: cleanedPlayers,
      courts,
      matchType,
      rounds,
    };

    store.saveSchedule(schedule);

    // Build response
    const response: ScheduleResponse = {
      scheduleId,
      rounds,
    };

    if (warning) {
      response.warning = warning;
    }

    console.log(
      `Generated schedule ${scheduleId}: ${rounds.length} rounds, ${cleanedPlayers.length} players`
    );

    return res.status(201).json(response);
  } catch (error) {
    console.error("Error generating schedule:", error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/schedule/:scheduleId
 * Retrieve an existing schedule
 */
app.get("/api/schedule/:scheduleId", (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    const schedule = store.getSchedule(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        error: `Schedule not found: ${scheduleId}`,
      });
    }

    return res.status(200).json({
      scheduleId: schedule.id,
      rounds: schedule.rounds,
      players: schedule.players,
      courts: schedule.courts,
      matchType: schedule.matchType,
    });
  } catch (error) {
    console.error("Error retrieving schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/schedule/:scheduleId/round/:roundId/complete
 * Toggle the completed status of a round
 */
app.post(
  "/api/schedule/:scheduleId/round/:roundId/complete",
  (req: Request, res: Response) => {
    try {
      const { scheduleId, roundId } = req.params;

      const schedule = store.toggleRoundComplete(scheduleId, roundId);

      if (!schedule) {
        return res.status(404).json({
          error: `Schedule or round not found: ${scheduleId} / ${roundId}`,
        });
      }

      const round = schedule.rounds.find((r) => r.id === roundId);

      console.log(
        `Round ${roundId} marked as ${
          round?.completed ? "completed" : "incomplete"
        }`
      );

      return res.status(200).json({
        scheduleId: schedule.id,
        roundId,
        completed: round?.completed || false,
      });
    } catch (error) {
      console.error("Error toggling round completion:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Health check endpoint
 */
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Serve static files from frontend build (for production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/dist")));

  // Catch-all handler for frontend routes
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
  });
} else {
  /**
   * 404 handler (development only)
   */
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Endpoint not found" });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🏸 Badminton Scheduler API running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
});

export default app;
