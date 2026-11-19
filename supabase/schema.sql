create table public.quizroom_scores (
 installation_id uuid not null,
 attempt_id bigint not null check (attempt_id > 0),
 user_id bigint not null check (user_id > 0),
 display_name text not null check (length(display_name) between 1 and 80),
 score integer not null check (score between 0 and 100),
 completed_at timestamptz not null,
 primary key (installation_id, attempt_id)
);
alter table public.quizroom_scores enable row level security;
revoke all on public.quizroom_scores from anon, authenticated;
grant select, insert on public.quizroom_scores to service_role;
create index quizroom_scores_participant on public.quizroom_scores(installation_id,user_id);
create view public.quizroom_leaderboard with (security_invoker=true) as
 select installation_id::text || ':' || user_id::text as id,
 (array_agg(display_name order by completed_at desc,attempt_id desc))[1] as name,
 count(*)::integer as completed,
 round(avg(score))::integer as average,
 max(score)::integer as best
 from public.quizroom_scores group by installation_id,user_id;
revoke all on public.quizroom_leaderboard from anon, authenticated;
grant select on public.quizroom_leaderboard to service_role;
create policy server_read on public.quizroom_scores for select to service_role using (true);
create policy server_insert on public.quizroom_scores for insert to service_role with check (true);
