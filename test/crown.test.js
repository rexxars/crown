const qs = require('querystring').stringify
const os = require('os')
const request = require('supertest')
const config = require('../config/config')
const initServer = require('../src/app')
const successServer = require('./fixtures/successServer')
const largeBodyServer = require('./fixtures/largeBodyServer')
const timeoutServer = require('./fixtures/timeoutServer')
const {infiniteRedirectServer, redirectServer} = require('./fixtures/redirectServer')

const app = initServer(config)
const getBody = res => res.body
const baseUrl = '/resolve'
const getUrl = srv => `http://localhost:${srv.address().port}`

test('requires a URL query param', () =>
  request(app).get(baseUrl).send().expect(400, {
    statusCode: 400,
    error: 'Bad Request',
    message: 'child "url" fails because ["url" is required]',
    validation: {source: 'query', keys: ['url']}
  }))

test('extracts meta and opengraph info by default', () =>
  successServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(200, 'status code should be 200')
      expect(doc.statusCode).toBe(200, 'status code should be 200')
      expect(doc.resolvedUrl).toBe(`${getUrl(fixture)}/`)
      expect(doc.meta.title).toBe('Beginning Assembly Programming on the Commodore Vic-20')
      expect(doc.meta.description).toBe('Retro Computers, Programming, General Technical Tinkering')
      expect(doc.openGraph.description).toBe(
        'Retro Computers, Programming, General Technical Tinkering'
      )
      expect(doc.openGraph.url).toBe(
        'http://techtinkering.com/2013/04/16/beginning-assembly-programming-on-the-commodore-vic-20/'
      )

      fixture.close()
    })
  ))

test('stops after max number of redirects', () =>
  infiniteRedirectServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(508, 'status code should be 508')
      expect(doc.statusCode).toBe(508, 'status code should be 508')
      expect(doc.message).toBe('Reached maximum number of redirects without resolving')
      fixture.close()
    })
  ))

test('handles redirects within limit', () =>
  redirectServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(200, 'status code should be 200')
      expect(doc.statusCode).toBe(200, 'status code should be 200')
      expect(doc.resolvedUrl).toBe(`${getUrl(fixture)}/home`)
      fixture.close()
    })
  ))

test.skip('cuts responses at size limit', () =>
  largeBodyServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(406, 'status code should be 406')
      expect(doc.statusCode).toBe(406, 'status code should be 406')
      expect(doc.message).toBe('Response exceeded max allowed number of bytes')
      fixture.close()
    })
  )
)

test.only('cuts responses at timeout', () =>
  timeoutServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(503, 'status code should be 503')
      expect(doc.statusCode).toBe(503, 'status code should be 503')
      expect(doc.message).toBe('Read timeout while fetching URL')
      fixture.close()
    })
  )
)

/*
test('does not allow connections to local hosts', () => {
  const tmpServer = initServer(Object.assign({}, config, {allowPrivateHostnames: false}))

  return Promise.all([
    tmprequest(app).get(`${baseUrl}?${qs({url: 'http://127.0.0.1'})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    }),

    tmprequest(app).get(`${baseUrl}?${qs({url: 'http://localhost:8080'})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    }),

    tmprequest(app).get(`${baseUrl}?${qs({url: `http://${os.hostname()}`})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    }),

    tmprequest(app).get(`${baseUrl}?${qs({url: `http://192.168.1.44`})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    })
  ])
})

test('allow connections to remote hosts', () => {
  const tmpServer = initServer(Object.assign({}, config, {allowPrivateHostnames: false}))

  return tmprequest(app).get(`${baseUrl}?${qs({url: 'http://www.google.com'})}`).then(res => {
    expect(res.statusCode).toBe(200, 'status code should be 200')
  })
})
*/
