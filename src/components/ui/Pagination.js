import React from 'react';
import '../../styles/ui/Pagination.less';

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const tokens = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...tokens].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(`gap-${i}`);
    out.push(sorted[i]);
  }
  return out;
}

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const tokens = buildPages(currentPage, totalPages);
  const atStart = currentPage <= 1;
  const atEnd = currentPage >= totalPages;

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        type="button"
        className="pager-btn pager-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={atStart}
        aria-label="Previous page"
      >
        <ArrowLeft />
        <span>Prev</span>
      </button>

      <ol className="pager-list">
        {tokens.map((t) => {
          if (typeof t === 'string') {
            return <li key={t} className="pager-gap" aria-hidden="true">…</li>;
          }
          const isCurrent = t === currentPage;
          return (
            <li key={t}>
              <button
                type="button"
                className={`pager-num${isCurrent ? ' is-current' : ''}`}
                onClick={() => onPageChange(t)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${t}`}
              >
                {t}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="pager-btn pager-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={atEnd}
        aria-label="Next page"
      >
        <span>Next</span>
        <ArrowRight />
      </button>
    </nav>
  );
};

export default Pagination;
