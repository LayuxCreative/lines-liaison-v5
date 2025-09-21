import React, { createContext, useContext, useState, useEffect } from "react";
import { Activity } from "../types";
import { supabase } from "../config/supabase";
import supabaseService from "../services/supabaseService";

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => Promise<void>;
  loadActivities: () => Promise<void>;
  isLoading: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load activities from Supabase with optimization
  const loadActivities = async () => {
    try {
      setIsLoading(true);
      
      // Use supabaseService for better error handling
      const data = await supabaseService.getActivities();

      if (data && data.length > 0) {
        const convertedActivities: Activity[] = data.map((item: unknown) => {
          const activityItem = item as Record<string, unknown>;
          return {
            id: String(activityItem.id || ''),
            projectId: String(activityItem.project_id || activityItem.projectId || ''),
            userId: String(activityItem.user_id || activityItem.userId || ''),
            action: String(activityItem.action || ''),
            description: String(activityItem.description || ''),
            timestamp: new Date(activityItem.timestamp as string),
            metadata: (activityItem.metadata as Record<string, string | number | boolean>) || {},
          };
        });
        setActivities(convertedActivities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load activities with delay to improve initial load time
  useEffect(() => {
    // Delay loading activities to prioritize other essential data
    const timer = setTimeout(() => {
      loadActivities();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const addActivity = async (activity: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    // Save to Supabase first
    try {
      const { error } = await supabase
        .from("activities")
        .insert({
          id: newActivity.id,
          project_id: newActivity.projectId,
          user_id: newActivity.userId,
          action: newActivity.action,
          description: newActivity.description,
          timestamp: newActivity.timestamp.toISOString(),
          metadata: newActivity.metadata || {},
        });
      
      if (error) {
        console.error("Error saving activity to Supabase:", error);
        return;
      }
      
      // Only add to local state if Supabase save was successful
      setActivities((prev) => [newActivity, ...prev]);
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity, loadActivities, isLoading }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};