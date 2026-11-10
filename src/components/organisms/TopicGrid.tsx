import { TopicCard } from '../molecules/TopicCard'

type TopicItem = {
  key: string
  label: string
  to: string
}

export function TopicGrid({ topics }: { topics: TopicItem[] }) {
  return (
    <ul className="flex w-full max-w-6xl flex-wrap justify-center gap-9">
      {topics.map((topic, index) => (
        <li
          key={topic.key}
          className="enter w-full max-w-sm sm:w-auto"
          style={{ animationDelay: `${100 + index * 45}ms` }}
        >
          <TopicCard number={index + 1} label={topic.label} to={topic.to} />
        </li>
      ))}
    </ul>
  )
}
