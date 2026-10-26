import { RegisteredDevice, User } from '../types';

const DEVICE_ID_KEY = 'betodafruta_device_id';
const BOUND_USER_ID_KEY = 'betodafruta_bound_user_id';

/**
 * Generates or retrieves a unique persistent identifier for this browser/device.
 */
export function getOrCreateDeviceId(): string {
  try {
    let existing = localStorage.getItem(DEVICE_ID_KEY);
    if (!existing) {
      const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
      const timePart = Date.now().toString(36).toUpperCase();
      existing = `DEV-${randomPart}-${timePart}`;
      localStorage.setItem(DEVICE_ID_KEY, existing);
    }
    return existing;
  } catch {
    return 'DEV-LOCAL-FALLBACK';
  }
}

/**
 * Detects a human-friendly description of the current device and browser.
 */
export function getDeviceDetails(): { nomeAparelho: string; plataforma: string } {
  if (typeof navigator === 'undefined') {
    return { nomeAparelho: 'Dispositivo Padrão', plataforma: 'Web' };
  }

  const ua = navigator.userAgent || '';

  let os = 'Dispositivo';
  if (/android/i.test(ua)) {
    const modelMatch = ua.match(/Android\s+[\d.]+;\s*([^;)]+)/i);
    const model = modelMatch && modelMatch[1] ? modelMatch[1].replace(/Build\/.*$/i, '').trim() : '';
    os = model ? `Android (${model})` : 'Celular Android';
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os = /iPad/.test(ua) ? 'iPad (iOS)' : 'iPhone (iOS)';
  } else if (/Windows/i.test(ua)) {
    os = 'Computador Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'Mac';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  let browser = 'Navegador';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  }

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const plataforma = isMobile ? 'Celular / Mobile' : 'Computador / Desktop';

  return {
    nomeAparelho: `${os} • ${browser}`,
    plataforma,
  };
}

/**
 * Returns the user ID locally bound to this device, if any.
 */
export function getLocalBoundUserId(): string | null {
  try {
    return localStorage.getItem(BOUND_USER_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets or clears the locally bound user ID on this device.
 */
export function setLocalBoundUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(BOUND_USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(BOUND_USER_ID_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Binds the current device to the specified user profile (and removes this deviceId from any other user).
 * Returns the updated User[] array and the updated target User.
 */
export function bindCurrentDeviceToUser(
  users: User[],
  userId: string,
  customDeviceName?: string
): { updatedUsers: User[]; updatedUser: User | null; device: RegisteredDevice } {
  const deviceId = getOrCreateDeviceId();
  const details = getDeviceDetails();
  const now = new Date().toISOString();

  let targetDevice: RegisteredDevice = {
    deviceId,
    nomeAparelho: customDeviceName?.trim() || details.nomeAparelho,
    plataforma: details.plataforma,
    vinculadoEm: now,
    ultimoAcesso: now,
  };

  let updatedUser: User | null = null;

  const updatedUsers = users.map((u) => {
    const currentDevices = u.dispositivosVinculados || [];

    if (u.id === userId) {
      const existing = currentDevices.find((d) => d.deviceId === deviceId);
      if (existing) {
        targetDevice = {
          ...existing,
          nomeAparelho: customDeviceName?.trim() || existing.nomeAparelho || details.nomeAparelho,
          ultimoAcesso: now,
        };
      }
      const filtered = currentDevices.filter((d) => d.deviceId !== deviceId);
      const nextUser: User = {
        ...u,
        dispositivosVinculados: [targetDevice, ...filtered],
      };
      updatedUser = nextUser;
      return nextUser;
    } else {
      // Ensure one physical device is only auto-logged into one employee at a time
      if (currentDevices.some((d) => d.deviceId === deviceId)) {
        return {
          ...u,
          dispositivosVinculados: currentDevices.filter((d) => d.deviceId !== deviceId),
        };
      }
      return u;
    }
  });

  setLocalBoundUserId(userId);

  // Sync asynchronously with server so other devices / management see the binding
  fetch('/api/devices/bind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      device: targetDevice,
    }),
  }).catch(() => {
    // Offline fallback is already handled via localStorage
  });

  return { updatedUsers, updatedUser, device: targetDevice };
}

/**
 * Unbinds a specific deviceId from a user's profile.
 */
export function unbindDeviceFromUser(
  users: User[],
  userId: string,
  deviceIdToRemove: string
): User[] {
  const currentDeviceId = getOrCreateDeviceId();
  if (deviceIdToRemove === currentDeviceId) {
    setLocalBoundUserId(null);
  }

  const updatedUsers = users.map((u) => {
    if (u.id === userId) {
      const currentDevices = u.dispositivosVinculados || [];
      return {
        ...u,
        dispositivosVinculados: currentDevices.filter((d) => d.deviceId !== deviceIdToRemove),
      };
    }
    return u;
  });

  fetch('/api/devices/unbind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      deviceId: deviceIdToRemove,
    }),
  }).catch(() => {
    // Offline fallback
  });

  return updatedUsers;
}

/**
 * Finds the user who owns the current device so the system can log them in automatically.
 */
export function findUserBoundToCurrentDevice(users: User[]): User | null {
  const deviceId = getOrCreateDeviceId();

  // 1. Check if any user has this deviceId in their dispositivosVinculados list
  const matchedByProfile = users.find((u) =>
    (u.dispositivosVinculados || []).some((d) => d.deviceId === deviceId)
  );
  if (matchedByProfile) {
    setLocalBoundUserId(matchedByProfile.id);
    return matchedByProfile;
  }

  // 2. Fallback to local bound user ID if present
  const localBoundId = getLocalBoundUserId();
  if (localBoundId) {
    const matchedByLocalId = users.find((u) => u.id === localBoundId);
    if (matchedByLocalId) {
      return matchedByLocalId;
    }
  }

  return null;
}
