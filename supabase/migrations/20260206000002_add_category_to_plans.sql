do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'budget_plans' and column_name = 'category') then
    alter table public.budget_plans add column category text;
  end if;
end;
$$;
