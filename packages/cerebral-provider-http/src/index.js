import request from './request'
import {urlEncode, mergeWith, createResponse} from './utils'
import FileUpload from './fileUpload'

import DEFAULT_OPTIONS from './DEFAULT_OPTIONS'

import {
  httpGet as httpGetFactory,
  httpPost as httpPostFactory,
  httpPut as httpPutFactory,
  httpPatch as httpPatchFactory,
  httpDelete as httpDeleteFactory} from './operators'

export function httpGet (...args) {
  console.warn('Deprecation Warning: Importing httpGet directly from cerebral-provider-http is now deprecated. Use cerebral-provider-http/operators')
  return httpGetFactory(...args)
}

export function httpPost (...args) {
  console.warn('Deprecation Warning: Importing httpPost directly from cerebral-provider-http is now deprecated. Use cerebral-provider-http/operators')
  return httpPostFactory(...args)
}

export function httpPut (...args) {
  console.warn('Deprecation Warning: Importing httpPut directly from cerebral-provider-http is now deprecated. Use cerebral-provider-http/operators')
  return httpPutFactory(...args)
}

export function httpPatch (...args) {
  console.warn('Deprecation Warning: Importing httpPatch directly from cerebral-provider-http is now deprecated. Use cerebral-provider-http/operators')
  return httpPatchFactory(...args)
}

export function httpDelete (...args) {
  console.warn('Deprecation Warning: Importing httpDelete directly from cerebral-provider-http is now deprecated. Use cerebral-provider-http/operators')
  return httpDeleteFactory(...args)
}

export default function HttpProviderFactory (passedOptions) {
  let moduleOptions = mergeWith({}, DEFAULT_OPTIONS)
  if (typeof passedOptions === 'function') {
    moduleOptions = passedOptions(moduleOptions)
  } else if (passedOptions) {
    moduleOptions = mergeWith(passedOptions, DEFAULT_OPTIONS)
  }

  let cachedProvider = null
  function HttpProvider (context) {
    const requests = {}
    function createAbortablePromise (url, cb) {
      return new Promise((resolve, reject) => {
        requests[url] = {
          resolve: resolve,
          reject: reject,
          xhr: cb(function (payload) {
            delete requests[url]
            resolve(payload)
          }, function (error) {
            delete requests[url]
            reject(error)
          })
        }
      })
    }

    function requestService (options) {
      options = mergeWith(options, moduleOptions)

      if (typeof options.onProgress === 'string') {
        options.onProgress = context.controller.getSignal(options.onProgress)
      }

      options.method = options.method.toUpperCase()

      return createAbortablePromise(options.url, (resolve, reject) => {
        return request(options, createResponse(options, resolve, reject))
      })
    }

    if (cachedProvider) {
      context.http = cachedProvider
    } else {
      context.http = cachedProvider = {
        request: requestService,
        get (url, passedQuery, options = {}) {
          const query = passedQuery || options.query

          options.url = query && Object.keys(query).length ? url + '?' + urlEncode(query) : url
          options.method = 'GET'

          return requestService(options)
        },
        post (url, body, options = {}) {
          options.url = options.query && Object.keys(options.query).length ? url + '?' + urlEncode(options.query) : url
          options.method = 'POST'
          options.body = body

          return requestService(options)
        },
        put (url, body, options = {}) {
          options.url = options.query && Object.keys(options.query).length ? url + '?' + urlEncode(options.query) : url
          options.method = 'PUT'
          options.body = body

          return requestService(options)
        },
        patch (url, body, options = {}) {
          options.url = options.query && Object.keys(options.query).length ? url + '?' + urlEncode(options.query) : url
          options.method = 'PATCH'
          options.body = body

          return requestService(options)
        },
        delete (url, query, options = {}) {
          options.url = options.query && Object.keys(options.query).length ? url + '?' + urlEncode(options.query) : url
          options.method = 'DELETE'

          return requestService(options)
        },
        updateOptions (newOptions) {
          moduleOptions = mergeWith(newOptions, moduleOptions)
        },
        abort (regexp) {
          const matchingUrls = Object.keys(requests).filter((url) => {
            return Boolean(url.match(new RegExp(regexp)))
          })
          matchingUrls.forEach((url) => {
            requests[url].xhr.abort()
          })
        },
        fileUpload (options = {}) {
          console.warn('Deprecation Warning: fileUpload method is now deprecated. Use uploadFile instead')
          options.url = moduleOptions.baseUrl + options.url

          return new FileUpload(options)
        },
        uploadFile (url, files, options = {}) {
          options.url = moduleOptions.baseUrl + url

          return new FileUpload(options).send(files)
        }
      }
    }

    if (context.debugger) {
      context.debugger.wrapProvider('http')
    }

    return context
  }
  return HttpProvider
}
