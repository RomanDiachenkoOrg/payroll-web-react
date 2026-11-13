import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { can, type Permission } from '../../lib/permissions';
import { Loading } from '../../components/ui';

interface RequireAuthProps {
  children: ReactNode;
  permission?: Permission;
}

export function RequireAuth({ children, permission }: RequireAuthProps) {
  const { status, user } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (status === 'checking') return <Loading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (permission && !can(user, permission)) {
    return (
      <div className="alert alert-warning" role="alert">
        You do not have access to this page.
      </div>
    );
  }
  return <>{children}</>;
}
