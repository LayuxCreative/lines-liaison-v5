import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ActivityProvider } from "./contexts/ActivityContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { initializePerformanceMonitoring } from "./services/performanceMonitoringService";
import cacheService from "./services/cacheService";

import "./index.css";

// Initialize services
initializePerformanceMonitoring();
cacheService.initialize().catch(console.warn);

const AppWithProviders = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ActivityProvider>
          <DataProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </DataProvider>
        </ActivityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>,
);

export default AppWithProviders;
