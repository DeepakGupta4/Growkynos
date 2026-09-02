import { useCallback, useMemo, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { Button } from '../ui/Button'
import { formatBytes, cn } from '../../lib/utils'

/**
 * ENQUIRY FORM
 * ------------
 * Real validation, real states, and — importantly — no faked success.
 *
 * `VITE_CONTACT_ENDPOINT` is the integration point. When it is set, the form
 * POSTs multipart/form-data to it and reports whatever actually happened. When
 * it is NOT set, the form does not pretend to have sent anything: it tells the
 * visitor the endpoint is not configured and hands them a mailto fallback that
 * is pre-filled with everything they typed, so the enquiry still reaches us.
 */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT ?? ''
const STUDIO_EMAIL = 'studio@growkynos.com'

const PROJECT_TYPES = [
  'Web Development',
  'App Development',
  'Shopify',
  'WordPress',
  'SaaS',
  'UI/UX',
  'Photo Editing',
  'Video Editing',
  'AI / Automation',
  'Other',
]

const BUDGETS = [
  'Under £5,000',
  '£5,000 – £15,000',
  '£15,000 – £40,000',
  '£40,000 – £100,000',
  '£100,000+',
  'Not sure yet',
]

const TIMELINES = ['ASAP', 'Within 1 month', '1 – 3 months', '3 – 6 months', 'Exploring options']

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip,.fig'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const INITIAL = {
  name: '',
  email: '',
  company: '',
  projectType: '',
  budget: '',
  timeline: '',
  message: '',
  // Honeypot — bots fill it, humans never see it.
  website: '',
}

function validate(values, file) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please tell us your name.'
  else if (values.name.trim().length < 2) errors.name = 'That looks too short.'

  if (!values.email.trim()) errors.email = 'We need an email to reply to.'
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'That email address is not valid.'

  if (!values.projectType) errors.projectType = 'Choose the closest match.'

  if (!values.message.trim()) errors.message = 'Tell us what you are building.'
  else if (values.message.trim().length < 20)
    errors.message = 'A little more detail helps — 20 characters minimum.'

  if (file && file.size > MAX_FILE_BYTES)
    errors.file = `That file is ${formatBytes(file.size)}. The limit is 10 MB.`

  return errors
}

export function ContactForm() {
  const [values, setValues] = useState(INITIAL)
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error | unconfigured
  const [serverMessage, setServerMessage] = useState('')
  const formRef = useRef(null)
  const fileInputRef = useRef(null)
  const statusRef = useRef(null)

  const set = useCallback((key) => (e) => {
    const v = e.target.value
    setValues((prev) => ({ ...prev, [key]: v }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }, [])

  const blur = useCallback(
    (key) => () => {
      setTouched((prev) => ({ ...prev, [key]: true }))
      setErrors(validate({ ...values }, file))
    },
    [values, file],
  )

  const onFile = useCallback(
    (e) => {
      const f = e.target.files?.[0] ?? null
      setFile(f)
      setErrors((prev) => ({ ...prev, file: undefined }))
      if (f && f.size > MAX_FILE_BYTES) {
        setErrors((prev) => ({ ...prev, file: `That file is ${formatBytes(f.size)}. The limit is 10 MB.` }))
      }
    },
    [],
  )

  /** Pre-filled mailto so an enquiry is never lost when no endpoint exists. */
  const mailtoHref = useMemo(() => {
    const body = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      values.company && `Company: ${values.company}`,
      `Project type: ${values.projectType}`,
      values.budget && `Budget: ${values.budget}`,
      values.timeline && `Timeline: ${values.timeline}`,
      '',
      values.message,
      file ? `\n(Attachment to follow: ${file.name})` : '',
    ]
      .filter(Boolean)
      .join('\n')
    return `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(
      `New project enquiry — ${values.name || 'GROWKYNOS'}`,
    )}&body=${encodeURIComponent(body)}`
  }, [values, file])

  const shake = useCallback(() => {
    const el = formRef.current
    if (!el) return
    gsap.fromTo(
      el,
      { x: -7 },
      { x: 0, duration: 0.55, ease: 'elastic.out(1, 0.35)', clearProps: 'x' },
    )
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (status === 'submitting') return

      // Honeypot: silently succeed for bots without ever sending anything.
      if (values.website) {
        setStatus('success')
        return
      }

      const nextErrors = validate(values, file)
      setErrors(nextErrors)
      setTouched(Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true])))

      if (Object.keys(nextErrors).some((k) => nextErrors[k])) {
        shake()
        const firstKey = Object.keys(nextErrors).find((k) => nextErrors[k])
        formRef.current?.querySelector(`[name="${firstKey}"]`)?.focus()
        return
      }

      if (!ENDPOINT) {
        // Do NOT report success for a submission that was never sent.
        setStatus('unconfigured')
        statusRef.current?.focus()
        return
      }

      setStatus('submitting')
      setServerMessage('')

      try {
        const body = new FormData()
        Object.entries(values).forEach(([k, v]) => {
          if (k !== 'website') body.append(k, v)
        })
        if (file) body.append('attachment', file)

        const res = await fetch(ENDPOINT, { method: 'POST', body })

        if (!res.ok) {
          let detail = `The server responded with ${res.status}.`
          try {
            const data = await res.json()
            if (data?.message) detail = data.message
          } catch {
            /* non-JSON error body */
          }
          throw new Error(detail)
        }

        setStatus('success')
        setValues(INITIAL)
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        statusRef.current?.focus()
      } catch (err) {
        setStatus('error')
        setServerMessage(err?.message ?? 'Something went wrong sending your enquiry.')
        shake()
        statusRef.current?.focus()
      }
    },
    [values, file, status, shake],
  )

  /* ── Success ── */
  if (status === 'success') {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="surface flex flex-col items-start gap-5 rounded-xl p-7 md:p-10"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brass text-lg text-void">✓</span>
        <h3 className="font-display text-display-4 font-semibold text-bone">Enquiry received.</h3>
        <p className="max-w-md text-[14.5px] leading-relaxed text-silver">
          Thank you — it is with us. We read every enquiry ourselves and reply within one working day,
          usually sooner.
        </p>
        <Button variant="ghost" onClick={() => setStatus('idle')}>
          Send another
        </Button>
      </div>
    )
  }

  const showError = (key) => touched[key] && errors[key]

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7"
      aria-describedby="form-intro"
    >
      <p id="form-intro" className="sr-only">
        All fields marked required must be completed. Errors are announced beneath each field.
      </p>

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <div className="grid gap-x-6 gap-y-7 md:grid-cols-2">
        <Field
          label="Name"
          name="name"
          required
          value={values.name}
          onChange={set('name')}
          onBlur={blur('name')}
          error={showError('name')}
          autoComplete="name"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          value={values.email}
          onChange={set('email')}
          onBlur={blur('email')}
          error={showError('email')}
          autoComplete="email"
          inputMode="email"
        />
        <Field
          label="Company"
          name="company"
          optional
          value={values.company}
          onChange={set('company')}
          onBlur={blur('company')}
          autoComplete="organization"
        />
        <SelectField
          label="Project type"
          name="projectType"
          required
          value={values.projectType}
          onChange={set('projectType')}
          onBlur={blur('projectType')}
          error={showError('projectType')}
          options={PROJECT_TYPES}
          placeholder="Choose the closest match"
        />
        <SelectField
          label="Budget"
          name="budget"
          optional
          value={values.budget}
          onChange={set('budget')}
          options={BUDGETS}
          placeholder="Helps us scope honestly"
        />
        <SelectField
          label="Timeline"
          name="timeline"
          optional
          value={values.timeline}
          onChange={set('timeline')}
          options={TIMELINES}
          placeholder="When do you need it live?"
        />
      </div>

      <Field
        label="What are you building?"
        name="message"
        required
        textarea
        rows={5}
        value={values.message}
        onChange={set('message')}
        onBlur={blur('message')}
        error={showError('message')}
        hint={`${values.message.trim().length} characters`}
      />

      {/* File upload */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="attachment" className="label">
            Attachment <span className="text-steel">— optional</span>
          </label>
          <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-steel">
            PDF · DOC · IMAGE · ZIP · MAX 10 MB
          </span>
        </div>
        <label
          htmlFor="attachment"
          data-cursor="link"
          className={cn(
            'flex cursor-pointer items-center gap-4 rounded-lg border border-dashed px-5 py-5 transition-colors duration-500',
            errors.file ? 'border-[#C8A0A0]' : 'border-smoke hover:border-brass/60',
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-smoke text-mist">
            +
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] text-bone">
              {file ? file.name : 'Attach a brief, deck or reference'}
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-mist">
              {file ? formatBytes(file.size) : 'Drag a file here or click to browse'}
            </span>
          </span>
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
                setErrors((prev) => ({ ...prev, file: undefined }))
              }}
              className="ml-auto shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-mist transition-colors hover:text-bone"
            >
              Remove ✕
            </button>
          )}
        </label>
        <input
          ref={fileInputRef}
          id="attachment"
          name="attachment"
          type="file"
          accept={ACCEPTED}
          onChange={onFile}
          className="sr-only"
          aria-describedby={errors.file ? 'attachment-error' : undefined}
          aria-invalid={Boolean(errors.file)}
        />
        {errors.file && (
          <p id="attachment-error" role="alert" className="font-mono text-[10px] text-[#C8A0A0]">
            {errors.file}
          </p>
        )}
      </div>

      {/* Status region */}
      {(status === 'error' || status === 'unconfigured') && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="flex flex-col gap-3 rounded-lg border p-5"
          style={{
            borderColor: status === 'error' ? 'rgba(200,160,160,0.5)' : 'rgba(198,168,124,0.5)',
            backgroundColor: status === 'error' ? 'rgba(200,160,160,0.07)' : 'rgba(198,168,124,0.06)',
          }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{ color: status === 'error' ? '#C8A0A0' : '#C6A87C' }}
          >
            {status === 'error' ? 'Not sent' : 'Delivery endpoint not configured'}
          </span>
          <p className="text-[13.5px] leading-relaxed text-silver">
            {status === 'error'
              ? `${serverMessage} Nothing was sent — your details are still in the form below.`
              : 'This build has no submission endpoint connected yet, so we will not claim your enquiry was sent. Use the button below and it will open with everything you typed already filled in.'}
          </p>
          <a
            href={mailtoHref}
            data-cursor="link"
            className="w-fit rounded-full border border-brass/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brass transition-colors duration-500 hover:bg-brass hover:text-void"
          >
            Send by email instead →
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5 border-t border-smoke/60 pt-7">
        <Button type="submit" size="lg" disabled={status === 'submitting'} magnetic={status !== 'submitting'}>
          {status === 'submitting' ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-void" />
              Sending
            </>
          ) : (
            <>
              Send enquiry
              <span aria-hidden="true">→</span>
            </>
          )}
        </Button>
        <p className="max-w-xs text-[12px] leading-relaxed text-mist">
          We reply within one working day. No sales sequence, no automated follow-ups.
        </p>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────── */

function Field({ label, name, error, hint, textarea, optional, required, ...props }) {
  const id = `field-${name}`
  const errorId = `${id}-error`
  const Tag = textarea ? 'textarea' : 'input'

  return (
    <div className={cn('flex flex-col gap-2.5', textarea && 'col-span-full')}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label">
          {label} {optional && <span className="text-steel">— optional</span>}
          {required && <span className="text-brass"> *</span>}
        </label>
        {hint && <span className="font-mono text-[9px] tabular-nums text-steel">{hint}</span>}
      </div>
      <Tag
        id={id}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full rounded-lg border bg-carbon/70 px-4 py-3.5 text-[15px] text-bone transition-colors duration-400 placeholder:text-steel',
          'focus:border-brass/70 focus:bg-carbon',
          error ? 'border-[#C8A0A0]' : 'border-smoke hover:border-steel',
          textarea && 'resize-y leading-relaxed',
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="font-mono text-[10px] text-[#C8A0A0]">
          {error}
        </p>
      )}
    </div>
  )
}

function SelectField({ label, name, options, placeholder, error, optional, required, ...props }) {
  const id = `field-${name}`
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="label">
        {label} {optional && <span className="text-steel">— optional</span>}
        {required && <span className="text-brass"> *</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full appearance-none rounded-lg border bg-carbon/70 px-4 py-3.5 pr-11 text-[15px] transition-colors duration-400',
            'focus:border-brass/70 focus:bg-carbon',
            error ? 'border-[#C8A0A0]' : 'border-smoke hover:border-steel',
            props.value ? 'text-bone' : 'text-steel',
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o} className="bg-carbon text-bone">
              {o}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-mist"
        >
          ▼
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="font-mono text-[10px] text-[#C8A0A0]">
          {error}
        </p>
      )}
    </div>
  )
}
