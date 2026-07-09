-- ─────────────────────────────────────────────────────────────
-- 버전 히스토리 (api/projects.js handleVersions)
--
-- 없으면 "버전 저장 완료" 응답만 하고 실제로는 아무것도 저장되지 않는다.
-- 컬럼 구성은 api/projects.js 의 select / insert 목록에서 그대로 도출했다.
-- ─────────────────────────────────────────────────────────────
-- 롤백: drop table if exists hll_project_versions;

create table if not exists hll_project_versions (
  id          bigserial primary key,
  project_id  text        not null,
  user_email  text        not null,
  version_num integer     not null,
  title       text,
  logline     text,
  snapshot    jsonb       not null,
  created_at  timestamptz not null default now()
);

-- handleVersions 의 모든 조회가 (project_id, user_email) 로 필터링한다
create index if not exists hll_project_versions_proj_idx
  on hll_project_versions(project_id, user_email, created_at desc);

-- 프로젝트 삭제 시 버전도 함께 정리하려면 아래를 쓴다.
-- hll_projects 의 PK 가 (id, user_email) 복합키이므로 FK 도 두 컬럼을 함께 참조해야 한다.
--   alter table hll_project_versions
--     add constraint hll_project_versions_project_fk
--     foreign key (project_id, user_email)
--     references hll_projects(id, user_email) on delete cascade;
