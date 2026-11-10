export function Wordmark({ text }: { text: string }) {
  return (
    <span className="leading-none">
      {text.slice(0, -1)}
      <span className="text-marker">{text.slice(-1)}</span>
    </span>
  )
}
