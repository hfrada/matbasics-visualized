export function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M2.5 8.5c1.1 1.1 2.1 2.3 3.2 3.4 2.5-2.8 5-5.5 7.8-8.1" />
    </svg>
  )
}
