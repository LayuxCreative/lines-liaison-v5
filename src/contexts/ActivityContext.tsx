import React, { createContext, useContext, useState } from "react";
import { Activity } from "../types";

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => Promise<void>;
  loadActivities: () => Promise<void>;
  isLoading: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadActivities = async () => {
    // Placeholder - will be implemented via Node.js API
    // Return empty array without causing infinite loop
    if (activities.length === 0) {
      setActivities([]);
    }
    return [];
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

function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
}

export { ActivityProvider, useActivity };