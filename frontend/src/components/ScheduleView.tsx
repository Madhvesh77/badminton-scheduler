/**
 * Component to display and manage a generated schedule
 */

import { useState } from "react";
import { toggleRoundComplete } from "../api";
import { Schedule, Round, MatchObj } from "../types";

interface ScheduleViewProps {
  schedule: Schedule;
  onScheduleUpdate: (schedule: Schedule) => void;
}

function ScheduleView({ schedule, onScheduleUpdate }: ScheduleViewProps) {
  const [loadingRounds, setLoadingRounds] = useState<Set<string>>(new Set());

  const formatMatch = (match: MatchObj): string => {
    const teamA = match.teamA.join(" + ");
    const teamB = match.teamB.join(" + ");
    return `${teamA} vs ${teamB}`;
  };

  const handleToggleComplete = async (roundId: string) => {
    setLoadingRounds((prev) => new Set(prev).add(roundId));

    try {
      const result = await toggleRoundComplete(schedule.scheduleId, roundId);

      // Update the schedule with the new completion status
      const updatedRounds = schedule.rounds.map((round) =>
        round.id === roundId ? { ...round, completed: result.completed } : round
      );

      onScheduleUpdate({
        ...schedule,
        rounds: updatedRounds,
      });
    } catch (err) {
      console.error("Failed to toggle round completion:", err);
      alert("Failed to update round status. Please try again.");
    } finally {
      setLoadingRounds((prev) => {
        const next = new Set(prev);
        next.delete(roundId);
        return next;
      });
    }
  };

  const exportToText = () => {
    let text = `Badminton Schedule\n`;
    text += `Players: ${schedule.players.join(", ")}\n`;
    text += `Courts: ${schedule.courts}\n`;
    text += `Match Type: ${schedule.matchType}\n`;
    text += `\n`;

    schedule.rounds.forEach((round, index) => {
      text += `\nRound ${index + 1}${round.completed ? " (COMPLETED)" : ""}\n`;
      text += `${"=".repeat(50)}\n`;

      round.matches.forEach((match, matchIndex) => {
        text += `  Match ${matchIndex + 1}: ${formatMatch(match)}\n`;
      });

      if (round.resting.length > 0) {
        text += `  Resting: ${round.resting.join(", ")}\n`;
      }
    });

    return text;
  };

  const handleCopy = async () => {
    const text = exportToText();
    try {
      await navigator.clipboard.writeText(text);
      alert("Schedule copied to clipboard!");
    } catch (err) {
      // Fallback for mobile browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        alert("Schedule copied to clipboard!");
      } catch (e) {
        alert("Failed to copy to clipboard");
      }
      document.body.removeChild(textarea);
    }
  };

  const handleDownload = () => {
    const text = exportToText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "badminton-schedule.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="schedule-view">
      <div className="schedule-header">
        <div className="schedule-info">
          <h2>Generated Schedule</h2>
          <div className="meta-info">
            <span>
              <strong>Players:</strong> {schedule.players.length}
            </span>
            <span>
              <strong>Courts:</strong> {schedule.courts}
            </span>
            <span>
              <strong>Type:</strong> {schedule.matchType}
            </span>
            <span>
              <strong>Rounds:</strong> {schedule.rounds.length}
            </span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleCopy}>
            📋 Copy
          </button>
          <button className="btn btn-secondary" onClick={handleDownload}>
            💾 Download
          </button>
        </div>
      </div>

      <div className="rounds-container">
        {schedule.rounds.map((round, index) => (
          <RoundCard
            key={round.id}
            round={round}
            roundNumber={index + 1}
            onToggleComplete={handleToggleComplete}
            isLoading={loadingRounds.has(round.id)}
            formatMatch={formatMatch}
          />
        ))}
      </div>
    </div>
  );
}

interface RoundCardProps {
  round: Round;
  roundNumber: number;
  onToggleComplete: (roundId: string) => void;
  isLoading: boolean;
  formatMatch: (match: MatchObj) => string;
}

function RoundCard({
  round,
  roundNumber,
  onToggleComplete,
  isLoading,
  formatMatch,
}: RoundCardProps) {
  return (
    <div className={`round-card ${round.completed ? "completed" : ""}`}>
      <div className="round-header">
        <h3>Round {roundNumber}</h3>
        <button
          className={`btn ${round.completed ? "btn-warning" : "btn-success"}`}
          onClick={() => onToggleComplete(round.id)}
          disabled={isLoading}
        >
          {isLoading ? "..." : round.completed ? "Undo" : "Mark Completed"}
        </button>
      </div>

      <div className="matches-list">
        {round.matches.map((match, matchIndex) => (
          <div
            key={match.id}
            className={`match-item ${round.completed ? "strike-through" : ""}`}
          >
            <span className="match-number">Match {matchIndex + 1}:</span>
            <span className="match-teams">{formatMatch(match)}</span>
          </div>
        ))}
      </div>

      {round.resting.length > 0 && (
        <div className="resting-section">
          <strong>Resting:</strong> {round.resting.join(", ")}
        </div>
      )}
    </div>
  );
}

export default ScheduleView;
