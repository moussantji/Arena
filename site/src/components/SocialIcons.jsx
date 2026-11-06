const base = {
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  width: 16,
  height: 16,
  'aria-hidden': 'true',
};

export function FacebookIcon() {
  return (
    <svg {...base}>
      <path d="M13.5 21v-7.2h2.4l.4-2.9h-2.8V9.2c0-.8.2-1.4 1.4-1.4h1.5V5.2c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.5v2.9h2.5V21h2.5Z" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.6" cy="7.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon() {
  return (
    <svg {...base}>
      <path d="M6.9 8.4H4.3V20h2.6V8.4ZM5.6 3.6a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM20 13.6c0-3-1.6-4.4-3.7-4.4-1.5 0-2.3.8-2.7 1.5V8.4H11c0 .7 0 11.6 0 11.6h2.6v-6.3c0-.6 0-1.2.2-1.6.4-.8 1.1-1.5 2.2-1.5 1.5 0 2 1.1 2 2.8V20H20v-6.4Z" />
    </svg>
  );
}

export function YoutubeIcon() {
  return (
    <svg {...base}>
      <path d="M21.2 8.1a2.5 2.5 0 0 0-1.7-1.8C17.9 6 12 6 12 6s-5.9 0-7.5.3a2.5 2.5 0 0 0-1.7 1.8A26 26 0 0 0 2.5 12c0 1.4.1 2.8.3 3.9a2.5 2.5 0 0 0 1.7 1.8C6.1 18 12 18 12 18s5.9 0 7.5-.3a2.5 2.5 0 0 0 1.7-1.8c.2-1.1.3-2.5.3-3.9s-.1-2.8-.3-3.9ZM10.2 15V9l5.1 3-5.1 3Z" />
    </svg>
  );
}
