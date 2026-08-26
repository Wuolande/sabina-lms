-- ====================================================================
-- MIGRATION 021: Student Billing, Invoices & Payment Methods Schema
-- ====================================================================

-- 1. Student Payment Methods table
CREATE TABLE IF NOT EXISTS public.student_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    card_brand TEXT NOT NULL DEFAULT 'Visa',
    last4 TEXT NOT NULL DEFAULT '4242',
    exp_month INT NOT NULL DEFAULT 12,
    exp_year INT NOT NULL DEFAULT 2028,
    is_default BOOLEAN NOT NULL DEFAULT false,
    stripe_payment_method_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add billing profile columns to student_profiles if not present
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS billing_name TEXT,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS billing_country TEXT;

-- Seed default payment method for Alex Rivera if empty
INSERT INTO public.student_payment_methods (student_id, card_brand, last4, exp_month, exp_year, is_default)
SELECT 'd70e4403-eb27-480f-bf70-d3da639c4b4c'::UUID, 'Visa', '4242', 8, 2028, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.student_payment_methods WHERE student_id = 'd70e4403-eb27-480f-bf70-d3da639c4b4c'::UUID
);

-- 3. Stored Procedure: get_student_billing_360
CREATE OR REPLACE FUNCTION public.get_student_billing_360(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_profile RECORD;
    v_invoices JSONB;
    v_methods JSONB;
    v_total_spent NUMERIC := 0;
    v_total_invoices INT := 0;
    v_paid_invoices INT := 0;
    result JSONB;
BEGIN
    -- Fetch student user
    SELECT id, email, display_name, country
    INTO v_student
    FROM public.users
    WHERE id = p_student_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Fetch student profile
    SELECT * INTO v_profile
    FROM public.student_profiles
    WHERE user_id = p_student_id;

    -- Aggregate invoices from bookings
    SELECT 
        COALESCE(SUM(b.price), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE b.payment_status = 'PAID')
    INTO v_total_spent, v_total_invoices, v_paid_invoices
    FROM public.bookings b
    WHERE b.student_id = p_student_id;

    -- Build invoices list
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', 'INV-' || TO_CHAR(b.created_at, 'YYYYMM') || '-' || SUBSTR(b.id::text, 1, 4),
        'bookingId', b.id,
        'bookingRef', b.booking_ref,
        'date', b.created_at,
        'sessionDate', b.start_time,
        'durationMinutes', b.duration_minutes,
        'subjectName', b.subject_name,
        'tutorId', b.tutor_id,
        'tutorName', COALESCE(tu.display_name, 'Instructor'),
        'tutorAvatar', tu.avatar_url,
        'amount', b.price,
        'currency', b.currency,
        'status', b.payment_status,
        'paymentMethod', COALESCE(b.payment_method, 'card'),
        'lessonStatus', b.status
    ) ORDER BY b.created_at DESC), '[]'::jsonb)
    INTO v_invoices
    FROM public.bookings b
    LEFT JOIN public.tutor_profiles tp ON tp.id = b.tutor_id
    LEFT JOIN public.users tu ON tu.id = tp.user_id
    WHERE b.student_id = p_student_id;

    -- Build payment methods list
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', pm.id,
        'cardBrand', pm.card_brand,
        'last4', pm.last4,
        'expMonth', pm.exp_month,
        'expYear', pm.exp_year,
        'isDefault', pm.is_default,
        'createdAt', pm.created_at
    ) ORDER BY pm.is_default DESC, pm.created_at DESC), '[]'::jsonb)
    INTO v_methods
    FROM public.student_payment_methods pm
    WHERE pm.student_id = p_student_id;

    -- Build 360 result
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'totalSpent', v_total_spent,
            'totalInvoices', v_total_invoices,
            'paidInvoices', v_paid_invoices,
            'averagePerLesson', CASE WHEN v_total_invoices > 0 THEN ROUND(v_total_spent / v_total_invoices, 2) ELSE 0 END,
            'currency', 'USD'
        ),
        'invoices', v_invoices,
        'paymentMethods', v_methods,
        'billingProfile', jsonb_build_object(
            'billingName', COALESCE(v_profile.billing_name, v_student.display_name),
            'billingEmail', COALESCE(v_profile.billing_email, v_student.email),
            'taxId', COALESCE(v_profile.tax_id, ''),
            'addressLine1', COALESCE(v_profile.address_line1, '742 Evergreen Terrace'),
            'city', COALESCE(v_profile.city, 'Springfield'),
            'postalCode', COALESCE(v_profile.postal_code, '97477'),
            'country', COALESCE(v_profile.billing_country, v_student.country, 'United States')
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 4. Stored Procedure: add_student_payment_method
CREATE OR REPLACE FUNCTION public.add_student_payment_method(
    p_student_id UUID,
    p_card_brand TEXT,
    p_last4 TEXT,
    p_exp_month INT,
    p_exp_year INT,
    p_is_default BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    IF p_is_default THEN
        UPDATE public.student_payment_methods
        SET is_default = false
        WHERE student_id = p_student_id;
    END IF;

    INSERT INTO public.student_payment_methods (
        student_id, card_brand, last4, exp_month, exp_year, is_default
    ) VALUES (
        p_student_id, p_card_brand, p_last4, p_exp_month, p_exp_year, p_is_default
    ) RETURNING id INTO v_new_id;

    RETURN public.get_student_billing_360(p_student_id);
END;
$$;

-- 5. Stored Procedure: delete_student_payment_method
CREATE OR REPLACE FUNCTION public.delete_student_payment_method(
    p_student_id UUID,
    p_method_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.student_payment_methods
    WHERE id = p_method_id AND student_id = p_student_id;

    -- Ensure at least one remaining method is default if any exist
    IF NOT EXISTS (SELECT 1 FROM public.student_payment_methods WHERE student_id = p_student_id AND is_default = true) THEN
        UPDATE public.student_payment_methods
        SET is_default = true
        WHERE id = (SELECT id FROM public.student_payment_methods WHERE student_id = p_student_id ORDER BY created_at DESC LIMIT 1);
    END IF;

    RETURN public.get_student_billing_360(p_student_id);
END;
$$;

-- 6. Stored Procedure: set_default_payment_method
CREATE OR REPLACE FUNCTION public.set_default_payment_method(
    p_student_id UUID,
    p_method_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.student_payment_methods
    SET is_default = false
    WHERE student_id = p_student_id;

    UPDATE public.student_payment_methods
    SET is_default = true
    WHERE id = p_method_id AND student_id = p_student_id;

    RETURN public.get_student_billing_360(p_student_id);
END;
$$;

-- 7. Stored Procedure: update_student_billing_profile
CREATE OR REPLACE FUNCTION public.update_student_billing_profile(
    p_student_id UUID,
    p_billing_name TEXT,
    p_billing_email TEXT,
    p_tax_id TEXT,
    p_address_line1 TEXT,
    p_city TEXT,
    p_postal_code TEXT,
    p_country TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.student_profiles
    SET
        billing_name = p_billing_name,
        billing_email = p_billing_email,
        tax_id = p_tax_id,
        address_line1 = p_address_line1,
        city = p_city,
        postal_code = p_postal_code,
        billing_country = p_country,
        updated_at = now()
    WHERE user_id = p_student_id;

    RETURN public.get_student_billing_360(p_student_id);
END;
$$;
