import { useContext } from 'react';
import { ActivityContext } from '../contexts/ActivityContextBase';

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}