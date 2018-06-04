/* eslint-env serviceworker */

/* cache resources on install */
self.addEventListener('install', e => {
  const resources = [
    'manifest.json',
    'index.html',
    'restaurant.html',
    'css/styles.css',
    'data/restaurants.json',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js'
  ]

  e.waitUntil(caches.open('cache-v2').then(cache => cache.addAll(resources)))

  /* delete old cache from stage one */
  caches.delete('cache-v1')
})

/* Hijacking fetch requests */
self.addEventListener('fetch', e => e.respondWith(
  self.fetch(e.request).then(
    response => {
      if (new URL(e.request.url).host !== 'localhost:1337') { caches.open('cache-v2').then(cache => cache.put(makeCachable(e.request), response)) }
      return response.clone()
    },
    () => caches.match(makeCachable(e.request)).then(
      response => response || new NotFoundResponse()
    )
  )
))

/* generates a cachable request for the images that ignores sizes */
function makeCachable (request) {
  request = request.clone()

  const url = new URL(request.url)

  if (url.host === self.location.host) {
    const [directory, file] = sliceAtLast(url.pathname, '/', true)
    const [fileName, fileExt] = sliceAtLast(file, '.')
    const imgName = sliceAtLast(fileName, '-')[0]
    const imgExts = ['jpg']

    if (directory === 'img' && fileExt in imgExts) {
      url.pathname = `${directory}/${imgName}`
      request.url = url.href
    }
  }

  return request
}

/* slice a string at the last occurance of a separator */
function sliceAtLast (string, separator, last = false) {
  const position = string.lastIndexOf(separator)
  if (position > -1) return [string.slice(0, position), string.slice(position + 1)]
  return last ? ['', string] : [string, '']
}

/* NotFoundResponse class definition */
class NotFoundResponse extends self.Response {
  constructor () {
    super(null, {
      status: 404,
      statusText: 'Not Found'
    })
  }
}
