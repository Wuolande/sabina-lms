-- ====================================================================
-- MIGRATION 001: Core Identity, Users & Role-Based Access Control (RBAC)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. Custom Enums
DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'INCOMPLETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table (Application Profile referencing auth.users if available, or standalone UUIDs)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    country VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    status user_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id VARCHAR(50) PRIMARY KEY, -- 'SUPER_ADMIN', 'ADMIN', 'TUTOR', 'STUDENT'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'tutors.view', 'tutors.update', 'tutor_applications.approve'
    module VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 6. User Roles Mapping
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
