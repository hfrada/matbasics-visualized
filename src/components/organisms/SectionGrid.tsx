import { SectionCard } from '../molecules/SectionCard'

type Section = {
  key: string
  label: string
  to?: string
}

export function SectionGrid({ sections }: { sections: Section[] }) {
  return (
    <ul className="flex w-full max-w-6xl flex-wrap justify-center gap-8">
      {sections.map((section, index) => (
        <li
          key={section.key}
          className="enter w-full max-w-xs sm:w-auto"
          style={{ animationDelay: `${100 + index * 45}ms` }}
        >
          <SectionCard label={section.label} to={section.to} />
        </li>
      ))}
    </ul>
  )
}
