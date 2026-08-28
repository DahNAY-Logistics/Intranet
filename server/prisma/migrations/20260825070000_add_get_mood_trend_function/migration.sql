DROP FUNCTION IF EXISTS get_mood_trend(INT);
DROP FUNCTION IF EXISTS get_mood_trend(INT, INT);

CREATE FUNCTION get_mood_trend(days_back INT, max_ticks INT)
RETURNS TABLE (
  "date"      DATE,
  "label"     TEXT,
  "axisLabel" TEXT,
  "isTick"    BOOLEAN,
  "VeryHappy" BIGINT,
  "Happy"     BIGINT,
  "Neutral"   BIGINT,
  "Sad"       BIGINT,
  "VerySad"   BIGINT
)
LANGUAGE sql STABLE
AS $$
  WITH counted AS (
    SELECT
      series.day::date AS day,
      COUNT(*) FILTER (WHERE me.mood = 'VeryHappy') AS very_happy,
      COUNT(*) FILTER (WHERE me.mood = 'Happy')     AS happy,
      COUNT(*) FILTER (WHERE me.mood = 'Neutral')   AS neutral,
      COUNT(*) FILTER (WHERE me.mood = 'Sad')       AS sad,
      COUNT(*) FILTER (WHERE me.mood = 'VerySad')   AS very_sad
    FROM generate_series(
      ((now() AT TIME ZONE 'UTC')::date - (days_back - 1)),
      ((now() AT TIME ZONE 'UTC')::date),
      interval '1 day'
    ) AS series(day)
    LEFT JOIN mood_entry me ON me.date = series.day::date
    GROUP BY series.day::date
  ),
  indexed AS (
    SELECT
      counted.*,
      (ROW_NUMBER() OVER (ORDER BY day) - 1)::int AS idx,
      (COUNT(*) OVER ())::int                     AS total
    FROM counted
  )
  SELECT
    day AS "date",
    to_char(day, 'FMMon FMDD') AS "label",
    to_char(day, 'FMDD')       AS "axisLabel",
    CASE
      WHEN total <= max_ticks THEN TRUE
      ELSE idx = 0
        OR (total - 1 - idx) % GREATEST(CEIL((total - 1)::numeric / GREATEST(max_ticks - 1, 1))::int, 1) = 0
    END AS "isTick",
    very_happy AS "VeryHappy",
    happy      AS "Happy",
    neutral    AS "Neutral",
    sad        AS "Sad",
    very_sad   AS "VerySad"
  FROM indexed
  ORDER BY day;
$$;
