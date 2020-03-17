import {
  initTracer,
  JaegerTracer,
  TracingConfig,
  TracingOptions
} from 'jaeger-client'
import { FORMAT_HTTP_HEADERS, Tags } from 'opentracing'
import * as Application from 'koa'
import { spanCtx } from './ctx'

let tracer: JaegerTracer

export const setupTracer = (
  app: Application,
  config: TracingConfig,
  options: TracingOptions
) => {
  tracer = initTracer(config, options)
  app.use(async (ctx, next) => {
    const parentSpanContext = tracer.extract(
      FORMAT_HTTP_HEADERS,
      ctx.request.headers
    )
    const span = tracer.startSpan('koa-tracing-mw', {
      childOf: parentSpanContext,
      tags: { [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER }
    })

    spanCtx.setContext({ span, rootSpan: span })

    try {
      await next()
      span.setTag(Tags.HTTP_STATUS_CODE, ctx.status || 200)
    } catch (err) {
      span.setTag(Tags.ERROR, true)
      span.setTag(Tags.HTTP_STATUS_CODE, err.statusCode || 500)
      throw err
    } finally {
      const route = ctx._matchedRoute || '__no_matched'
      span.setTag('route', route)
      span.finish()
    }
  })

  return tracer
}

export const getTracer = () => {
  if (!tracer) {
    throw new Error('call setupTracer first')
  }
  return tracer
}
