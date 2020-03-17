# koa-jaeger-tracing

[![NPM version](https://img.shields.io/npm/v/@zcong/koa-jaeger-tracing.svg?style=flat)](https://npmjs.com/package/@zcong/koa-jaeger-tracing) [![NPM downloads](https://img.shields.io/npm/dm/@zcong/koa-jaeger-tracing.svg?style=flat)](https://npmjs.com/package/@zcong/koa-jaeger-tracing) [![CircleCI](https://circleci.com/gh/zcong1993/koa-jaeger-tracing/tree/master.svg?style=shield)](https://circleci.com/gh/zcong1993/koa-jaeger-tracing/tree/master) [![codecov](https://codecov.io/gh/zcong1993/koa-jaeger-tracing/branch/master/graph/badge.svg)](https://codecov.io/gh/zcong1993/koa-jaeger-tracing)

> out of box jaeger tracing helper package for koa

## Install

```bash
$ yarn add @zcong/koa-jaeger-tracing
# or npm
$ npm i @zcong/koa-jaeger-tracing --save
```

## Usage

```ts
import { setupTracer } from '@zcong/koa-jaeger-tracing'

const app = new Koa()

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
```

this will give a out of box middleware tracing for all your routes, with operation name `koa-tracing-mw` and `http.status_code` `route` tag. If there is unexpected error occurred in your controller the tracing will marked with an `error` tag.

### http request

you can use `import { request } from '@zcong/koa-jaeger-tracing'` from this lib, it is wrappered from `axios` with auto span support. Or you can make your own version, source code is here [./src/http.ts](./src/http.ts).

### sub span

there is always a helper function `import { newSpanFromCurrent } from '@zcong/koa-jaeger-tracing'` here to help you handle `childOf` relations.

```ts
import { newSpanFromCurrent } from '@zcong/koa-jaeger-tracing'

// example service
const service = async () => {
  const span = newSpanFromCurrent()
  // do some logic, and call span.finish
  span.finish()
  return 'res'
}

// use in controller
const controller = async ctx => {
  const res = await service()
  ctx.body = {
    res
  }
}
```

## License

MIT &copy; zcong1993
