/**
 * Get a GPS fix. Resolves as soon as the accuracy is good enough, otherwise with the best reading
 * seen before the timeout. (The old teacher code waited forever if accuracy never reached the target.)
 */
export function getPosition({ timeout = 15000, targetAccuracy = 50, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device."));
    let best = null;
    let finished = false;
    let watchId = null;
    let timer = null;

    const finish = (fn) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      fn();
    };

    timer = setTimeout(
      () => finish(() => (best ? resolve(best) : reject(new Error("Could not get your location in time. Move near a window and try again.")))),
      timeout
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const current = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        if (!best || current.accuracy < best.accuracy) best = current;
        onProgress?.(current);
        if (current.accuracy <= targetAccuracy) finish(() => resolve(best));
      },
      (err) =>
        finish(() => {
          if (best) return resolve(best);
          reject(new Error(err.code === 1 ? "Location permission denied. Please allow location access and try again." : "Could not get your location. Please try again."));
        }),
      { enableHighAccuracy: true, maximumAge: 0, timeout }
    );
  });
}
