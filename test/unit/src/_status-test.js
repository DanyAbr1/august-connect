let test = require('tape')
let proxyquire = require('proxyquire')

let session = (params, callback) => (callback(null, {headers:{}}))
let lockData = {
  body: {foo: 'bar'},
  headers: {foo: 'bar'}
}
let locks = (params, callback) => (callback(null, lockData))
let params
let tiny = {
  put: (p, callback) => {
    params = p
    callback(null, {body:'foo'})
  }
}
let status = proxyquire('../../../src/_status', {
  './util/session': session,
  './_locks': locks,
  'tiny-json-http': tiny
})

test('Returns a Promise or uses continuation passing', t => {
  t.plan(5)
  let isPromise = status() instanceof Promise
  t.ok(isPromise, 'Promise returned (without params)')
  isPromise = status('foo') instanceof Promise
  t.ok(isPromise, 'Promise returned (with params)')
  status(() => (t.pass('Executed callback (without params)')))
  status({}, () => (t.pass('Executed callback (undefined params)')))
  status('foo', () => (t.pass('Executed callback (with params)')))
})

test('Calls August endpoint with correct params (passed lockID)', t => {
  t.plan(3)
  status({ lockID: 'myLockID' }, (err, result) => {
    if (err) t.fail(err)
    t.equal(params.url, 'https://api-production.august.com/remoteoperate/myLockID/status', 'Valid August endpoint')
    t.equal(params.headers['Content-Length'], 0, 'Appended zero content-length to request headers')
    t.ok(result, 'Returned result')
  })
})

test('Calls August endpoint with correct params (no lockID passed)', t => {
  t.plan(3)
  status({}, (err, result) => {
    if (err) t.fail(err)
    t.equal(params.url, 'https://api-production.august.com/remoteoperate/foo/status', 'Valid August endpoint')
    t.equal(params.headers['Content-Length'], 0, 'Appended zero content-length to request headers')
    t.ok(result, 'Returned result')
  })
})
