export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="heaven-logo-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="heaven-logo-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9061f9" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <clipPath id="heaven-logo-shape">
          <path d="M18 18 H40 V40 H60 V18 H82 V60 L50 78 L18 60 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#heaven-logo-shape)">
        <rect x="0" y="0" width="100" height="100" fill="url(#heaven-logo-dark)" />
        <path
          d="M0 0 H62 C44 14, 46 30, 64 38 C46 46, 34 58, 30 64 C26 70, 34 80, 42 84 L0 84 Z"
          fill="url(#heaven-logo-light)"
        />
      </g>
    </svg>
  );
}
