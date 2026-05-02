import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export function IconHome({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.2l2.4 2.4 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGitBranch({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <rect x="4" y="5" width="4.5" height="4.5" rx="1" />
      <rect x="15.5" y="5" width="4.5" height="4.5" rx="1" />
      <rect x="15.5" y="14.5" width="4.5" height="4.5" rx="1" />
      <path d="M8.5 7.25h4.2a2.8 2.8 0 0 1 2.8 2.8v0.2" strokeLinecap="round" />
      <path d="M8.5 7.25v7.1a2.2 2.2 0 0 0 2.2 2.2h4.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconLayers({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <rect x="10.5" y="4" width="3" height="3" rx="0.75" />
      <rect x="4" y="16.5" width="3" height="3" rx="0.75" />
      <rect x="17" y="16.5" width="3" height="3" rx="0.75" />
      <path d="M12 7v4.5" strokeLinecap="round" />
      <path d="M12 11.5H7v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11.5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStethoscope({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <circle cx="7" cy="18" r="2.2" />
      <circle cx="17" cy="10.5" r="2.2" />
      <path d="M7 15.8V6.5" strokeLinecap="round" />
      <path d="M9.2 18h2.8a5 5 0 0 0 5-5v-0.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconFileText({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconRefresh({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function IconRocket({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function IconFolder({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconHelp({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9.6a2.5 2.5 0 0 1 4.9.8c0 1.6-2 2.2-2.5 3.1" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSettings({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 4.2v2.1M12 17.7v2.1M4.2 12h2.1M17.7 12h2.1M6.5 6.5l1.5 1.5M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="6.2" />
    </svg>
  );
}

export function IconBell({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconSparkles({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </svg>
  );
}

export function IconUpload({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function IconBot({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...p}>
      <rect x="3.5" y="8" width="17" height="11" rx="2.2" />
      <path d="M9 8V6.8A2.3 2.3 0 0 1 11.3 4.5h1.4A2.3 2.3 0 0 1 15 6.8V8" />
      <circle cx="9" cy="13.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.4" r="1" fill="currentColor" stroke="none" />
      <path d="M8 16.2h8" strokeLinecap="round" />
      <path d="M3.5 12h-1.5M20.5 12H22" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown({ className, ...p }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
