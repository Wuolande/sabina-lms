-- ====================================================================
-- MIGRATION 002: Audit Logging & File Asset Tracking
-- ====================================================================

-- 1. Audit Logs (Immutable append-only log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name VARCHAR(200),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- e.g. 'TUTOR_APPROVED', 'TUTOR_SUSPENDED'
    entity_type VARCHAR(100) NOT NULL, -- e.g. 'TUTOR_APPLICATION', 'TUTOR_PROFILE'
    entity_id VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. File Assets (Cloudinary & local uploads tracking)
CREATE TABLE IF NOT EXISTS public.file_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    public_id VARCHAR(255) NOT NULL UNIQUE,
    secure_url TEXT NOT NULL,
    resource_type VARCHAR(50) NOT NULL DEFAULT 'image',
    format VARCHAR(20),
    mime_type VARCHAR(100),
    bytes BIGINT,
    folder VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at_desc ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_assets_owner ON public.file_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_assets_entity ON public.file_assets(entity_type, entity_id);
