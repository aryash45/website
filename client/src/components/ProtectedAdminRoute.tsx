import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

/**
 * Wraps any component so that only users with role="admin" can access it.
 * - Not logged in → redirect to /login
 * - Logged in but not admin → redirect to / with a warning
 * - Admin → render children normally
 */
export default function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (!isAdmin) {
      // Regular customer — send them home
      setLocation("/");
    }
  }, [isAuthenticated, isAdmin, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <Component />;
}
