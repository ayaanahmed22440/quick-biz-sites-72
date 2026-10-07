-- lovable-cron-fallback-reviewed: per-record "1 hour before expiry" emails need ~15 min accuracy; no delay-until provider available
select cron.schedule(
  'email-reminders-every-15-min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url:='https://project--362e92ae-4e40-4d93-99ce-21db7c8eabfc.lovable.app/api/public/hooks/email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_-ke7noIBxRsfb9HmPIdUuA_oeQsv4Bk"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);