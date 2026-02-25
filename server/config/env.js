export function validateEnv() {
  const required = [
    "JWT_SECRET",
    "DATABASE_URL",
    "BUNNY_LIBRARY_ID",
    "BUNNY_API_KEY",
    "BUNNY_TOKEN_KEY",
    "BUNNY_STREAM_BASE",
  ];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.error(
      `[STARTUP] Missing required environment variables: ${missing.join(", ")}\nAdd them to server/.env and restart.`
    );
    process.exit(1);
  }
  console.log("[STARTUP] Environment validation passed.");
}
