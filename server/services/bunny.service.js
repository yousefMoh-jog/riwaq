import { pool } from "../config/db.js";

export { generateSignedUrl, generateSignedEmbedUrl } from "../lib/bunny.service.js";

export async function checkBunnyVideoStatus(videoId) {
  try {
    const libraryId = (process.env.BUNNY_LIBRARY_ID ?? "").trim();
    const apiKey = (process.env.BUNNY_API_KEY ?? "").trim();
    const streamBase = (process.env.BUNNY_STREAM_BASE ?? "").trim();

    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      { headers: { AccessKey: apiKey, Accept: "application/json" } }
    );

    if (!res.ok) return false;

    const data = await res.json();
    if (data.status !== 4) return false;

    const thumbnailUrl = `https://${streamBase}/${videoId}/thumbnail.jpg`;
    const durationSeconds = data.length ? Math.round(data.length) : null;

    await pool.query(
      `UPDATE video_assets
       SET status = 'ready', duration_seconds = $1, thumbnail_url = $2
       WHERE bunny_video_id = $3`,
      [durationSeconds, thumbnailUrl, videoId]
    );

    console.log(`BUNNY POLL: video ${videoId} is ready`);
    return true;
  } catch (err) {
    console.error(`BUNNY POLL error for ${videoId}:`, err.message);
    return false;
  }
}

export function startBunnyPolling(videoId) {
  let attempts = 0;
  const MAX_ATTEMPTS = 60;

  const interval = setInterval(async () => {
    attempts++;
    const ready = await checkBunnyVideoStatus(videoId);
    if (ready || attempts >= MAX_ATTEMPTS) {
      clearInterval(interval);
      if (!ready) {
        console.warn(
          `BUNNY POLL: stopped after ${MAX_ATTEMPTS} attempts for video ${videoId}`
        );
      }
    }
  }, 10000);
}
