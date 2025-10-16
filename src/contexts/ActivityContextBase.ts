import { createContext } from 'react';
import type { Activity } from '../types';

export interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;
  loadActivities: () => Promise<void>;
  isLoading: boolean;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);