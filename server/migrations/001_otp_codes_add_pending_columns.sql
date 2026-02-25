-- otp_codes: pending user data for verify-otp (code is stored but not verified; Resala sends OTP)
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- users: optional for schemas that have it
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();
