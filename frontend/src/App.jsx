import { useState, useEffect } from "react";
// FIX: Corrected import paths, assuming components are in the same directory as App.jsx
import Dashboard from "./components/Dashboard"; 
import { Loader2 } from "lucide-react";
import Login from "./components/LogIn";
import UnauthorizedScreen from "./components/UnauthorizedScreen";

const ROLE_ADMINISTRATOR = ["Administrator", "Manager", "Management", "HOD QA"];

const isTokenExpired = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true; 
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // FIX: Use a key to force remount on auth status change
  const [sessionKey, setSessionKey] = useState(Date.now()); 

  const clearAuthData = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("EmployeeId");
    localStorage.removeItem("Username");
    localStorage.removeItem("BdCode");
    localStorage.removeItem("Designation");
    localStorage.removeItem("Role");
  };

  const checkAuth = () => {
    const token = localStorage.getItem("authToken");
    let authenticated = false;

    if (token && !isTokenExpired(token)) {
      authenticated = true;
      setIsAuthenticated(true);
      
      const bdCode = localStorage.getItem("BdCode");
      const role = localStorage.getItem("Role");

      if (bdCode || ROLE_ADMINISTRATOR.includes(role)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else {
      clearAuthData();
      setIsAuthenticated(false);
      setIsAuthorized(false);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
    // The initial key is set here.
  }, []);

  const handleLoginSuccess = () => {
    const bdCode = localStorage.getItem("BdCode");
    const role = localStorage.getItem("Role");
    
    setIsAuthenticated(true);

    if (bdCode || ROLE_ADMINISTRATOR.includes(role.trim())) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
    // Update session key to ensure Dashboard remounts fresh (though it's not rendered yet)
    setSessionKey(Date.now());
  };

  const handleLogout = () => {
    // 1. Clear Data
    clearAuthData();
    
    // 2. Force update state (will trigger re-render)
    setIsAuthenticated(false);
    setIsAuthorized(false);

    // 3. FIX: Change the session key to force a complete destruction 
    //    and recreation of the Dashboard component when a new user logs in, 
    //    preventing stale data retention.
    setSessionKey(Date.now());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated && !isAuthorized) {
    return <UnauthorizedScreen onLogout={handleLogout} />;
  }

  return (
    <>
      {isAuthenticated && isAuthorized ? (
        // FIX: Pass the sessionKey to force remount on state change/logout
        <Dashboard 
        key={sessionKey} 
        onLogout={handleLogout} 
        bdCode={localStorage.getItem("BdCode")}
        username={localStorage.getItem("Username")} 
        designation={localStorage.getItem("Designation")}
        />
        
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
