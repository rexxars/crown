import {stringify as qs} from 'querystring'
import test from 'ava'
import {testConfig} from '../config/config'
import initServer from '../src/server'

const server = initServer(testConfig)
const baseUrl = testConfig.rootPath
const parse = res => JSON.parse(res.payload)

test.cb('provides helpful root-level route', t => {
  server.inject('/', res => {
    t.is(res.statusCode, 404, 'status code should be 404')
    t.is(parse(res).error, 'Not Found (did you mean /api/crown/v1?)')
    t.end()
  })
})

test.cb('requires a URL query param', t => {
  server.inject(baseUrl, res => {
    t.is(res.statusCode, 400, 'status code should be 400')
    t.same(parse(res).validation, {source: 'query', keys: ['url']})
    t.end()
  })
})

test.cb('extracts meta and opengraph info by default', t => {
  server.inject(`${baseUrl}?${qs({url: 'https://espen.codes'})}`, res => {
    console.log(parse(res))
    t.end()
  })
})
