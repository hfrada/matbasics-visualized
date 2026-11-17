export function SvgMathName({ name }: { name: string }) {
  return name.split(/([a-z]+)/).map((part, index) =>
    index % 2 === 1 ? (
      <tspan key={index} className="font-math-italic italic">
        {part}
      </tspan>
    ) : (
      part
    ),
  )
}
