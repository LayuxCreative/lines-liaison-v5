import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useRealtimeSubscription } from "./hooks/useRealtimeSubscription";
import Header from "./components/common/Header";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import Footer from "./components/common/Footer";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ScrollToTop from "./components/common/ScrollToTop";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Public pages
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Logout from "./pages/Logout";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Projects from "./pages/dashboard/Projects";
import CreateProject from "./pages/dashboard/CreateProject";
import ProjectDetails from "./pages/dashboard/ProjectDetails";
import Files from "./pages/dashboard/Files";
import Communication from "./pages/dashboard/Communication";
import Reports from "./pages/dashboard/Reports";
import Invoices from "./pages/dashboard/Invoices";
import Contracts from "./pages/dashboard/Contracts";
import Tasks from "./pages/dashboard/Tasks";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import CommunicationHub from "./components/communication/CommunicationHub";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  // Enable realtime subscriptions when user is logged in
  useRealtimeSubscription();

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
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
