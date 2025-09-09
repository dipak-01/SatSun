-- Supabase SQL schema for the app
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    refresh_token text,
    preferences jsonb,
    current_plan_id uuid,
    supabase_user_id uuid unique,
    password_hash text
);
create table if not exists weekend_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    title text not null default 'My Weekend',
    mood text,
    start_date timestamptz not null,
    end_date timestamptz not null,
    shared_id uuid unique,
    is_template boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_weekend_plans_user on weekend_plans(user_id);
create index if not exists idx_weekend_plans_shared on weekend_plans(shared_id);
create table if not exists day_instances (
    id uuid primary key default gen_random_uuid(),
    weekend_plan_id uuid not null references weekend_plans(id) on delete cascade,
    date timestamptz not null,
    day_label text not null,
    "order" int not null,
    notes text,
    color_theme text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_day_instances_plan on day_instances(weekend_plan_id);
create index if not exists idx_day_instances_date on day_instances(date);
create table if not exists activities (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    category text not null,
    duration_min int not null,
    icon text,
    tags text [] not null default '{}',
    is_premium boolean not null default false,
    default_mood text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_activities_category on activities(category);
create index if not exists idx_activities_premium on activities(is_premium);
create table if not exists activity_instances (
    id uuid primary key default gen_random_uuid(),
    activity_id uuid not null references activities(id) on delete restrict,
    day_id uuid not null references day_instances(id) on delete cascade,
    "order" int not null,
    start_time text,
    end_time text,
    notes text,
    custom_mood text,
    is_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_activity_instances_day on activity_instances(day_id);
create index if not exists idx_activity_instances_activity on activity_instances(activity_id);
create table if not exists shared_weekends (
    id uuid primary key default gen_random_uuid(),
    weekend_id uuid not null unique references weekend_plans(id) on delete cascade,
    expires_at timestamptz,
    view_count int not null default 0,
    password text,
    created_at timestamptz not null default now()
);
create index if not exists idx_shared_weekends_weekend on shared_weekends(weekend_id);
create index if not exists idx_shared_weekends_expires on shared_weekends(expires_at);
create table if not exists export_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    weekend_plan_id uuid not null references weekend_plans(id) on delete cascade,
    format text not null default 'png',
    status text not null default 'queued',
    result_url text,
    options jsonb,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);
create index if not exists idx_export_jobs_status on export_jobs(status);
create index if not exists idx_export_jobs_user on export_jobs(user_id);
create table if not exists weekend_templates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    description text,
    days jsonb not null,
    is_public boolean not null default false,
    created_at timestamptz not null default now(),
    usage_count int not null default 0
);
create index if not exists idx_weekend_templates_public on weekend_templates(is_public);
-- helper function to increment view count
create or replace function increment_view_count(row_id uuid) returns void language plpgsql as $$ begin
update shared_weekends
set view_count = coalesce(view_count, 0) + 1
where id = row_id;
end;
$$;
-- Backfill-safe migration for existing deployments
alter table if exists users
add column if not exists password_hash text;