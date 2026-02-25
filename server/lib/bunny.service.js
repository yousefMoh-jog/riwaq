import crypto from 'crypto';

// Signed HLS playlist URL (for <video> + HLS.js)
export function generateSignedUrl(videoId) {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const tokenKey  = process.env.BUNNY_TOKEN_KEY;
  const streamBase = process.env.BUNNY_STREAM_BASE;

  if (!libraryId || !tokenKey || !streamBase) {
    throw new Error('Bunny credentials not configured');
  }

  const expires = Math.floor(Date.now() / 1000) + 3600;
  const hash = crypto
    .createHash('sha256')
    .update(tokenKey + videoId + expires)
    .digest('hex');

  return `https://${streamBase}/${videoId}/playlist.m3u8?token=${hash}&expires=${expires}`;
}

// Signed iframe embed URL (for <iframe> player)
// Token Authentication uses the same HMAC: SHA256(tokenKey + videoId + expires)
export function generateSignedEmbedUrl(videoId) {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const tokenKey  = process.env.BUNNY_TOKEN_KEY;

  if (!libraryId) throw new Error('BUNNY_LIBRARY_ID not configured');

  // If token auth is disabled (no key), return the plain embed URL
  if (!tokenKey) {
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  }

  const expires = Math.floor(Date.now() / 1000) + 3600;
  const hash = crypto
    .createHash('sha256')
    .update(tokenKey + videoId + expires)
    .digest('hex');

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${hash}&expires=${expires}`;
}
