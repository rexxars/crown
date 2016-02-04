import {stringify as qs} from 'querystring'
import os from 'os'
import test from 'ava'
import config from '../config/config'
import initServer from '../src/server'
import successServer from './fixtures/successServer'
import {infiniteRedirectServer, redirectServer} from './fixtures/redirectServer'
import largeBodyServer from './fixtures/largeBodyServer'
import timeoutServer from './fixtures/timeoutServer'

const server = initServer(config)
const baseUrl = config.rootPath
const parse = res => JSON.parse(res.payload)
const getUrl = srv => `http://localhost:${srv.address().port}`

test('provides helpful root-level route', t =>
  server.inject('/').then(res => {
    t.is(res.statusCode, 404, 'status code should be 404')
    t.is(parse(res).error, 'Not Found (did you mean /api/crown/v1?)')
  }))

test('requires a URL query param', t =>
  server.inject(baseUrl, res => {
    t.is(res.statusCode, 400, 'status code should be 400')
    t.same(parse(res).validation, {source: 'query', keys: ['url']})
  }))

test('extracts meta and opengraph info by default', t =>
  successServer().then(fixture =>
    server.inject(`${baseUrl}?${qs({url: getUrl(fixture)})}`).then(res => {
      const doc = parse(res)
      t.is(res.statusCode, 200, 'status code should be 200')
      t.is(doc.statusCode, 200, 'status code should be 200')
      t.is(doc.resolvedUrl, getUrl(fixture))
      t.is(doc.meta.title, 'Beginning Assembly Programming on the Commodore Vic-20')
      t.is(doc.meta.description, 'Retro Computers, Programming, General Technical Tinkering')
      t.is(doc.openGraph.description, 'Retro Computers, Programming, General Technical Tinkering')
      t.is(doc.openGraph.url, 'http://techtinkering.com/2013/04/16/beginning-assembly-programming-on-the-commodore-vic-20/')

      fixture.close()
    })
  )
)

test('stops after max number of redirects', t =>
  infiniteRedirectServer().then(fixture =>
    server.inject(`${baseUrl}?${qs({url: getUrl(fixture)})}`, res => {
      const doc = parse(res)
      t.is(res.statusCode, 508, 'status code should be 508')
      t.is(doc.statusCode, 508, 'status code should be 508')
      t.is(doc.message, 'Reached maximum number of redirects without resolving')
      fixture.close()
    })
  )
)

test('handles redirects within limit', t =>
  redirectServer().then(fixture =>
    server.inject(`${baseUrl}?${qs({url: getUrl(fixture)})}`, res => {
      const doc = parse(res)
      t.is(res.statusCode, 200, 'status code should be 200')
      t.is(doc.statusCode, 200, 'status code should be 200')
      t.is(doc.resolvedUrl, `${getUrl(fixture)}/home`)
      fixture.close()
    })
  )
)

test('cuts responses at size limit', t =>
  largeBodyServer().then(fixture =>
    server.inject(`${baseUrl}?${qs({url: getUrl(fixture)})}`, res => {
      const doc = parse(res)
      t.is(res.statusCode, 406, 'status code should be 406')
      t.is(doc.statusCode, 406, 'status code should be 406')
      t.is(doc.message, 'Response exceeded max allowed number of bytes')
      fixture.close()
    })
  )
)

test('cuts responses at timeout', t =>
  timeoutServer().then(fixture =>
    server.inject(`${baseUrl}?${qs({url: getUrl(fixture)})}`, res => {
      const doc = parse(res)
      t.is(res.statusCode, 503, 'status code should be 503')
      t.is(doc.statusCode, 503, 'status code should be 503')
      t.is(doc.message, 'Read timeout while fetching URL')
      fixture.close()
    })
  )
)

test('does not allow connections to local hosts', t => {
  const tmpServer = initServer(Object.assign({}, config, {allowPrivateHostnames: false}))

  return Promise.all([
    tmpServer.inject(`${baseUrl}?${qs({url: 'http://127.0.0.1'})}`).then(res => {
      t.is(res.statusCode, 403, 'status code should be 403')
    }),

    tmpServer.inject(`${baseUrl}?${qs({url: 'http://localhost:8080'})}`).then(res => {
      t.is(res.statusCode, 403, 'status code should be 403')
    }),

    tmpServer.inject(`${baseUrl}?${qs({url: `http://${os.hostname()}`})}`).then(res => {
      t.is(res.statusCode, 403, 'status code should be 403')
    }),

    tmpServer.inject(`${baseUrl}?${qs({url: `http://192.168.1.44`})}`).then(res => {
      t.is(res.statusCode, 403, 'status code should be 403')
    })
  ])
})

test('allow connections to remote hosts', t => {
  const tmpServer = initServer(Object.assign({}, config, {allowPrivateHostnames: false}))

  return tmpServer.inject(`${baseUrl}?${qs({url: 'http://www.google.com'})}`).then(res => {
    t.is(res.statusCode, 200, 'status code should be 200')
  })
})
