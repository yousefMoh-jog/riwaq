# OTP Architecture Verification

## Architecture (correct)

- **Frontend** → **Backend** → **Resala**
- Frontend never calls `dev.resala.ly`. Frontend only calls:
  - `POST /auth/request-otp` with `{ phone: "+2189XXXXXXXX" }`
  - `POST /auth/verify-otp` with `{ phone: "+2189XXXXXXXX", code: "1234" }`
- Backend calls Resala:
  - `POST https://dev.resala.ly/api/v1/pins?service_name=rewaq&len=4&autofill=%23ABC-01234`
  - Headers: `Authorization: Bearer RESALA_TOKEN`, `Content-Type: application/json`
  - Body: `{ phone: phoneE164 }`
- Backend returns `{ ok: true }` to frontend on send success; `{ ok: false, messageAr: "..." }` on failure.
- Backend verifies OTP (DB), then issues JWT (`accessToken`, `refreshToken`, `user`).

## Env

**Frontend (.env or .env.local)**

- `VITE_API_URL=http://localhost:8000/api/v1` (or your backend base URL)
- Do **not** set `VITE_RESALA_TOKEN` or any Resala env in frontend.

**Backend (.env)**

- `RESALA_TOKEN=<token from Resala>`
- `RESALA_BASE=https://dev.resala.ly`
- `JWT_SECRET=<secret>`
- `DATABASE_URL=<postgres URL>`
- Optional: `JWT_ACCESS_EXPIRY=15m`, `JWT_REFRESH_EXPIRY=7d`

## Verification checklist

1. **Network tab (Browser)**  
   - Open DevTools → Network.  
   - Enter phone, click “إرسال رمز التحقق”.  
   - **Only** `POST .../auth/request-otp` must appear (same origin or your API host).  
   - **No** request to `dev.resala.ly` or `resala.ly`.

2. **Request OTP returns 200 and `{ ok: true }`**  
   - Response body: `{ ok: true }`.  
   - UI moves to OTP step.

3. **Request OTP error**  
   - On backend/Resala error, response: `{ ok: false, messageAr: "..." }`.  
   - UI shows Arabic message, no Resala URL in Network.

4. **Verify OTP returns tokens**  
   - Enter valid 4-digit code, submit.  
   - Response: `{ accessToken, refreshToken?, user? }`.  
   - Frontend stores tokens and redirects.

5. **Login flow**  
   - Phone → Send code → OTP step → Enter code → Redirect/home.  
   - No reload; only `/auth/request-otp` and `/auth/verify-otp` in Network.

## Run backend + frontend

- **Backend:** `cd backend && npm run start` (or `npm run start:dev`). Default port 8000; API at `http://localhost:8000/api/v1`.
- **Frontend:** From repo root, `npm run dev`. Set `VITE_API_URL=http://localhost:8000/api/v1` so requests go to backend.
