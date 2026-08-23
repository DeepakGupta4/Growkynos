import { Component } from 'react'

/**
 * Route-level safety net. A failure in one world must never leave the visitor
 * looking at a black screen — they get a readable message and a way back.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surfaced in the console for debugging; wire to a reporter in production.
    console.error('[GROWKYNOS] Render error:', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <section className="grid min-h-[100svh] place-items-center px-gutter">
        <div className="flex max-w-lg flex-col items-start gap-5">
          <span className="label-brass">SYSTEM FAULT</span>
          <h1 className="font-display text-display-3 font-extrabold text-gradient-bone">
            SOMETHING
            <br />
            BROKE.
          </h1>
          <p className="text-silver">
            This section failed to render. Everything else still works — reload to try again, or get in
            touch and we&rsquo;ll fix it.
          </p>
          <pre className="max-w-full overflow-x-auto rounded border border-smoke bg-carbon p-3 font-mono text-[10px] text-mist">
            {String(error?.message ?? error)}
          </pre>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-brass px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-void"
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-full border border-smoke px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-silver"
            >
              Back to entry
            </a>
          </div>
        </div>
      </section>
    )
  }
}
