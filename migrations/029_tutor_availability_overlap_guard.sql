-- ====================================================================
-- MIGRATION 029: Tutor Availability Overlap Guard & Integrity
-- ====================================================================

CREATE OR REPLACE FUNCTION public.save_tutor_availability_atomic(
    p_tutor_id UUID,
    p_rules JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r JSONB;
    v_day INT;
    v_start TIME;
    v_end TIME;
    v_active BOOLEAN;
    v_conflict_count INT;
    v_inserted INT := 0;
BEGIN
    -- 1. Check permissions / parameters
    IF p_tutor_id IS NULL THEN
        RAISE EXCEPTION 'Tutor ID cannot be null';
    END IF;

    -- 2. Clear previous recurring rules for this tutor
    DELETE FROM public.tutor_availability_rules
    WHERE tutor_id = p_tutor_id;

    -- 3. Iterate through rules array and insert with strict validation
    FOR r IN SELECT * FROM jsonb_array_elements(p_rules)
    LOOP
        v_day := (r->>'dayOfWeek')::INT;
        v_start := (r->>'startTime')::TIME;
        v_end := (r->>'endTime')::TIME;
        v_active := COALESCE((r->>'isActive')::BOOLEAN, true);

        -- Validate start < end
        IF v_active THEN
            IF v_start >= v_end THEN
                RAISE EXCEPTION 'Invalid shift on day %: start time (%) must be strictly before end time (%)',
                    v_day, v_start, v_end;
            END IF;

            -- Check pairwise interval overlap against already inserted shifts for this day
            SELECT COUNT(*) INTO v_conflict_count
            FROM public.tutor_availability_rules
            WHERE tutor_id = p_tutor_id
              AND day_of_week = v_day
              AND is_active = true
              AND (start_time < v_end AND end_time > v_start);

            IF v_conflict_count > 0 THEN
                RAISE EXCEPTION 'Overlapping shift detected on day %: interval (% - %) conflicts with an existing shift',
                    v_day, v_start, v_end;
            END IF;

            -- Insert non-conflicting rule
            INSERT INTO public.tutor_availability_rules (
                tutor_id,
                day_of_week,
                start_time,
                end_time,
                is_active
            ) VALUES (
                p_tutor_id,
                v_day,
                v_start,
                v_end,
                true
            );

            v_inserted := v_inserted + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'insertedCount', v_inserted,
        'totalReceived', jsonb_array_length(p_rules)
    );
END;
$$;
