import { ContinuationLocalStorage } from 'asyncctx'
import { Span, SpanOptions } from 'opentracing'
import { getTracer } from './tracer'

interface SpanCtx {
  rootSpan: Span
  span: Span
}

export const spanCtx = new ContinuationLocalStorage<SpanCtx>()
export const setSpan = (span: Span) => {
  const ctx = spanCtx.getContext()
  ctx.span = span
}
export const newSpanFromCurrent = (name: string, options?: SpanOptions) => {
  const tracer = getTracer()
  const ctx = spanCtx.getContext()
  const newSpan = tracer.startSpan(name, {
    childOf: ctx?.span?.context(),
    ...options
  })

  ctx.span = newSpan

  return newSpan
}
