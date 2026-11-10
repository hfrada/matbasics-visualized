type TopicQuoteProps = {
  children: string
}

export function TopicQuote({ children }: TopicQuoteProps) {
  return (
    <blockquote className="relative mt-4.5 max-w-155 pl-7.5 font-hand text-2xl leading-snug">
      <span aria-hidden="true" className="absolute -top-2.5 left-0 font-hand text-[52px] leading-none text-faint">
        “
      </span>
      <p>{children}”</p>
    </blockquote>
  )
}
