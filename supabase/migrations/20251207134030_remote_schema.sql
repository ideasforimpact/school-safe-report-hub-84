drop extension if exists "pgjwt";

create schema if not exists "pgmq";

create extension if not exists "pgmq" with schema "pgmq";

drop policy "Allow authentication function access" on "public"."visitor_kyc";

drop policy "Users can delete visitor_kyc from their client only" on "public"."visitor_kyc";

drop policy "Users can insert visitor_kyc for their client only" on "public"."visitor_kyc";

drop policy "Users can update visitor_kyc from their client only" on "public"."visitor_kyc";

drop policy "Users can view visitor_kyc from their client" on "public"."visitor_kyc";

drop policy "Allow authentication function access" on "public"."visitors";

drop policy "Users can delete visitors from their client only" on "public"."visitors";

drop policy "Users can insert visitors for their client only" on "public"."visitors";

drop policy "Users can update visitors from their client only" on "public"."visitors";

drop policy "Users can view visitors from their client" on "public"."visitors";

revoke delete on table "public"."refresh_tokens" from "anon";

revoke insert on table "public"."refresh_tokens" from "anon";

revoke references on table "public"."refresh_tokens" from "anon";

revoke select on table "public"."refresh_tokens" from "anon";

revoke trigger on table "public"."refresh_tokens" from "anon";

revoke truncate on table "public"."refresh_tokens" from "anon";

revoke update on table "public"."refresh_tokens" from "anon";

revoke delete on table "public"."refresh_tokens" from "authenticated";

revoke insert on table "public"."refresh_tokens" from "authenticated";

revoke references on table "public"."refresh_tokens" from "authenticated";

revoke select on table "public"."refresh_tokens" from "authenticated";

revoke trigger on table "public"."refresh_tokens" from "authenticated";

revoke truncate on table "public"."refresh_tokens" from "authenticated";

revoke update on table "public"."refresh_tokens" from "authenticated";

revoke delete on table "public"."refresh_tokens" from "service_role";

revoke insert on table "public"."refresh_tokens" from "service_role";

revoke references on table "public"."refresh_tokens" from "service_role";

revoke select on table "public"."refresh_tokens" from "service_role";

revoke trigger on table "public"."refresh_tokens" from "service_role";

revoke truncate on table "public"."refresh_tokens" from "service_role";

revoke update on table "public"."refresh_tokens" from "service_role";

revoke delete on table "public"."visitor_kyc" from "anon";

revoke insert on table "public"."visitor_kyc" from "anon";

revoke references on table "public"."visitor_kyc" from "anon";

revoke select on table "public"."visitor_kyc" from "anon";

revoke trigger on table "public"."visitor_kyc" from "anon";

revoke truncate on table "public"."visitor_kyc" from "anon";

revoke update on table "public"."visitor_kyc" from "anon";

revoke delete on table "public"."visitor_kyc" from "authenticated";

revoke insert on table "public"."visitor_kyc" from "authenticated";

revoke references on table "public"."visitor_kyc" from "authenticated";

revoke select on table "public"."visitor_kyc" from "authenticated";

revoke trigger on table "public"."visitor_kyc" from "authenticated";

revoke truncate on table "public"."visitor_kyc" from "authenticated";

revoke update on table "public"."visitor_kyc" from "authenticated";

revoke delete on table "public"."visitor_kyc" from "service_role";

revoke insert on table "public"."visitor_kyc" from "service_role";

revoke references on table "public"."visitor_kyc" from "service_role";

revoke select on table "public"."visitor_kyc" from "service_role";

revoke trigger on table "public"."visitor_kyc" from "service_role";

revoke truncate on table "public"."visitor_kyc" from "service_role";

revoke update on table "public"."visitor_kyc" from "service_role";

revoke delete on table "public"."visitors" from "anon";

revoke insert on table "public"."visitors" from "anon";

revoke references on table "public"."visitors" from "anon";

revoke select on table "public"."visitors" from "anon";

revoke trigger on table "public"."visitors" from "anon";

revoke truncate on table "public"."visitors" from "anon";

revoke update on table "public"."visitors" from "anon";

revoke delete on table "public"."visitors" from "authenticated";

revoke insert on table "public"."visitors" from "authenticated";

revoke references on table "public"."visitors" from "authenticated";

revoke select on table "public"."visitors" from "authenticated";

revoke trigger on table "public"."visitors" from "authenticated";

revoke truncate on table "public"."visitors" from "authenticated";

revoke update on table "public"."visitors" from "authenticated";

revoke delete on table "public"."visitors" from "service_role";

revoke insert on table "public"."visitors" from "service_role";

revoke references on table "public"."visitors" from "service_role";

revoke select on table "public"."visitors" from "service_role";

revoke trigger on table "public"."visitors" from "service_role";

revoke truncate on table "public"."visitors" from "service_role";

revoke update on table "public"."visitors" from "service_role";

alter table "public"."refresh_tokens" drop constraint "refresh_tokens_user_id_fkey";

alter table "public"."visitor_kyc" drop constraint "visitor_kyc_client_id_fkey";

alter table "public"."visitor_kyc" drop constraint "visitor_kyc_employee_id_fkey";

alter table "public"."visitor_kyc" drop constraint "visitor_kyc_visitor_id_fkey";

alter table "public"."visitors" drop constraint "visitors_client_id_fkey";

alter table "public"."visitors" drop constraint "visitors_employee_id_fkey";

alter table "public"."visitor_kyc" drop constraint "visitor_kyc_pkey";

alter table "public"."visitors" drop constraint "visitors_pkey";

drop index if exists "public"."idx_refresh_tokens_expires_at";

drop index if exists "public"."idx_refresh_tokens_hash_revoked";

drop index if exists "public"."idx_refresh_tokens_revoked";

drop index if exists "public"."idx_refresh_tokens_token_hash";

drop index if exists "public"."idx_refresh_tokens_user_id";

drop index if exists "public"."idx_refresh_tokens_user_revoked";

drop index if exists "public"."idx_visitor_kyc_client_id";

drop index if exists "public"."idx_visitor_kyc_document_type";

drop index if exists "public"."idx_visitor_kyc_employee_id";

drop index if exists "public"."idx_visitor_kyc_visitor_id";

drop index if exists "public"."idx_visitors_client_id";

drop index if exists "public"."idx_visitors_created_at";

drop index if exists "public"."idx_visitors_employee_id";

drop index if exists "public"."visitor_kyc_pkey";

drop index if exists "public"."visitors_pkey";

drop table "public"."refresh_tokens";

drop table "public"."visitor_kyc";

drop table "public"."visitors";

alter table "public"."configuration_import_logs" disable row level security;

alter table "public"."email_queue" disable row level security;

alter table "public"."notification_logs" disable row level security;

drop policy "Allow public delete from visitors_evidence" on "storage"."objects";

drop policy "Allow public read access to visitors_evidence" on "storage"."objects";

drop policy "Allow public update to visitors_evidence" on "storage"."objects";

drop policy "Allow public upload to visitors_evidence" on "storage"."objects";


