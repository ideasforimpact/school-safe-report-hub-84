create extension if not exists "pgjwt" with schema "extensions";


  create table "public"."refresh_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "token_hash" text not null,
    "expires_at" timestamp with time zone not null,
    "revoked" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "device_info" jsonb default '{}'::jsonb,
    "issued_by" text
      );


alter table "public"."backoffice_users" disable row level security;

alter table "public"."configuration_import_logs" enable row level security;

alter table "public"."notification_logs" add column "client_id" uuid;

CREATE INDEX idx_notification_logs_client ON public.notification_logs USING btree (client_id);

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);

CREATE INDEX idx_refresh_tokens_hash_revoked ON public.refresh_tokens USING btree (token_hash, revoked) WHERE (revoked = false);

CREATE INDEX idx_refresh_tokens_revoked ON public.refresh_tokens USING btree (revoked);

CREATE INDEX idx_refresh_tokens_token_hash ON public.refresh_tokens USING btree (token_hash);

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);

CREATE INDEX idx_refresh_tokens_user_revoked ON public.refresh_tokens USING btree (user_id, revoked);

alter table "public"."notification_logs" add constraint "notification_logs_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE not valid;

alter table "public"."notification_logs" validate constraint "notification_logs_client_id_fkey";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.employees(id) ON DELETE CASCADE not valid;

alter table "public"."refresh_tokens" validate constraint "refresh_tokens_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.queue_form_submission_comment_attachments(p_submission_id uuid, p_comments text, p_files jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  perform pgmq.send(
    'form_submission_comment_attachements',
    jsonb_build_object(
      'submission_id', p_submission_id,
      'comments', p_comments,
      'files', coalesce(p_files, '[]'::jsonb)
    )
  );
end;
$function$
;

grant delete on table "public"."refresh_tokens" to "anon";

grant insert on table "public"."refresh_tokens" to "anon";

grant references on table "public"."refresh_tokens" to "anon";

grant select on table "public"."refresh_tokens" to "anon";

grant trigger on table "public"."refresh_tokens" to "anon";

grant truncate on table "public"."refresh_tokens" to "anon";

grant update on table "public"."refresh_tokens" to "anon";

grant delete on table "public"."refresh_tokens" to "authenticated";

grant insert on table "public"."refresh_tokens" to "authenticated";

grant references on table "public"."refresh_tokens" to "authenticated";

grant select on table "public"."refresh_tokens" to "authenticated";

grant trigger on table "public"."refresh_tokens" to "authenticated";

grant truncate on table "public"."refresh_tokens" to "authenticated";

grant update on table "public"."refresh_tokens" to "authenticated";

grant delete on table "public"."refresh_tokens" to "service_role";

grant insert on table "public"."refresh_tokens" to "service_role";

grant references on table "public"."refresh_tokens" to "service_role";

grant select on table "public"."refresh_tokens" to "service_role";

grant trigger on table "public"."refresh_tokens" to "service_role";

grant truncate on table "public"."refresh_tokens" to "service_role";

grant update on table "public"."refresh_tokens" to "service_role";


