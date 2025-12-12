/**
 * API client for backend communication
 */

import { ScheduleRequest, ScheduleResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Generate a new schedule
 */
export async function createSchedule(
  request: ScheduleRequest
): Promise<ScheduleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get an existing schedule
 */
export async function getSchedule(
  scheduleId: string
): Promise<ScheduleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/schedule/${scheduleId}`);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Toggle round completion status
 */
export async function toggleRoundComplete(
  scheduleId: string,
  roundId: string
): Promise<{ scheduleId: string; roundId: string; completed: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/api/schedule/${scheduleId}/round/${roundId}/complete`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
