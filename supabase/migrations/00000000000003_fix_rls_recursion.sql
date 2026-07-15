-- Fix infinite recursion in memorial_members / memorials / memorial_guardians RLS.
-- Cause: policies queried memorial_members while memorial_members policies also
-- queried memorial_members (and memorials SELECT checks memorial_members too).

-- Helper functions must run as SECURITY DEFINER so membership checks do not re-enter RLS.
CREATE OR REPLACE FUNCTION public.is_memorial_guardian(p_memorial_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_memorial_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM memorial_guardians
    WHERE memorial_id = p_memorial_id
      AND user_id = p_user_id
      AND role IN ('owner', 'guardian')
  )
  OR EXISTS (
    SELECT 1
    FROM memorials
    WHERE id = p_memorial_id
      AND deleted_at IS NULL
      AND (created_by = p_user_id OR primary_guardian_id = p_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_memorial_member(p_memorial_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_memorial_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM memorial_members
    WHERE memorial_id = p_memorial_id
      AND user_id = p_user_id
      AND status = 'approved'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_memorial_permission(
  p_memorial_id uuid,
  p_user_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_memorial_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM memorials
    WHERE id = p_memorial_id
      AND deleted_at IS NULL
      AND (created_by = p_user_id OR primary_guardian_id = p_user_id)
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM memorial_guardians
    WHERE memorial_id = p_memorial_id
      AND user_id = p_user_id
      AND (
        role = 'owner'
        OR (p_permission = 'edit' AND can_edit = true)
        OR (p_permission = 'manage_members' AND can_manage_members = true)
        OR (p_permission = 'moderate' AND can_moderate = true)
      )
  );
END;
$$;

-- memorial_members: remove self-referential EXISTS
DROP POLICY IF EXISTS "members_select_authorized" ON public.memorial_members;
CREATE POLICY "members_select_authorized"
  ON public.memorial_members FOR SELECT
  TO authenticated
  USING (
    user_id = get_auth_user_id()
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR is_memorial_member(memorial_id, get_auth_user_id())
  );

-- memorials: use SECURITY DEFINER helpers instead of raw EXISTS on members
DROP POLICY IF EXISTS "memorials_select_public" ON public.memorials;
CREATE POLICY "memorials_select_public"
  ON public.memorials FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (visibility = 'public' AND status IN ('active', 'archived'))
      OR created_by = get_auth_user_id()
      OR primary_guardian_id = get_auth_user_id()
      OR is_memorial_member(id, get_auth_user_id())
      OR is_memorial_guardian(id, get_auth_user_id())
    )
  );

-- memorial_guardians: avoid raw EXISTS on memorial_members
DROP POLICY IF EXISTS "guardians_select_members" ON public.memorial_guardians;
CREATE POLICY "guardians_select_members"
  ON public.memorial_guardians FOR SELECT
  TO authenticated
  USING (
    user_id = get_auth_user_id()
    OR is_memorial_member(memorial_id, get_auth_user_id())
    OR is_memorial_guardian(memorial_id, get_auth_user_id())
    OR EXISTS (
      SELECT 1
      FROM memorials m
      WHERE m.id = memorial_guardians.memorial_id
        AND m.visibility = 'public'
        AND m.status = 'active'
        AND m.deleted_at IS NULL
    )
  );
