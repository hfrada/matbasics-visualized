export function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3.5 6.2c1.6 1.4 3 2.9 4.6 4.3 1.4-1.6 2.8-3 4.4-4.6" />
    </svg>
  )
}
