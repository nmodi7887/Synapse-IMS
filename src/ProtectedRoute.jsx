import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./services/supabase";
import LoadingScreen from "./components/LoadingScreen";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    checkUser();
  }, []);

  if (loading) {
    return <LoadingScreen label="Verifying your credentials…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;