import React, { Suspense, lazy } from "react";
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
import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";

// Public pages - keep critical ones non-lazy for better initial load
import Home from "./pages/Home";
import Login from "./pages/Login";
import Logout from "./pages/Logout";

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
const CommunicationHub = lazy(() => import("./components/communication/CommunicationHub"));

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  // Enable realtime subscriptions when user is logged in
  // Realtime subscription disabled

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isDashboard && user ? <DashboardHeader /> : <Header />}
      <main className="flex-1">
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

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/projects"
            element={user ? <Projects /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/create-project"
            element={user ? <CreateProject /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/projects/:id"
            element={user ? <ProjectDetails /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/files"
            element={user ? <Files /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/communication"
            element={user ? <Communication /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/communication-hub"
            element={
              user ? (
                <CommunicationHub currentUser={{ 
                  id: user.id,
                  name: user.name || '',
                  avatar: user.avatar
                }} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard/reports"
            element={user ? <Reports /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/invoices"
            element={user ? <Invoices /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/contracts"
            element={user ? <Contracts /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/tasks"
            element={user ? <Tasks /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/profile"
            element={user ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard/settings"
            element={user ? <Settings /> : <Navigate to="/login" />}
          />

          {/* Additional protected routes */}
          <Route
            path="/portal"
            element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner />}>
            <AppContent />
          </Suspense>
        </Router>
      </ErrorBoundary>
    </GlobalErrorBoundary>
  );
};

export default App;
