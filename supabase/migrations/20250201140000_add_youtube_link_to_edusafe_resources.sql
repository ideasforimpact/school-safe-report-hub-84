-- Add youtube_link column to edusafe_resources table
alter table "public"."edusafe_resources" add column "youtube_link" text;

-- Add comment to describe the column
comment on column "public"."edusafe_resources"."youtube_link" is 'YouTube URL for video resources';
