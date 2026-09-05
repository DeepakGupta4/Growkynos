import { useTransition } from '../components/transitions/TransitionProvider'
import { Button } from '../components/ui/Button'
import { useSEO } from '../hooks/useSEO'

export default function NotFound() {
  const { go } = useTransition()
  useSEO({ title: 'Not found — GENTECHNE', description: 'This page does not exist.', path: '/404' })

  return (
    <section className="grid min-h-[100svh] place-items-center px-gutter">
      <div className="flex max-w-lg flex-col items-start gap-6">
        <span className="label-brass">ERROR 404</span>
        <h1 className="font-display text-display-2 font-extrabold text-gradient-bone">
          NOTHING
          <br />
          HERE.
        </h1>
        <p className="text-silver">
          The world you were looking for has moved or never existed. Everything else is still where you
          left it.
        </p>
        <Button onClick={() => go('/', { label: 'GENTECHNE' })}>Return to the entry</Button>
      </div>
    </section>
  )
}
