const qs = require('querystring').stringify
const os = require('os')
const omit = require('lodash/omit')
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
const getFixtureUrl = srv => `http://localhost:${srv.address().port}`
const getUrl = fixture => `${baseUrl}?${qs({url: getFixtureUrl(fixture)})}`
const stripUrl = res => omit(res, 'resolvedUrl')

test('requires a URL query param', () =>
  request(app).get(baseUrl).send().expect(400, {
    statusCode: 400,
    error: 'Bad Request',
    message: 'child "url" fails because ["url" is required]',
    validation: {source: 'query', keys: ['url']}
  }))

test('extracts meta and opengraph info by default', async () => {
  const fixture = await successServer()
  const response = await request(app).get(getUrl(fixture))

  expect(stripUrl(response.body)).toMatchSnapshot()
  return fixture.close()
})

test('stops after max number of redirects', () =>
  infiniteRedirectServer().then(fixture =>
    request(app)
      .get(`${baseUrl}?${qs({url: getFixtureUrl(fixture)})}`)
      .then(res => expect(stripUrl(res.body)).toMatchSnapshot())
      .then(() => fixture.close())
  ))

test('handles redirects within limit', () =>
  redirectServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getFixtureUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(200, 'status code should be 200')
      expect(doc.statusCode).toBe(200, 'status code should be 200')
      expect(doc.resolvedUrl).toBe(`${getFixtureUrl(fixture)}/home`)
      fixture.close()
    })
  ))

test.skip('cuts responses at size limit', () =>
  largeBodyServer().then(fixture =>
    request(app).get(`${baseUrl}?${qs({url: getFixtureUrl(fixture)})}`).then(res => {
      const doc = getBody(res)
      expect(res.statusCode).toBe(406, 'status code should be 406')
      expect(doc.statusCode).toBe(406, 'status code should be 406')
      expect(doc.message).toBe('Response exceeded max allowed number of bytes')
      fixture.close()
    })
  )
)

test('cuts responses at timeout', () =>
  timeoutServer().then(fixture =>
    request(app)
      .get(`${baseUrl}?${qs({url: getFixtureUrl(fixture)})}`)
      .then(res => expect(stripUrl(res.body)).toMatchSnapshot())
      .then(() => fixture.close())
  ))

test('does not allow connections to local hosts', () => {
  const tmpApp = initServer(Object.assign({}, config, {allowPrivateHostnames: false}))

  return Promise.all([
    request(tmpApp).get(`${baseUrl}?${qs({url: 'http://127.0.0.1'})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    }),

    request(tmpApp).get(`${baseUrl}?${qs({url: 'http://localhost:8080'})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    }),

    request(tmpApp).get(`${baseUrl}?${qs({url: `http://${os.hostname()}`})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    }),

    request(tmpApp).get(`${baseUrl}?${qs({url: `http://192.168.1.44`})}`).then(res => {
      expect(res.statusCode).toBe(403, 'status code should be 403')
    })
  ])
})

test('allow connections to remote hosts', () => {
  const tmpApp = initServer(Object.assign({}, config, {allowPrivateHostnames: false}))

  return request(tmpApp).get(`${baseUrl}?${qs({url: 'http://www.google.com'})}`).then(res => {
    expect(res.statusCode).toBe(200, 'status code should be 200')
  })
})
