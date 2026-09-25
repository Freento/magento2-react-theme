import React from 'react';

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

const PAGER_CTRL =
  'inline-flex items-center justify-center gap-1.5 h-9 bg-transparent border border-line rounded text-ink text-13 font-medium tracking-[0.02em] cursor-pointer transition-colors duration-fast ease-[ease]';

const PAGER_BTN =
  `pager-btn ${PAGER_CTRL} px-3.5 max600:px-3 enabled:hover:border-ink enabled:hover:bg-surface disabled:text-ink-2 disabled:border-line disabled:cursor-not-allowed disabled:bg-transparent [&:disabled_svg]:opacity-50`;

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
    <nav className="pager flex items-center justify-center gap-4 max600:gap-2 py-6" aria-label="Pagination">
      <button
        type="button"
        className={`${PAGER_BTN} pager-prev`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={atStart}
        aria-label="Previous page"
      >
        <ArrowLeft />
        <span className="max600:hidden">Prev</span>
      </button>

      <ol className="pager-list flex items-center gap-1 list-none m-0 p-0">
        {tokens.map((t) => {
          if (typeof t === 'string') {
            return <li key={t} className="pager-gap inline-flex items-center justify-center min-w-[28px] h-9 text-ink-2 text-base select-none" aria-hidden="true">…</li>;
          }
          const isCurrent = t === currentPage;
          return (
            <li key={t}>
              <button
                type="button"
                className={isCurrent
                  ? 'pager-num is-current inline-flex items-center justify-center gap-1.5 h-9 min-w-[36px] px-2.5 bg-ink border border-ink rounded text-bg text-13 font-medium tracking-[0.02em] cursor-default transition-colors duration-fast ease-[ease]'
                  : `pager-num ${PAGER_CTRL} min-w-[36px] px-2.5 hover:border-ink hover:bg-surface`}
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
        className={`${PAGER_BTN} pager-next`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={atEnd}
        aria-label="Next page"
      >
        <span className="max600:hidden">Next</span>
        <ArrowRight />
      </button>
    </nav>
  );
};

export default Pagination;
