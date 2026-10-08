-- ═══════════════════════════════════════════════════════════════════════════
-- Entity Trigger Functions — Replaces Base44 entity-triggered workflows.
-- These Supabase triggers fire on row changes and call Railway webhook listeners,
-- bypassing Base44's credit-blocked workflow engine.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Webhook dispatch function ────────────────────────────────────────────────
-- Called by triggers to notify Railway webhook listeners of entity changes.
CREATE OR REPLACE FUNCTION notify_entity_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  entity_name TEXT := TG_TABLE_NAME;
  event_type TEXT := TG_OP;
  record_id TEXT;
BEGIN
  -- Get record ID (handles both UUID and text ID columns)
  record_id := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.id::text
    ELSE NEW.id::text
  END;

  -- Build webhook payload
  payload := jsonb_build_object(
    'entity', entity_name,
    'event', event_type,
    'record_id', record_id,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'timestamp', now()::text,
    'new_data', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE null END,
    'old_data', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE null END
  );

  -- Async HTTP call to Railway webhook listener (non-blocking)
  -- Uses pg_net extension if available, otherwise logs to entity_events table
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.railway_webhook_url', true),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-key', current_setting('app.railway_webhook_key', true)
      ),
      body := payload
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: insert into event queue table for async processing
    INSERT INTO entity_event_queue (entity_name, event_type, record_id, payload, created_at)
    VALUES (entity_name, event_type, record_id, payload, now());
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Event queue table (fallback when pg_net not available) ──────────────────
CREATE TABLE IF NOT EXISTS entity_event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_event_queue_pending ON entity_event_queue (status, created_at)
  WHERE status = 'pending';

-- ── Create triggers for key entities ─────────────────────────────────────────
-- Each trigger fires on INSERT/UPDATE/DELETE and dispatches to Railway

-- Lead trigger → Immediate follow-up workflow
DROP TRIGGER IF EXISTS trigger_lead_change ON leads;
CREATE TRIGGER trigger_lead_change
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION notify_entity_change();

-- Appointment trigger → Booking confirmation workflow
DROP TRIGGER IF EXISTS trigger_appointment_change ON appointments;
CREATE TRIGGER trigger_appointment_change
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION notify_entity_change();

-- SocialSchedule trigger → Social publishing workflow
DROP TRIGGER IF EXISTS trigger_social_schedule_change ON social_schedules;
CREATE TRIGGER trigger_social_schedule_change
  AFTER INSERT OR UPDATE OR DELETE ON social_schedules
  FOR EACH ROW EXECUTE FUNCTION notify_entity_change();

-- ContentCalendarItem trigger → Content generation workflow
DROP TRIGGER IF EXISTS trigger_content_calendar_change ON content_calendar_items;
CREATE TRIGGER trigger_content_calendar_change
  AFTER INSERT OR UPDATE OR DELETE ON content_calendar_items
  FOR EACH ROW EXECUTE FUNCTION notify_entity_change();

-- GeneratedPage trigger → SEO indexing workflow
DROP TRIGGER IF EXISTS trigger_generated_page_change ON generated_pages;
CREATE TRIGGER trigger_generated_page_change
  AFTER INSERT OR UPDATE OR DELETE ON generated_pages
  FOR EACH ROW EXECUTE FUNCTION notify_entity_change();

-- SwarmTask trigger → Swarm dispatch workflow
DROP TRIGGER IF EXISTS trigger_swarm_task_change ON swarm_tasks;
CREATE TRIGGER trigger_swarm_task_change
  AFTER INSERT OR UPDATE OR DELETE ON swarm_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_entity_change();

-- ── Event processor function (for polling fallback) ─────────────────────────
-- Called by Railway cron to process queued events when pg_net is unavailable
CREATE OR REPLACE FUNCTION process_event_queue(batch_size INT DEFAULT 50)
RETURNS TABLE (processed INT, failed INT) AS $$
DECLARE
  ev RECORD;
  result JSONB;
  success_count INT := 0;
  fail_count INT := 0;
BEGIN
  FOR ev IN
    SELECT * FROM entity_event_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := current_setting('app.railway_webhook_url', true),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-key', current_setting('app.railway_webhook_key', true)
        ),
        body := ev.payload
      );

      UPDATE entity_event_queue SET status = 'processed', processed_at = now()
      WHERE id = ev.id;

      success_count := success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE entity_event_queue SET status = 'failed', processed_at = now()
      WHERE id = ev.id;
      fail_count := fail_count + 1;
    END;
  END LOOP;

  RETURN QUERY VALUES (success_count, fail_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;