import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useCan, useCurrentUser } from '../app/hooks';
import { resetSession } from '../app/store';
import { useLogoutMutation } from '../api/sessionApi';
import { ROLE_NAMES, type Permission } from '../lib/permissions';
import { Toasts } from './Toasts';
import { showToast } from '../app/toastSlice';

interface MenuItem {
  to: string;
  label: string;
  permission?: Permission;
  employeeOnly?: boolean;
}

const MENU: MenuItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/employees', label: 'Employees', permission: 'employees:list' },
  { to: '/me', label: 'My profile', employeeOnly: true },
  { to: '/timesheets', label: 'Timesheets' },
  { to: '/payruns', label: 'Pay runs', permission: 'payruns:view' },
  { to: '/departments', label: 'Departments', permission: 'departments:view' },
  { to: '/reports', label: 'Reports', permission: 'reports:view' },
  { to: '/settings', label: 'Settings', permission: 'settings:view' },
];

export function Layout() {
  const user = useCurrentUser();
  const can = useCan();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const items = MENU.filter((item) => {
    if (item.permission && !can(item.permission)) return false;
    if (item.employeeOnly && user?.role !== 'employee') return false;
    return true;
  });

  const signOut = async () => {
    try {
      await logout().unwrap();
    } finally {
      resetSession(dispatch);
      dispatch(showToast('info', 'You have been signed out.'));
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">$</span> Acme Payroll
          </NavLink>
          <nav aria-label="Main">
            <ul className="menu">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {user && (
            <div className="user-box">
              <span className="user-name">{user.name}</span>
              <span className="role-tag">{ROLE_NAMES[user.role]}</span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={signOut} data-testid="logout">
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <Toasts />
      <main className="container main">
        <Outlet />
      </main>
      <footer className="container footer muted no-print">Acme Payroll · web client</footer>
    </div>
  );
}
