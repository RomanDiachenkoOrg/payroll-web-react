import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current page and disables Previous on the first page', () => {
    render(<Pagination page={1} pageCount={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('reports the selected page', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} pageCount={3} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });
});
