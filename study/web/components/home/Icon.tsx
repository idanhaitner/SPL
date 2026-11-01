const PATHS = {
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  check: <path d="m5 13 4 4 10-11" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M20 12H5M11 6l-6 6 6 6" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="3" /><path d="M5 15a2 2 0 0 1-1-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 1" /></>,
  warn: <><path d="M12 4 2.8 20h18.4L12 4Z" /><path d="M12 10v4M12 17.5v.01" /></>,
  down: <path d="m6 9 6 6 6-6" />,
};

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="gh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function PlantMark() {
  return (
    <svg className="gh-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 29V13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M16 15C8 15 4 10 4 4c7 0 12 4 12 11Z" fill="currentColor" />
      <path d="M16 20c6 0 10-3 12-9-7-1-12 3-12 9Z" fill="currentColor" />
    </svg>
  );
}
