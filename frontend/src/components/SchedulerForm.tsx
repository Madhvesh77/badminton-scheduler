/**
 * Form component for creating a new schedule
 */

import { useState, FormEvent } from "react";
import { createSchedule } from "../api";
import { Schedule } from "../types";

interface SchedulerFormProps {
  onScheduleGenerated: (schedule: Schedule) => void;
  onError: (error: string) => void;
}

function SchedulerForm({ onScheduleGenerated, onError }: SchedulerFormProps) {
  const [playersText, setPlayersText] = useState("");
  const [courtsText, setCourtsText] = useState("1");
  const [matchType, setMatchType] = useState<"singles" | "doubles">("doubles");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Parse players from textarea (one per line)
    const players = playersText
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Client-side validation
    if (players.length < 5) {
      onError("Please enter at least 5 player names (one per line)");
      return;
    }

    // Validate courts
    const courtsValue = parseInt(courtsText.trim());
    if (isNaN(courtsValue) || courtsValue < 1) {
      onError(
        "Number of courts must be a valid number greater than or equal to 1"
      );
      return;
    }

    if (!Number.isInteger(courtsValue)) {
      onError("Number of courts must be a whole number");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const response = await createSchedule({
        players,
        courts: courtsValue,
        matchType,
      });

      const schedule: Schedule = {
        scheduleId: response.scheduleId,
        rounds: response.rounds,
        players,
        courts: courtsValue,
        matchType,
      };

      onScheduleGenerated(schedule);

      if (response.warning) {
        console.warn("Schedule generated with warning:", response.warning);
      }
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError("Failed to generate schedule. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="scheduler-form">
        <div className="form-group">
          <label htmlFor="players">
            Player Names <span className="required">*</span>
          </label>
          <textarea
            id="players"
            value={playersText}
            onChange={(e) => setPlayersText(e.target.value)}
            placeholder="Enter player names (one per line)&#10;"
            rows={10}
            required
            disabled={loading}
          />
          <small className="help-text">Minimum 5 players required</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="courts">
              Number of Courts <span className="required">*</span>
            </label>
            <input
              type="text"
              id="courts"
              value={courtsText}
              onChange={(e) => setCourtsText(e.target.value)}
              placeholder="e.g., 1"
              required
              disabled={loading}
            />
            <small className="help-text">Enter a number (minimum 1)</small>
          </div>

          <div className="form-group">
            <label htmlFor="matchType">
              Match Type <span className="required">*</span>
            </label>
            <select
              id="matchType"
              value={matchType}
              onChange={(e) =>
                setMatchType(e.target.value as "singles" | "doubles")
              }
              required
              disabled={loading}
            >
              <option value="doubles">Doubles (2v2)</option>
              <option value="singles">Singles (1v1)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Generating..." : "🏸 Generate Schedule"}
        </button>
      </form>
    </div>
  );
}

export default SchedulerForm;
