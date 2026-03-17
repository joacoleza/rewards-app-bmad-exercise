-- ============================================================
-- Append-Only Permissions for audit_logs Table
-- ============================================================
-- 
-- RATIONALE:
-- The audit_logs table serves as the compliance audit trail for
-- the application (NFR10, FR26-FR30). Audit records MUST be
-- immutable — once written, they cannot be modified or deleted
-- through the application. This is enforced at the PostgreSQL
-- permission level, not application logic, providing defense
-- in depth against accidental or malicious data modification.
--
-- USAGE:
-- 1. Run this script as a PostgreSQL superuser (e.g., postgres)
-- 2. Replace 'app_user' with your application's database role
-- 3. In Docker Compose dev, you can mount this as an init script
--    or run manually: psql -U postgres -d bmad -f setup-db-permissions.sql
--
-- NOTE: The default Docker Compose dev setup uses the 'postgres'
-- superuser role which bypasses permission checks. For production,
-- create a dedicated application role with limited privileges.
-- ============================================================

-- Create the application role if it doesn't exist
-- (In production, this role should already exist with appropriate privileges)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
  END IF;
END
$$;

-- Grant basic connection privileges
GRANT CONNECT ON DATABASE bmad TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant full CRUD on most tables (users, future tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Override: Restrict audit_logs to INSERT and SELECT only (append-only)
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;

-- Grant sequence usage (needed for serial/auto-increment columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Ensure future tables also get default grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ============================================================
-- VERIFICATION:
-- Run the following to confirm permissions:
--
--   SELECT grantee, privilege_type 
--   FROM information_schema.table_privileges 
--   WHERE table_name = 'audit_logs' AND grantee = 'app_user';
--
-- Expected result: INSERT and SELECT only (no UPDATE, no DELETE)
-- ============================================================
