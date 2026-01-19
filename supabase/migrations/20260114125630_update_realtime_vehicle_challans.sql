-- 1️⃣ Ensure the realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2️⃣ Add vehicle_challans table to realtime publication
-- (Safe even if the table is already added)
ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_challans;

-- 3️⃣ Ensure Row Level Security is enabled
ALTER TABLE vehicle_challans ENABLE ROW LEVEL SECURITY;

-- 4️⃣ Allow SELECT for realtime broadcasts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vehicle_challans'
      AND policyname = 'Realtime Select Access'
  ) THEN
    CREATE POLICY "Realtime Select Access"
      ON vehicle_challans
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- 5️⃣ Allow INSERT & UPDATE events to be broadcast (optional but recommended)
DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vehicle_challans'
      AND policyname = 'Realtime Insert Access'
  ) THEN
    CREATE POLICY "Realtime Insert Access"
      ON vehicle_challans
      FOR INSERT
      WITH CHECK (true);
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vehicle_challans'
      AND policyname = 'Realtime Update Access'
  ) THEN
    CREATE POLICY "Realtime Update Access"
      ON vehicle_challans
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
