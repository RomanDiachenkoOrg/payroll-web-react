import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeleteDepartmentMutation, useGetDepartmentsQuery } from '../../api/adminApi';
import { useGetEmployeesQuery } from '../../api/employeesApi';
import type { Department } from '../../api/types';
import { useCan, useToast } from '../../app/hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorAlert, Loading, PageHeader } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { DepartmentDialog } from './DepartmentDialog';

export function DepartmentsPage() {
  const can = useCan();
  const toast = useToast();
  const { data: departments = [], isLoading, error } = useGetDepartmentsQuery();
  const { data: employees = [] } = useGetEmployeesQuery();
  const [deleteDepartment, { isLoading: deleting }] = useDeleteDepartmentMutation();
  const [editing, setEditing] = useState<Department | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Department | null>(null);
  const canEdit = can('departments:edit');

  const managerName = (id: number | null) => {
    const e = id ? employees.find((x) => x.id === id) : undefined;
    return e ? `${e.firstName} ${e.lastName}` : '-';
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDepartment(toDelete.id).unwrap();
      toast('success', `Department ${toDelete.name} deleted.`);
    } catch (err) {
      toast('error', errorMessage(err));
    }
    setToDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Departments"
        actions={
          canEdit && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
              New department
            </button>
          )
        }
      />
      <ErrorAlert error={error} />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="card no-pad">
          <table className="table" data-testid="departments-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Cost center</th>
                <th>Manager</th>
                <th className="num">Active employees</th>
                <th className="num">Total employees</th>
                {canEdit && (
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {[...departments]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link to={`/employees?dept=${d.id}`}>{d.name}</Link>
                    </td>
                    <td>
                      <code>{d.code}</code>
                    </td>
                    <td>{d.costCenter}</td>
                    <td>{managerName(d.managerEmployeeId)}</td>
                    <td className="num">{d.activeEmployeeCount}</td>
                    <td className="num">{d.employeeCount}</td>
                    {canEdit && (
                      <td className="actions">
                        <button type="button" className="btn btn-sm" onClick={() => setEditing(d)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setToDelete(d)}>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <DepartmentDialog
          department={editing === 'new' ? null : editing}
          employees={employees.filter((e) => e.active)}
          onClose={() => setEditing(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete department"
          message={`Delete the department ${toDelete.name}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
