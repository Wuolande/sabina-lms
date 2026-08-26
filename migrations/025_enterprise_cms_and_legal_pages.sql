-- ====================================================================
-- MIGRATION 025: Enterprise CMS Platform & Legal Pages Suite
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.platform_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'legal', -- 'legal', 'company', 'system', 'custom'
    meta_title VARCHAR(255),
    meta_description TEXT,
    content_html TEXT NOT NULL,
    content_json JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT true,
    reading_time_minutes INT DEFAULT 5,
    last_reviewed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_platform_pages_slug ON public.platform_pages(slug);
CREATE INDEX IF NOT EXISTS idx_platform_pages_category ON public.platform_pages(category);
CREATE INDEX IF NOT EXISTS idx_platform_pages_published ON public.platform_pages(is_published);

-- Stored Procedure: get_cms_page_by_slug
CREATE OR REPLACE FUNCTION public.get_cms_page_by_slug(p_slug VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'slug', slug,
        'title', title,
        'category', category,
        'metaTitle', meta_title,
        'metaDescription', meta_description,
        'contentHtml', content_html,
        'contentJson', content_json,
        'isPublished', is_published,
        'readingTimeMinutes', reading_time_minutes,
        'lastReviewedAt', last_reviewed_at,
        'createdAt', created_at,
        'updatedAt', updated_at
    ) INTO result
    FROM public.platform_pages
    WHERE slug = p_slug;

    RETURN result;
END;
$$;

-- Stored Procedure: list_cms_pages
CREATE OR REPLACE FUNCTION public.list_cms_pages(
    p_category VARCHAR DEFAULT NULL,
    p_search VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'slug', slug,
        'title', title,
        'category', category,
        'metaTitle', meta_title,
        'metaDescription', meta_description,
        'isPublished', is_published,
        'readingTimeMinutes', reading_time_minutes,
        'lastReviewedAt', last_reviewed_at,
        'updatedAt', updated_at
    ) ORDER BY category ASC, title ASC), '[]'::jsonb)
    INTO result
    FROM public.platform_pages
    WHERE (p_category IS NULL OR category = p_category)
      AND (p_search IS NULL OR title ILIKE '%' || p_search || '%' OR slug ILIKE '%' || p_search || '%');

    RETURN result;
END;
$$;

-- Stored Procedure: upsert_cms_page
CREATE OR REPLACE FUNCTION public.upsert_cms_page(
    p_page JSONB,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slug VARCHAR;
    v_id UUID;
    result JSONB;
BEGIN
    v_slug := p_page->>'slug';

    IF v_slug IS NULL OR length(trim(v_slug)) = 0 THEN
        RAISE EXCEPTION 'Slug cannot be empty';
    END IF;

    INSERT INTO public.platform_pages (
        slug,
        title,
        category,
        meta_title,
        meta_description,
        content_html,
        content_json,
        is_published,
        reading_time_minutes,
        last_reviewed_at,
        updated_at,
        updated_by
    ) VALUES (
        lower(trim(v_slug)),
        COALESCE(p_page->>'title', 'Untitled Page'),
        COALESCE(p_page->>'category', 'custom'),
        p_page->>'metaTitle',
        p_page->>'metaDescription',
        COALESCE(p_page->>'contentHtml', '<p>New page content...</p>'),
        COALESCE(p_page->'contentJson', '{}'::jsonb),
        COALESCE((p_page->>'isPublished')::boolean, true),
        COALESCE((p_page->>'readingTimeMinutes')::int, 5),
        now(),
        now(),
        p_admin_id
    )
    ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        meta_title = EXCLUDED.meta_title,
        meta_description = EXCLUDED.meta_description,
        content_html = EXCLUDED.content_html,
        content_json = EXCLUDED.content_json,
        is_published = EXCLUDED.is_published,
        reading_time_minutes = EXCLUDED.reading_time_minutes,
        last_reviewed_at = now(),
        updated_at = now(),
        updated_by = p_admin_id
    RETURNING id INTO v_id;

    RETURN public.get_cms_page_by_slug(lower(trim(v_slug)));
END;
$$;

-- Stored Procedure: delete_cms_page
CREATE OR REPLACE FUNCTION public.delete_cms_page(
    p_page_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.platform_pages
    WHERE id = p_page_id
      AND category NOT IN ('legal', 'system');

    RETURN FOUND;
END;
$$;
