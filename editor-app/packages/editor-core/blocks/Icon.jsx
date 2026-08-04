const PATHS = {
  truck: (
    <>
      <rect x="3" y="7" width="14" height="10" rx="1" />
      <path d="M17 10h3l1 3v4h-4" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3 8-8 9-5-1-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="1" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M7 12h10" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <path d="M3 10h18" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
      <path d="M5 19l8-8" />
    </>
  ),
  star: (
    <>
      <path d="M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.7-5 2.7 1-5.7-4-4 5.5-.8z" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7-4.2-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.8 12 20 12 20z" />
    </>
  ),
  bag: (
    <>
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
};

export default function IconBlock({ name = 'star', size = 24, strokeWidth = 1.5 }) {
  const paths = PATHS[name] || PATHS.star;
  const sizePx = Number(size) || 24;
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={Number(strokeWidth) || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
