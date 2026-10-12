import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cached = null;

/** Stable per-device id used by the server to spot one phone being used for several students. */
export async function getFingerprint() {
  if (cached) return cached;
  const stored = localStorage.getItem("uiet.deviceId");
  if (stored) return (cached = stored);
  const agent = await FingerprintJS.load();
  const { visitorId } = await agent.get();
  localStorage.setItem("uiet.deviceId", visitorId);
  return (cached = visitorId);
}
