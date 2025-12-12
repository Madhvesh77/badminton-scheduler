import { useState } from "react";
import SchedulerForm from "./components/SchedulerForm";
import ScheduleView from "./components/ScheduleView";
import { Schedule } from "./types";

function App() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState<string>("");

  const handleScheduleGenerated = (newSchedule: Schedule) => {
    setSchedule(newSchedule);
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSchedule(null);
  };

  const handleReset = () => {
    if (
      schedule &&
      !window.confirm("Are you sure you want to discard the current schedule?")
    ) {
      return;
    }
    setSchedule(null);
    setError("");
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🏸 Badminton Match Scheduler</h1>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!schedule ? (
          <SchedulerForm
            onScheduleGenerated={handleScheduleGenerated}
            onError={handleError}
          />
        ) : (
          <>
            <button className="btn btn-secondary" onClick={handleReset}>
              ← New Schedule
            </button>
            <ScheduleView schedule={schedule} onScheduleUpdate={setSchedule} />
          </>
        )}
      </main>

      <footer className="footer">
        <p>Built with TypeScript, React, and Express</p>
      </footer>
    </div>
  );
}

export default App;
