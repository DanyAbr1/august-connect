let test = require('tape')
let proxyquire = require('proxyquire')
let resetEnv = require('../reset-env')

let session = (params, callback) => (callback(null, {}))
let params
let tiny = {
  post: (p, callback) => {
    params = p
    callback()
  }
}
let authorize = proxyquire('../../../src/_authorize', {
  './util/session': session,
  'tiny-json-http': tiny
})

test('Returns a Promise or uses continuation passing', t => {
  t.plan(5)
  process.env.AUGUST_API_KEY = 'AUGUST_API_KEY'
  process.env.AUGUST_INSTALLID = 'AUGUST_INSTALLID'
  process.env.AUGUST_PASSWORD = 'AUGUST_PASSWORD'
  process.env.AUGUST_ID_TYPE = 'phone'
  process.env.AUGUST_ID = '+12345678901'
  let isPromise = authorize() instanceof Promise
  t.ok(isPromise, 'Promise returned (without params)')
  isPromise = authorize('foobar') instanceof Promise
  t.ok(isPromise, 'Promise returned (with params)')
  authorize(() => (t.pass('Executed callback (without params)')))
  authorize({}, () => (t.pass('Executed callback (empty params)')))
  authorize({code: 'foobar'}, () => (t.pass('Executed callback (with params)')))
})

test('Calls August endpoint with correct params (with code)', t => {
  t.plan(3)
  // Uses params set in last test
  t.equal(params.url, 'https://api-production.august.com/validate/phone', 'Valid August endpoint')
  t.equal(params.data.code, 'foobar', 'Valid code')
  t.equal(params.data.phone, '+12345678901', 'Valid type + ID')
})

test('Invalid code fails', t => {
  t.plan(1)
  authorize({ code: 'foo' }, err => {
    t.ok(err, err)
  })
})

test('Calls August endpoint with correct params (without code)', t => {
  t.plan(2)
  authorize(() => {
    t.equal(params.url, 'https://api-production.august.com/validation/phone', 'Valid August endpoint')
    t.equal(params.data.value, '+12345678901', 'Valid ID')
  })
})

test('Clean up env', t => {
  t.plan(1)
  resetEnv()
  t.pass('Env reset')
})
