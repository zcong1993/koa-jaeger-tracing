import { Span, Tags } from 'opentracing'
import { getTracer } from './tracer'
import { spanCtx } from './ctx'

export type SyncFunc<T = any> = () => T
export type AsyncFunc<T = any> = () => Promise<T>

export const runSyncWithSpan = <T = any>(
  name: string,
  fn: SyncFunc<T>,
  parentSpan?: Span
): T => {
  const tracer = getTracer()
  let ps = parentSpan
  if (!ps) {
    const ctx = spanCtx.getContext()
    ps = ctx.span
  }

  const span = tracer.startSpan(name, { childOf: ps.context() })

  try {
    return fn()
  } catch (err) {
    span.setTag(Tags.ERROR, true)
    throw err
  } finally {
    span.finish()
  }
}

export const runAsyncWithSpan = async <T = any>(
  name: string,
  fn: AsyncFunc<T>,
  parentSpan?: Span
): Promise<T> => {
  const tracer = getTracer()
  let ps = parentSpan
  if (!ps) {
    const ctx = spanCtx.getContext()
    ps = ctx.span
  }

  const span = tracer.startSpan(name, { childOf: ps.context() })

  return fn()
    .catch(err => {
      span.setTag(Tags.ERROR, true)
      throw err
    })
    .finally(() => {
      span.finish()
    })
}
