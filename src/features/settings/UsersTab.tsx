import { Link } from 'react-router-dom';
import { useGetDepartmentsQuery, useGetUsersQuery } from '../../api/adminApi';
import { ErrorAlert, Loading, StatusBadge } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { ROLE_NAMES } from '../../lib/permissions';

export function UsersTab() {
  const { data: users = [], isLoading, error } = useGetUsersQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();

  if (isLoading) return <Loading />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <table className="table" data-testid="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Department</th>
          <th>Last sign-in</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {[...users]
          .sort((a, b) => a.email.localeCompare(b.email))
          .map((u) => (
            <tr key={u.id}>
              <td>{u.employeeId ? <Link to={`/employees/${u.employeeId}`}>{u.name}</Link> : u.name}</td>
              <td>{u.email}</td>
              <td>{ROLE_NAMES[u.role]}</td>
              <td>{departments.find((d) => d.id === u.departmentId)?.name ?? '-'}</td>
              <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</td>
              <td>
                <StatusBadge status={u.active ? 'Active' : 'Inactive'} />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
