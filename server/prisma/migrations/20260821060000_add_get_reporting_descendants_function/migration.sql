CREATE FUNCTION get_reporting_descendants(root_id TEXT)
RETURNS TABLE (descendant_id TEXT)
LANGUAGE sql STABLE
AS $$
  WITH RECURSIVE descendants AS (
    SELECT id AS descendant_id FROM "user" WHERE "reportedToId" = root_id
    UNION
    SELECT u.id FROM "user" u JOIN descendants d ON u."reportedToId" = d.descendant_id
  )
  SELECT descendant_id FROM descendants;
$$;
