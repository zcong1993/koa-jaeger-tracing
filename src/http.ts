import axios, { AxiosRequestConfig } from 'axios'
import { FORMAT_HTTP_HEADERS, Tags } from 'opentracing'
import { spanCtx } from './ctx'
import { getTracer } from './tracer'

export const request = async (config: AxiosRequestConfig) => {
  const span = spanCtx.getContext()?.span
  const tracer = getTracer()
  const newSpan = tracer.startSpan('request', { childOf: span.context() })
  const headers = {
    ...config.headers
  }

  newSpan.setTag(Tags.HTTP_URL, config.url)
  newSpan.setTag(Tags.HTTP_METHOD, config.method)
  newSpan.setTag(Tags.SPAN_KIND, Tags.SPAN_KIND_RPC_CLIENT)
  // Send span context via request headers (parent id etc.)
  tracer.inject(newSpan, FORMAT_HTTP_HEADERS, headers)
  config.headers = headers
  return axios
    .request(config)
    .catch(err => {
      newSpan.setTag(Tags.ERROR, true)
      throw err
    })
    .finally(() => {
      newSpan.finish()
    })
}
