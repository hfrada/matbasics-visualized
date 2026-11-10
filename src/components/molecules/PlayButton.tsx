import { PlayIcon } from '../atoms/PlayIcon'
import { PenButton } from '../atoms/PenButton'
import { StopIcon } from '../atoms/StopIcon'

type PlayButtonProps = {
  playing: boolean
  startLabel: string
  stopLabel: string
  onClick: () => void
}

export function PlayButton({ playing, startLabel, stopLabel, onClick }: PlayButtonProps) {
  return (
    <PenButton onClick={onClick} className="min-w-32 justify-center">
      {playing ? <StopIcon /> : <PlayIcon />}
      {playing ? stopLabel : startLabel}
    </PenButton>
  )
}
