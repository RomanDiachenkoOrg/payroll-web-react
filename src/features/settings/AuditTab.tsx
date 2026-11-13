import { useState, type FormEvent } from 'react';
import { useGetAuditLogQuery } from '../../api/adminApi';
import type { AuditFilter } from '../../api/types';
import { ErrorAlert, Loading } from '../../components/ui';
import { formatDateTime } from '../../lib/format';

const ENTITIES = ['Employee', 'Department', 'Timesheet', 'PayRun', 'Settings', 'User'];
const ACTIONS = [
  'create', 'update', 'delete', 'deactivate', 'activate', 'salary-change',
  'submit', 'approve', 'reject', 'calculate', 'pay', 'login', 'logout',
];
const EMPTY: AuditFilter = { entity: '', action: '', user: '', from: '', to: '' };

export function AuditTab() {
  const [draft, setDraft] = useState<AuditFilter>(EMPTY);
  const [filter, setFilter] = useState<AuditFilter>(EMPTY);
  const { data: entries = [], isFetching, error } = useGetAuditLogQuery(filter);

  const set = (key: keyof AuditFilter) => (e: { target: { value: string } }) => setDraft({ ...draft, [key]: e.target.value });
  const apply = (e: FormEvent) => {
    e.preventDefault();
    setFilter({ ...draft, user: draft.user?.trim() });
  };

  return (
    <>
      <form className="filters" onSubmit={apply} noValidate>
        <label htmlFor="audit-entity">Entity</label>
        <select id="audit-entity" value={draft.entity} onChange={set('entity')}>
          <option value="">All</option>
          {ENTITIES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label htmlFor="audit-action">Action</label>
        <select id="audit-action" value={draft.action} onChange={set('action')}>
          <option value="">All</option>
          {ACTIONS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label htmlFor="audit-user">User</label>
        <input id="audit-user" placeholder="email contains" value={draft.user} onChange={set('user')} />
        <label htmlFor="audit-from">From</label>
        <input id="audit-from" type="date" value={draft.from} onChange={set('from')} />
        <label htmlFor="audit-to">To</label>
        <input id="audit-to" type="date" value={draft.to} onChange={set('to')} />
        <button type="submit" className="btn btn-sm">
          Filter
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            setDraft(EMPTY);
            setFilter(EMPTY);
          }}
        >
          Clear
        </button>
      </form>
      <ErrorAlert error={error} />
      {isFetching && <Loading />}
      <table className="table compact" data-testid="audit-table">
        <thead>
          <tr>
            <th>When</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">No entries match the filter.</td>
            </tr>
          )}
          {entries.map((a) => (
            <tr key={a.id}>
              <td className="nowrap">{formatDateTime(a.at)}</td>
              <td>{a.userEmail}</td>
              <td>
                <code>{a.action}</code>
              </td>
              <td>
                {a.entity}
                {a.entityId ? ` #${a.entityId}` : ''}
              </td>
              <td>{a.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Showing the latest {entries.length} entries.</p>
    </>
  );
}
