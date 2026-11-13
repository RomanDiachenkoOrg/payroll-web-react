import { NavLink, Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import { RatesTab } from './RatesTab';
import { UsersTab } from './UsersTab';
import { AuditTab } from './AuditTab';

const TABS = [
  { id: 'rates', label: 'Tax & rates', element: <RatesTab /> },
  { id: 'users', label: 'Users', element: <UsersTab /> },
  { id: 'audit', label: 'Audit log', element: <AuditTab /> },
];

export function SettingsPage() {
  const { tab } = useParams();
  const current = TABS.find((t) => t.id === tab);
  if (!current) return <Navigate to="/settings/rates" replace />;

  return (
    <>
      <PageHeader title="Settings" />
      <nav className="tabs" aria-label="Settings sections">
        {TABS.map((t) => (
          <NavLink key={t.id} to={`/settings/${t.id}`} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="tab-panel">{current.element}</div>
    </>
  );
}
