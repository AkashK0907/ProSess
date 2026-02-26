import { Navigate } from 'react-router-dom';
import { isTokenValid } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
