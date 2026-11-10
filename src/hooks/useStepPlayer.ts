import { useEffect, useState } from 'react'

type PlayerState = {
  step: number
  arrived: boolean
}

type StepPlayerOptions = {
  steps: number
  delayMs: number
  travelMs: number
}

export function useStepPlayer({ steps, delayMs, travelMs }: StepPlayerOptions) {
  const [state, setState] = useState<PlayerState | null>(null)

  useEffect(() => {
    if (!state) return
    const timeout = state.arrived
      ? setTimeout(() => {
          setState(state.step + 1 < steps ? { step: state.step + 1, arrived: false } : null)
        }, delayMs)
      : setTimeout(() => setState({ step: state.step, arrived: true }), travelMs)
    return () => clearTimeout(timeout)
  }, [state, steps, delayMs, travelMs])

  return {
    playing: state !== null,
    target: state ? state.step : null,
    current: state ? (state.arrived ? state.step : state.step - 1) : null,
    start: () => setState({ step: 0, arrived: true }),
    stop: () => setState(null),
  }
}
