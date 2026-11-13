import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useGetSessionQuery } from './api/sessionApi';
import { useAppDispatch, useAppSelector, useCurrentUser } from './app/hooks';
import { signedIn, signedOut } from './features/auth/authSlice';
import { Layout } from './components/Layout';
import { RequireAuth } from './features/auth/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EmployeesPage } from './features/employees/EmployeesPage';
import { EmployeeFormPage } from './features/employees/EmployeeFormPage';
import { EmployeeDetailPage } from './features/employees/EmployeeDetailPage';
import { TimesheetsPage } from './features/timesheets/TimesheetsPage';
import { TimesheetFormPage } from './features/timesheets/TimesheetFormPage';
import { PayRunsPage } from './features/payruns/PayRunsPage';
import { PayRunDetailPage } from './features/payruns/PayRunDetailPage';
import { PayslipPage } from './features/payslips/PayslipPage';
import { DepartmentsPage } from './features/departments/DepartmentsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { NotFoundPage } from './components/NotFoundPage';
import { Loading } from './components/ui';

/** Restores the session from the cookie on page load. */
function useSessionBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const { data, isError } = useGetSessionQuery(undefined, { skip: status !== 'checking' });

  useEffect(() => {
    if (data) dispatch(signedIn(data));
    else if (isError) dispatch(signedOut());
  }, [data, isError, dispatch]);

  return status;
}

function MyProfile() {
  const user = useCurrentUser();
  if (!user?.employeeId) {
    return <div className="alert alert-warning">Your user account is not linked to an employee record.</div>;
  }
  return <Navigate to={`/employees/${user.employeeId}`} replace />;
}

export function App() {
  const status = useSessionBootstrap();
  if (status === 'checking') return <Loading label="Starting…" />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<RequireAuth permission="employees:list"><EmployeesPage /></RequireAuth>} />
        <Route path="employees/new" element={<RequireAuth permission="employees:edit"><EmployeeFormPage /></RequireAuth>} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="employees/:id/edit" element={<RequireAuth permission="employees:edit"><EmployeeFormPage /></RequireAuth>} />
        <Route path="me" element={<MyProfile />} />
        <Route path="timesheets" element={<TimesheetsPage />} />
        <Route path="timesheets/new" element={<TimesheetFormPage />} />
        <Route path="timesheets/:id" element={<TimesheetFormPage />} />
        <Route path="payruns" element={<RequireAuth permission="payruns:view"><PayRunsPage /></RequireAuth>} />
        <Route path="payruns/:id" element={<RequireAuth permission="payruns:view"><PayRunDetailPage /></RequireAuth>} />
        <Route path="payslips/:id" element={<PayslipPage />} />
        <Route path="departments" element={<RequireAuth permission="departments:view"><DepartmentsPage /></RequireAuth>} />
        <Route path="reports" element={<RequireAuth permission="reports:view"><ReportsPage /></RequireAuth>} />
        <Route path="settings" element={<Navigate to="/settings/rates" replace />} />
        <Route path="settings/:tab" element={<RequireAuth permission="settings:view"><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
