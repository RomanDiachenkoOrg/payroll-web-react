interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label?: string;
}

export function Pagination({ page, pageCount, onChange, label = 'Pages' }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label={label}>
      <button type="button" className="btn btn-sm" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === page ? 'btn btn-sm btn-primary' : 'btn btn-sm'}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button type="button" className="btn btn-sm" disabled={page === pageCount} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
