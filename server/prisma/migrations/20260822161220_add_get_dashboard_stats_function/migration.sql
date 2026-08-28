CREATE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  "publishedAnnouncements" BIGINT,
  "publishedEvents"        BIGINT,
  "totalQuickLinks"        BIGINT,
  "totalBanners"           BIGINT,
  "totalResources"         BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    (SELECT COUNT(*) FROM announcement WHERE status = 'Published') AS "publishedAnnouncements",
    (SELECT COUNT(*) FROM event WHERE status = 'Published')        AS "publishedEvents",
    (SELECT COUNT(*) FROM quick_link)                              AS "totalQuickLinks",
    (SELECT COUNT(*) FROM banner)                                  AS "totalBanners",
    (SELECT COUNT(*) FROM resource)                                AS "totalResources";
$$;
