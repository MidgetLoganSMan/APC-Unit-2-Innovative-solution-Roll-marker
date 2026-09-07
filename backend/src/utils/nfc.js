import HttpError from './httpError.js';

export function normalizeTagId(value) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'NFC tag ID is required');
  }

  const tagId = value
    .trim()
    .replace(/^(?:CARD\s*)?UID\s*[:#-]?\s*/i, '')
    .replace(/[\s:]/g, '')
    .toUpperCase();

  if (!tagId || tagId.length > 128 || !/^[A-Z0-9-]+$/.test(tagId)) {
    throw new HttpError(400, 'NFC tag ID is invalid');
  }

  return tagId;
}

export function startOfToday(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
