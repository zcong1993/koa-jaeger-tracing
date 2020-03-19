import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as supertest from 'supertest'
import axios from 'axios'
import {
  setupTracer,
  newSpanFromCurrent,
  request,
  runSyncWithSpan,
  runAsyncWithSpan
} from '../src'

// https://github.com/visionmedia/supertest/issues/520
afterAll((done: any) => setImmediate(done))

const sleep = (n: number) => new Promise(r => setTimeout(r, n))

const mockHandler = async (n: number, name: string) => {
  const span = newSpanFromCurrent(name)
  await sleep(n)
  span.finish()
  return `sleep-${n}-${name}`
}

const createApp = () => {
  const app = new Koa()
  const router = new Router()

  setupTracer(
    app,
    {
      serviceName: 'jest-test',
      sampler: {
        type: 'const',
        param: 1
      },
      reporter: {
        logSpans: true,
        agentHost: 'localhost',
        agentPort: 6832
      }
    },
    {
      logger: {
        info(msg) {
          console.log('INFO ', msg)
        },
        error(msg) {
          console.log('ERROR', msg)
        }
      }
    }
  )

  router.get('/test', async ctx => {
    if (ctx.query.throw) {
      throw new Error('test error')
    }
    runSyncWithSpan('syncWork', () => {
      console.log('sync work')
    })

    runAsyncWithSpan('asyncWork', async () => {
      await sleep(500)
    })
    await sleep(100)
    const res = await mockHandler(200, 'mockHandler1')
    ctx.body = {
      res
    }
  })

  router.get('/request', async ctx => {
    const { data } = await request({
      url: 'https://httpbin.org/headers'
    })

    ctx.body = data
  })

  app.use(router.routes())
  app.use(router.allowedMethods())

  return app
}

const createRequest = (app: ReturnType<typeof createApp>) => {
  const server = app.listen()
  return {
    request: supertest(server),
    server
  }
}

it('should work well', async () => {
  const app = createApp()
  const { request, server } = createRequest(app)

  await request.get('/test')
  await request.get('/test?throw=1')
  await request.get('/notFound')

  await sleep(1000)

  const res1 = await axios.get(
    'http://localhost:16686/api/traces?limit=20&lookback=1m&service=jest-test&operation=koa-tracing-mw'
  )
  expect(res1.data.data.length > 0).toBeTruthy()
  const res2 = await axios.get(
    'http://localhost:16686/api/traces?limit=20&lookback=1m&service=jest-test&operation=mockHandler1'
  )
  expect(res2.data.data.length > 0).toBeTruthy()

  server.close()
})

it('request should passing tracing headers', async () => {
  const app = createApp()
  const { request, server } = createRequest(app)

  const { body } = await request.get('/request')

  expect(body.headers['Uber-Trace-Id']).not.toBeNull()
  expect(body.headers['X-Amzn-Trace-Id']).not.toBeNull()

  server.close()
}, 10000)
