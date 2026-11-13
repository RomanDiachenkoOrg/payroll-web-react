import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, stubFetch } from '../../test/render';
import { LoginPage } from './LoginPage';

const anonymous = { auth: { status: 'anonymous' as const, user: null, expired: false } };

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Dashboard page</p>} />
    </Routes>,
    { route: '/login', preloadedState: anonymous },
  );
}

describe('LoginPage', () => {
  it('shows validation errors without calling the server', async () => {
    const calls = stubFetch({});
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('shows the server message for a wrong password', async () => {
    stubFetch({ 'POST /api/session': { status: 401, body: { error: 'Invalid email or password.' } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@acme.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('signs in and redirects to the dashboard', async () => {
    const calls = stubFetch({
      'POST /api/session': {
        body: { id: 1, email: 'admin@acme.test', name: 'Laura Bennett', role: 'admin', departmentId: 5, employeeId: 22, active: true, lastLoginAt: null },
      },
    });
    const { store } = renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@acme.test');
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(store.getState().auth.user?.role).toBe('admin');
    expect(calls[0].body).toEqual({ email: 'admin@acme.test', password: 'Passw0rd!' });
  });
});
