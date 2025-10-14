import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
// Realtime subscription removed - using Node.js API only
import Header from "./components/common/Header";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import Footer from "./components/common/Footer";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ScrollToTop from "./components/common/ScrollToTop";
import ErrorBoundary from "./components/common/ErrorBoundary";
import DevErrorBoundary from "./components/common/DevErrorBoundary";
import AuthGuard from "./components/auth/AuthGuard";
import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";
import DatabaseStatusWidget from "./components/common/DatabaseStatusWidget";
import RealtimeActivityLogger from "./components/realtime/RealtimeActivityLogger";
import { createSkipLink } from "./utils/accessibility";

// Public pages - keep critical ones non-lazy for better initial load
import Home from "./pages/Home";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import EmailConfirmation from "./components/auth/EmailConfirmation";

// Lazy load non-critical pages for better performance
const Services = lazy(() => import("./pages/Services"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

// Lazy load dashboard pages (heavy components)
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Projects = lazy(() => import("./pages/dashboard/Projects"));
const CreateProject = lazy(() => import("./pages/dashboard/CreateProject"));
const ProjectDetails = lazy(() => import("./pages/dashboard/ProjectDetails"));
const Files = lazy(() => import("./pages/dashboard/Files"));
const Communication = lazy(() => import("./pages/dashboard/Communication"));
const Reports = lazy(() => import("./pages/dashboard/Reports"));
const Invoices = lazy(() => import("./pages/dashboard/Invoices"));
const Contracts = lazy(() => import("./pages/dashboard/Contracts"));
const Tasks = lazy(() => import("./pages/dashboard/Tasks"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const PerformanceDashboard = lazy(() => import("./components/dashboard/PerformanceDashboard"));
const CommunicationHub = lazy(() => import("./components/communication/CommunicationHub"));
const RealtimeTestPage = lazy(() => import("./pages/RealtimeTestPage"));
const UserActivityPage = lazy(() => import("./pages/UserActivityPage"));
const SupabaseTestPage = lazy(() => import("./pages/SupabaseTestPage"));
const AuthDebug = lazy(() => import("./pages/AuthDebug"));
const DataDebug = lazy(() => import("./pages/DataDebug"));

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  // Add skip links for accessibility
  useEffect(() => {
    const skipLink = createSkipLink('main-content', 'Skip to main content');
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    return () => {
      if (skipLink && skipLink.parentNode === document.body) {
        document.body.removeChild(skipLink);
      }
    };
  }, []);

  // Enable realtime subscriptions when user is logged in
  // Realtime subscription disabled

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Add RealtimeActivityLogger for global activity logging */}
      {user && (
        <RealtimeActivityLogger
          userId={user.id}
          userEmail={user.email}
        />
      )}
      
      {isDashboard && user ? <DashboardHeader /> : <Header />}
      <main id="main-content" className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route path="/logout" element={<Logout />} />
          <Route path="/confirm-email" element={<EmailConfirmation />} />
          <Route path="/auth-debug" element={<AuthDebug />} />
          <Route path="/data-debug" element={<DataDebug />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={<AuthGuard><Dashboard /></AuthGuard>}
          />
          <Route
            path="/dashboard/projects"
            element={<AuthGuard><Projects /></AuthGuard>}
          />
          <Route
            path="/dashboard/create-project"
            element={<AuthGuard><CreateProject /></AuthGuard>}
          />
          <Route
            path="/dashboard/projects/:id"
            element={<AuthGuard><ProjectDetails /></AuthGuard>}
          />
          <Route
            path="/dashboard/files"
            element={<AuthGuard><Files /></AuthGuard>}
          />
          <Route
            path="/dashboard/communication"
            element={<AuthGuard><Communication /></AuthGuard>}
          />
          <Route
            path="/dashboard/communication-hub"
            element={
              <AuthGuard>
                <CommunicationHub currentUser={{ 
                  id: user?.id || '',
                  name: user?.name || '',
                  ...(user?.avatar && { avatar: user.avatar })
                }} />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard/reports"
            element={<AuthGuard><Reports /></AuthGuard>}
          />
          <Route
            path="/dashboard/invoices"
            element={<AuthGuard><Invoices /></AuthGuard>}
          />
          <Route
            path="/dashboard/contracts"
            element={<AuthGuard><Contracts /></AuthGuard>}
          />
          <Route
            path="/dashboard/tasks"
            element={<AuthGuard><Tasks /></AuthGuard>}
          />
          <Route
            path="/dashboard/profile"
            element={<AuthGuard><Profile /></AuthGuard>}
          />
          <Route
            path="/dashboard/settings"
            element={<AuthGuard><Settings /></AuthGuard>}
          />
          <Route
            path="/dashboard/performance"
            element={<AuthGuard><PerformanceDashboard /></AuthGuard>}
          />
          <Route
            path="/dashboard/realtime-test"
            element={<AuthGuard><RealtimeTestPage /></AuthGuard>}
          />
          <Route
            path="/dashboard/users-activity"
            element={<AuthGuard><UserActivityPage /></AuthGuard>}
          />
          <Route
            path="/dashboard/supabase-test"
            element={<AuthGuard><SupabaseTestPage /></AuthGuard>}
          />

          {/* Additional protected routes */}
          <Route
            path="/portal"
            element={<AuthGuard><Navigate to="/dashboard" /></AuthGuard>}
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <DatabaseStatusWidget />
    </div>
  );
};

const App: React.FC = () => {
  const ErrorBoundaryComponent = import.meta.env.DEV ? DevErrorBoundary : ErrorBoundary;
  
  return (
    <GlobalErrorBoundary>
      <ErrorBoundaryComponent>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner />}>
            <AppContent />
          </Suspense>
        </Router>
      </ErrorBoundaryComponent>
    </GlobalErrorBoundary>
  );
};

export default App;
