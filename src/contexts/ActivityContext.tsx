import React, { useState } from "react";
import { Activity } from "../types";
import { ActivityContext, ActivityContextType } from './ActivityContextBase';

function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading] = useState(false);

  const loadActivities = async () => {
    // Placeholder - will be implemented via Node.js API
    // Return empty array without causing infinite loop
    if (activities.length === 0) {
      setActivities([]);
    }
  };

  const addActivity = async (activity: Omit<Activity, "id" | "timestamp">) => {
    // Placeholder - will be implemented via Node.js API
    console.log('Activity added:', activity);
  };

  const value: ActivityContextType = {
    activities,
    addActivity,
    loadActivities,
    isLoading,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export { ActivityProvider };