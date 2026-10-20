const STORAGE_KEY = "pedemoca-pending-checkout";
const MAX_AGE_MS = 30 * 60 * 1000;

function isValidPayload(payload) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    typeof payload.checkoutToken === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.checkoutToken) &&
    Array.isArray(payload.items) &&
    payload.items.length > 0
  );
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;

  if (!a || !b || typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual(a[key], b[key])
  );
}

function samePurchase(saved, current) {
  if (!isValidPayload(saved) || !current || typeof current !== "object" ||
      Array.isArray(current) || !Array.isArray(current.items) ||
      current.items.length === 0 ||
      (current.checkoutToken !== undefined && !isValidPayload(current))) {
    return false;
  }

  const { checkoutToken: savedToken, savedAt, ...savedDetails } = saved;
  const { checkoutToken: currentToken, ...currentDetails } = current;

  return (
    (currentToken === undefined || savedToken === currentToken) &&
    deepEqual(savedDetails, currentDetails)
  );
}

function isWithinExpiry(saved) {
  return (
    typeof saved?.savedAt === "number" &&
    Number.isFinite(saved.savedAt) &&
    saved.savedAt > 0 &&
    saved.savedAt <= Date.now() &&
    Date.now() - saved.savedAt <= MAX_AGE_MS
  );
}

export function savePendingCheckout(payload) {
  if (!isValidPayload(payload)) return false;

  try {
    const existing = localStorage.getItem(STORAGE_KEY);

    if (existing !== null) {
      const saved = JSON.parse(existing);

      if (saved?.status === "sent") return false;

      if (isWithinExpiry(saved)) {
        return samePurchase(saved, payload);
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...payload, savedAt: Date.now() })
      );

      return true;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );

    return true;
  } catch {
    return false;
  }
}

export function getPendingCheckout(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      !Array.isArray(payload.items) || payload.items.length === 0 ||
      (payload.checkoutToken !== undefined && !isValidPayload(payload))) {
    return null;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!isWithinExpiry(saved) || !samePurchase(saved, payload)) {
      return null;
    }

    const { savedAt, ...originalPayload } = saved;
    return originalPayload;
  } catch {
    return null;
  }
}
