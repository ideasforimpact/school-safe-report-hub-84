-- Create vehicle_certificate_renewals table
-- Tracks FC / Insurance / Pollution certificate renewals detected via RC verification,
-- recording the previous certificate's expiry and the new certificate's dates so that
-- renewal gaps (renewed after the previous certificate expired) can be reported.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vehicle_certificate_renewals'
  ) THEN
    CREATE TABLE public.vehicle_certificate_renewals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id uuid NOT NULL,
      client_id uuid,
      document_type text NOT NULL CHECK (document_type IN ('fitness', 'insurance', 'pollution')),
      previous_end_date date,
      renew_start_date date NOT NULL,
      renew_end_date date NOT NULL,
      renewal_gap_days integer GENERATED ALWAYS AS (GREATEST((renew_start_date - previous_end_date), 0)) STORED,
      verification_timestamp timestamptz NOT NULL,
      source text NOT NULL DEFAULT 'auto_rc_verification',
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_vehicle_certificate_renewals_event UNIQUE (vehicle_id, document_type, verification_timestamp)
    );

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
      ALTER TABLE public.vehicle_certificate_renewals
        ADD CONSTRAINT vehicle_certificate_renewals_vehicle_id_fkey
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      ALTER TABLE public.vehicle_certificate_renewals
        ADD CONSTRAINT vehicle_certificate_renewals_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    CREATE INDEX idx_vehicle_certificate_renewals_vehicle_id
      ON public.vehicle_certificate_renewals USING btree (vehicle_id, document_type, created_at DESC);

    CREATE INDEX idx_vehicle_certificate_renewals_client_id
      ON public.vehicle_certificate_renewals USING btree (client_id);
  END IF;
END $$;
