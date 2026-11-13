import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, stubFetch } from '../../test/render';
import { Toasts } from '../../components/Toasts';
import { DepartmentsPage } from './DepartmentsPage';

const admin = {
  auth: {
    status: 'authenticated' as const,
    expired: false,
    user: { id: 1, email: 'admin@acme.test', name: 'Laura Bennett', role: 'admin' as const, departmentId: 5, employeeId: 22, active: true, lastLoginAt: null },
  },
};

describe('DepartmentsPage', () => {
  it('shows the server error when a department still has active employees', async () => {
    stubFetch({
      'GET /api/departments': {
        body: [{ id: 1, name: 'Engineering', code: 'ENG', costCenter: 'CC-100', managerEmployeeId: null, employeeCount: 6, activeEmployeeCount: 5 }],
      },
      'GET /api/employees': { body: [] },
      'DELETE /api/departments/1': {
        status: 409,
        body: { error: 'Cannot delete department Engineering: it still has 5 active employee(s). Move or deactivate them first.' },
      },
    });
    renderWithProviders(
      <>
        <Toasts />
        <DepartmentsPage />
      </>,
      { preloadedState: admin },
    );

    const row = (await screen.findByText('Engineering')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete department' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('still has 5 active employee(s)');
  });
});
