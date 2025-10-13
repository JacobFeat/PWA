// Import the Angular service worker
importScripts('./ngsw-worker.js');
(function () {
  'use strict';

  self.addEventListener('sync', (event) => {
    console.log('Custom background sync handler');

    if (event.tag === 'background-sync') {
      event.waitUntil(doBackgroundSync());
    }
  });
  function doBackgroundSync() {
    console.log('Performing background sync task...');
    // Implement your background sync logic here
    // return fetch('https://example.com/api/sync')
    //   .then(response => response.json())
    //   .then(data => console.log('Background sync completed:', data))
    //   .catch(error => console.error('Background sync failed:', error));
  }
})();
