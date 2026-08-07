"""Business logic for git-style document repositories."""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import HTTPException, status

from auth import AuthUser
from db import db_cursor
from doc_versioning.models import (
    ArtifactOut,
    BranchOut,
    CommitDiff,
    CommitOut,
    DocumentContent,
    MemberOut,
    RepositoryOut,
    RepositorySummary,
    RepositoryTree,
    SectionDiff,
    TreeNode,
)
from doc_versioning.storage import read_artifact, save_artifact


class AccessError(HTTPException):
    def __init__(self, detail: str, code: int = status.HTTP_403_FORBIDDEN):
        super().__init__(status_code=code, detail=detail)


def _row_ts(row: dict, key: str) -> datetime:
    val = row[key]
    return val if isinstance(val, datetime) else datetime.fromisoformat(str(val))


def _user_role(repo_id: str, user_id: str) -> Optional[str]:
    with db_cursor() as cur:
        cur.execute(
            """
            select r.owner_id,
                   m.role as member_role
            from public.doc_repositories r
            left join public.doc_members m
              on m.repo_id = r.id and m.user_id = %s
            where r.id = %s
            """,
            (user_id, repo_id),
        )
        row = cur.fetchone()
    if not row:
        return None
    if str(row["owner_id"]) == user_id:
        return "owner"
    return row.get("member_role")


def _require_role(repo_id: str, user: AuthUser, min_role: str = "viewer") -> str:
    role = _user_role(repo_id, user.id)
    if role is None:
        raise AccessError("Repository not found or access denied", status.HTTP_404_NOT_FOUND)
    order = {"viewer": 0, "editor": 1, "owner": 2}
    if order.get(role, -1) < order.get(min_role, 0):
        raise AccessError("Insufficient permissions")
    return role


def _artifact_rows(commit_ids: list[str]) -> dict[str, list[ArtifactOut]]:
    if not commit_ids:
        return {}
    with db_cursor() as cur:
        cur.execute(
            """
            select id, commit_id, filename, content_type, size_bytes, created_at
            from public.doc_artifacts
            where commit_id = any(%s::uuid[])
            order by created_at asc
            """,
            (commit_ids,),
        )
        rows = cur.fetchall()
    out: dict[str, list[ArtifactOut]] = {}
    for row in rows:
        cid = str(row["commit_id"])
        out.setdefault(cid, []).append(
            ArtifactOut(
                id=str(row["id"]),
                filename=row["filename"],
                content_type=row.get("content_type"),
                size_bytes=int(row["size_bytes"]),
                created_at=_row_ts(row, "created_at"),
            )
        )
    return out


def _commit_out(row: dict, artifacts: list[ArtifactOut] | None = None) -> CommitOut:
    return CommitOut(
        id=str(row["id"]),
        repo_id=str(row["repo_id"]),
        parent_commit_id=str(row["parent_commit_id"]) if row.get("parent_commit_id") else None,
        author_id=str(row["author_id"]),
        message=row.get("message") or "",
        content=row.get("content") or {},
        created_at=_row_ts(row, "created_at"),
        artifacts=artifacts or [],
    )


def list_repositories(user: AuthUser) -> list[RepositorySummary]:
    with db_cursor() as cur:
        cur.execute(
            """
            select r.id, r.owner_id, r.title, r.description, r.default_branch,
                   r.created_at, r.updated_at,
                   case when r.owner_id = %s then 'owner' else m.role end as role
            from public.doc_repositories r
            left join public.doc_members m
              on m.repo_id = r.id and m.user_id = %s
            where r.owner_id = %s or m.user_id = %s
            order by r.updated_at desc
            """,
            (user.id, user.id, user.id, user.id),
        )
        rows = cur.fetchall()
    return [
        RepositorySummary(
            id=str(r["id"]),
            owner_id=str(r["owner_id"]),
            title=r["title"],
            description=r.get("description") or "",
            default_branch=r["default_branch"],
            created_at=_row_ts(r, "created_at"),
            updated_at=_row_ts(r, "updated_at"),
            role=r["role"],
        )
        for r in rows
    ]


def get_repository(repo_id: str, user: AuthUser) -> RepositoryOut:
    _require_role(repo_id, user, "viewer")
    with db_cursor() as cur:
        cur.execute(
            """
            select id, owner_id, title, description, default_branch, created_at, updated_at
            from public.doc_repositories where id = %s
            """,
            (repo_id,),
        )
        repo = cur.fetchone()
        if not repo:
            raise AccessError("Repository not found", status.HTTP_404_NOT_FOUND)
        cur.execute(
            """
            select id, name, head_commit_id, created_by, created_at
            from public.doc_branches where repo_id = %s order by name asc
            """,
            (repo_id,),
        )
        branches = cur.fetchall()
    return RepositoryOut(
        id=str(repo["id"]),
        owner_id=str(repo["owner_id"]),
        title=repo["title"],
        description=repo.get("description") or "",
        default_branch=repo["default_branch"],
        created_at=_row_ts(repo, "created_at"),
        updated_at=_row_ts(repo, "updated_at"),
        branches=[
            BranchOut(
                id=str(b["id"]),
                name=b["name"],
                head_commit_id=str(b["head_commit_id"]) if b.get("head_commit_id") else None,
                created_by=str(b["created_by"]),
                created_at=_row_ts(b, "created_at"),
            )
            for b in branches
        ],
    )


def create_repository(
    user: AuthUser,
    *,
    title: str,
    description: str = "",
    message: str = "Initial commit",
    content: Optional[dict[str, Any]] = None,
    uploads: list[tuple[str, str | None, bytes]] | None = None,
) -> RepositoryOut:
    repo_id = str(uuid.uuid4())
    commit_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())
    content_payload = content or {"title": title, "sections": []}

    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.doc_repositories (id, owner_id, title, description)
            values (%s, %s, %s, %s)
            """,
            (repo_id, user.id, title, description),
        )
        cur.execute(
            """
            insert into public.doc_members (repo_id, user_id, role, invited_by)
            values (%s, %s, 'owner', %s)
            on conflict do nothing
            """,
            (repo_id, user.id, user.id),
        )
        cur.execute(
            """
            insert into public.doc_commits (id, repo_id, parent_commit_id, author_id, message, content)
            values (%s, %s, null, %s, %s, %s::jsonb)
            """,
            (commit_id, repo_id, user.id, message, json.dumps(content_payload)),
        )
        cur.execute(
            """
            insert into public.doc_branches (id, repo_id, name, head_commit_id, created_by)
            values (%s, %s, 'main', %s, %s)
            """,
            (branch_id, repo_id, commit_id, user.id),
        )

    for filename, content_type, data in uploads or []:
        _attach_artifact(repo_id, commit_id, filename, content_type, data)

    return get_repository(repo_id, user)


def delete_repository(repo_id: str, user: AuthUser) -> None:
    _require_role(repo_id, user, "owner")
    with db_cursor() as cur:
        cur.execute("delete from public.doc_repositories where id = %s and owner_id = %s", (repo_id, user.id))
        if cur.rowcount == 0:
            raise AccessError("Repository not found", status.HTTP_404_NOT_FOUND)


def _get_branch(repo_id: str, branch_name: str) -> dict:
    with db_cursor() as cur:
        cur.execute(
            """
            select id, name, head_commit_id, created_by, created_at
            from public.doc_branches
            where repo_id = %s and name = %s
            """,
            (repo_id, branch_name),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Branch '{branch_name}' not found")
    return row


def create_branch(
    repo_id: str,
    user: AuthUser,
    *,
    name: str,
    from_commit_id: Optional[str] = None,
    from_branch: Optional[str] = None,
) -> BranchOut:
    _require_role(repo_id, user, "editor")
    if name == "main":
        raise HTTPException(status_code=400, detail="Cannot recreate default branch 'main'")

    head_id = from_commit_id
    if not head_id and from_branch:
        branch = _get_branch(repo_id, from_branch)
        head_id = str(branch["head_commit_id"]) if branch.get("head_commit_id") else None
    if not head_id:
        default = _get_branch(repo_id, "main")
        head_id = str(default["head_commit_id"]) if default.get("head_commit_id") else None

    branch_id = str(uuid.uuid4())
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.doc_branches (id, repo_id, name, head_commit_id, created_by)
            values (%s, %s, %s, %s, %s)
            returning id, name, head_commit_id, created_by, created_at
            """,
            (branch_id, repo_id, name, head_id, user.id),
        )
        row = cur.fetchone()
    return BranchOut(
        id=str(row["id"]),
        name=row["name"],
        head_commit_id=str(row["head_commit_id"]) if row.get("head_commit_id") else None,
        created_by=str(row["created_by"]),
        created_at=_row_ts(row, "created_at"),
    )


def create_commit(
    repo_id: str,
    user: AuthUser,
    *,
    branch: str,
    message: str,
    content: DocumentContent,
    parent_commit_id: Optional[str] = None,
    uploads: list[tuple[str, str | None, bytes]] | None = None,
) -> CommitOut:
    _require_role(repo_id, user, "editor")
    branch_row = _get_branch(repo_id, branch)
    expected_parent = str(branch_row["head_commit_id"]) if branch_row.get("head_commit_id") else None
    if parent_commit_id and expected_parent and parent_commit_id != expected_parent:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "branch_diverged",
                "message": "Branch head changed; pull latest or specify merge",
                "expected_parent": expected_parent,
            },
        )
    parent = parent_commit_id or expected_parent

    commit_id = str(uuid.uuid4())
    payload = content.model_dump()
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.doc_commits (id, repo_id, parent_commit_id, author_id, message, content)
            values (%s, %s, %s, %s, %s, %s::jsonb)
            returning id, repo_id, parent_commit_id, author_id, message, content, created_at
            """,
            (commit_id, repo_id, parent, user.id, message, json.dumps(payload)),
        )
        row = cur.fetchone()
        cur.execute(
            """
            update public.doc_branches
            set head_commit_id = %s
            where repo_id = %s and name = %s
            """,
            (commit_id, repo_id, branch),
        )
        cur.execute(
            "update public.doc_repositories set updated_at = now() where id = %s",
            (repo_id,),
        )

    artifacts: list[ArtifactOut] = []
    for filename, content_type, data in uploads or []:
        artifacts.append(_attach_artifact(repo_id, commit_id, filename, content_type, data))

    return _commit_out(row, artifacts)


def _attach_artifact(
    repo_id: str,
    commit_id: str,
    filename: str,
    content_type: str | None,
    data: bytes,
) -> ArtifactOut:
    storage_path, size = save_artifact(repo_id, commit_id, filename, data)
    artifact_id = str(uuid.uuid4())
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.doc_artifacts
              (id, repo_id, commit_id, filename, content_type, storage_path, size_bytes)
            values (%s, %s, %s, %s, %s, %s, %s)
            returning id, filename, content_type, size_bytes, created_at
            """,
            (artifact_id, repo_id, commit_id, filename, content_type, storage_path, size),
        )
        row = cur.fetchone()
    return ArtifactOut(
        id=str(row["id"]),
        filename=row["filename"],
        content_type=row.get("content_type"),
        size_bytes=int(row["size_bytes"]),
        created_at=_row_ts(row, "created_at"),
    )


def get_commit(repo_id: str, commit_id: str, user: AuthUser) -> CommitOut:
    _require_role(repo_id, user, "viewer")
    with db_cursor() as cur:
        cur.execute(
            """
            select id, repo_id, parent_commit_id, author_id, message, content, created_at
            from public.doc_commits
            where repo_id = %s and id = %s
            """,
            (repo_id, commit_id),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Commit not found")
    arts = _artifact_rows([commit_id]).get(commit_id, [])
    return _commit_out(row, arts)


def list_commits(
    repo_id: str,
    user: AuthUser,
    *,
    branch: Optional[str] = None,
    limit: int = 50,
) -> list[CommitOut]:
    _require_role(repo_id, user, "viewer")
    limit = max(1, min(limit, 200))

    if branch:
        branch_row = _get_branch(repo_id, branch)
        head = branch_row.get("head_commit_id")
        if not head:
            return []
        commit_ids: list[str] = []
        current: Optional[str] = str(head)
        with db_cursor() as cur:
            while current and len(commit_ids) < limit:
                commit_ids.append(current)
                cur.execute(
                    "select parent_commit_id from public.doc_commits where id = %s",
                    (current,),
                )
                parent = cur.fetchone()
                current = str(parent["parent_commit_id"]) if parent and parent.get("parent_commit_id") else None
        if not commit_ids:
            return []
        with db_cursor() as cur:
            cur.execute(
                """
                select id, repo_id, parent_commit_id, author_id, message, content, created_at
                from public.doc_commits
                where id = any(%s::uuid[])
                order by created_at desc
                """,
                (commit_ids,),
            )
            rows = cur.fetchall()
    else:
        with db_cursor() as cur:
            cur.execute(
                """
                select id, repo_id, parent_commit_id, author_id, message, content, created_at
                from public.doc_commits
                where repo_id = %s
                order by created_at desc
                limit %s
                """,
                (repo_id, limit),
            )
            rows = cur.fetchall()

    art_map = _artifact_rows([str(r["id"]) for r in rows])
    return [_commit_out(r, art_map.get(str(r["id"]), [])) for r in rows]


def get_tree(repo_id: str, user: AuthUser) -> RepositoryTree:
    _require_role(repo_id, user, "viewer")
    repo = get_repository(repo_id, user)
    with db_cursor() as cur:
        cur.execute(
            """
            select id, parent_commit_id, author_id, message, created_at
            from public.doc_commits
            where repo_id = %s
            order by created_at asc
            """,
            (repo_id,),
        )
        commits = cur.fetchall()

    tips: dict[str, list[str]] = {}
    for branch in repo.branches:
        if branch.head_commit_id:
            tips.setdefault(branch.head_commit_id, []).append(branch.name)

    nodes = [
        TreeNode(
            id=str(c["id"]),
            parent_commit_id=str(c["parent_commit_id"]) if c.get("parent_commit_id") else None,
            author_id=str(c["author_id"]),
            message=c.get("message") or "",
            created_at=_row_ts(c, "created_at"),
            branch_tips=tips.get(str(c["id"]), []),
        )
        for c in commits
    ]
    return RepositoryTree(repo_id=repo_id, branches=repo.branches, commits=nodes)


def merge_branches(
    repo_id: str,
    user: AuthUser,
    *,
    source_branch: str,
    target_branch: str,
    message: str = "Merge branch",
) -> CommitOut:
    _require_role(repo_id, user, "editor")
    src = _get_branch(repo_id, source_branch)
    tgt = _get_branch(repo_id, target_branch)
    src_head = str(src["head_commit_id"]) if src.get("head_commit_id") else None
    tgt_head = str(tgt["head_commit_id"]) if tgt.get("head_commit_id") else None
    if not src_head:
        raise HTTPException(status_code=400, detail="Source branch has no commits")
    if src_head == tgt_head:
        return get_commit(repo_id, src_head, user)

    # Fast-forward when target is ancestor of source
    if _is_ancestor(repo_id, tgt_head, src_head):
        with db_cursor() as cur:
            cur.execute(
                """
                update public.doc_branches set head_commit_id = %s
                where repo_id = %s and name = %s
                """,
                (src_head, repo_id, target_branch),
            )
        return get_commit(repo_id, src_head, user)

    # Merge commit with combined section content (target base, source overrides)
    src_commit = get_commit(repo_id, src_head, user)
    tgt_commit = get_commit(repo_id, tgt_head, user) if tgt_head else None
    merged_content = _merge_content(
        tgt_commit.content if tgt_commit else {},
        src_commit.content,
    )
    commit_id = str(uuid.uuid4())
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.doc_commits (id, repo_id, parent_commit_id, author_id, message, content)
            values (%s, %s, %s, %s, %s, %s::jsonb)
            returning id, repo_id, parent_commit_id, author_id, message, content, created_at
            """,
            (
                commit_id,
                repo_id,
                tgt_head,
                user.id,
                f"{message} '{source_branch}' into '{target_branch}'",
                json.dumps(merged_content),
            ),
        )
        row = cur.fetchone()
        cur.execute(
            """
            update public.doc_branches set head_commit_id = %s
            where repo_id = %s and name = %s
            """,
            (commit_id, repo_id, target_branch),
        )
        cur.execute("update public.doc_repositories set updated_at = now() where id = %s", (repo_id,))
    return _commit_out(row)


def _is_ancestor(repo_id: str, ancestor_id: Optional[str], commit_id: str) -> bool:
    if not ancestor_id:
        return True
    current: Optional[str] = commit_id
    seen: set[str] = set()
    with db_cursor() as cur:
        while current and current not in seen:
            if current == ancestor_id:
                return True
            seen.add(current)
            cur.execute(
                "select parent_commit_id from public.doc_commits where repo_id = %s and id = %s",
                (repo_id, current),
            )
            row = cur.fetchone()
            current = str(row["parent_commit_id"]) if row and row.get("parent_commit_id") else None
    return False


def _merge_content(base: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    base_sections = {s.get("title"): s for s in base.get("sections", []) if isinstance(s, dict)}
    for section in incoming.get("sections", []):
        if isinstance(section, dict) and section.get("title"):
            base_sections[section["title"]] = section
    merged_sections = list(base_sections.values())
    return {
        "title": incoming.get("title") or base.get("title") or "",
        "sections": merged_sections,
        "extra": {**(base.get("extra") or {}), **(incoming.get("extra") or {})},
    }


def diff_commits(repo_id: str, user: AuthUser, from_id: str, to_id: str) -> CommitDiff:
    _require_role(repo_id, user, "viewer")
    left = get_commit(repo_id, from_id, user)
    right = get_commit(repo_id, to_id, user)

    left_map = {
        s.get("title"): s.get("content", "")
        for s in (left.content.get("sections") or [])
        if isinstance(s, dict)
    }
    right_map = {
        s.get("title"): s.get("content", "")
        for s in (right.content.get("sections") or [])
        if isinstance(s, dict)
    }
    titles = list(dict.fromkeys(list(left_map.keys()) + list(right_map.keys())))
    sections: list[SectionDiff] = []
    for title in titles:
        before = left_map.get(title)
        after = right_map.get(title)
        if before == after:
            continue
        if before is None:
            status_name = "added"
        elif after is None:
            status_name = "removed"
        else:
            status_name = "modified"
        sections.append(SectionDiff(title=title, status=status_name, before=before, after=after))
    return CommitDiff(from_commit_id=from_id, to_commit_id=to_id, sections=sections)


def list_members(repo_id: str, user: AuthUser) -> list[MemberOut]:
    _require_role(repo_id, user, "viewer")
    with db_cursor() as cur:
        cur.execute(
            """
            select user_id, role, invited_by, created_at
            from public.doc_members
            where repo_id = %s
            order by created_at asc
            """,
            (repo_id,),
        )
        rows = cur.fetchall()
    return [
        MemberOut(
            user_id=str(r["user_id"]),
            role=r["role"],
            invited_by=str(r["invited_by"]) if r.get("invited_by") else None,
            created_at=_row_ts(r, "created_at"),
        )
        for r in rows
    ]


def add_member(repo_id: str, user: AuthUser, member_id: str, role: str = "editor") -> MemberOut:
    _require_role(repo_id, user, "owner")
    if role not in {"editor", "viewer"}:
        raise HTTPException(status_code=400, detail="role must be editor or viewer")
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.doc_members (repo_id, user_id, role, invited_by)
            values (%s, %s, %s, %s)
            on conflict (repo_id, user_id) do update
              set role = excluded.role, invited_by = excluded.invited_by
            returning user_id, role, invited_by, created_at
            """,
            (repo_id, member_id, role, user.id),
        )
        row = cur.fetchone()
    return MemberOut(
        user_id=str(row["user_id"]),
        role=row["role"],
        invited_by=str(row["invited_by"]) if row.get("invited_by") else None,
        created_at=_row_ts(row, "created_at"),
    )


def remove_member(repo_id: str, user: AuthUser, member_id: str) -> None:
    _require_role(repo_id, user, "owner")
    with db_cursor() as cur:
        cur.execute(
            "delete from public.doc_members where repo_id = %s and user_id = %s and role <> 'owner'",
            (repo_id, member_id),
        )


def download_artifact(repo_id: str, artifact_id: str, user: AuthUser) -> tuple[str, str | None, bytes]:
    _require_role(repo_id, user, "viewer")
    with db_cursor() as cur:
        cur.execute(
            """
            select filename, content_type, storage_path
            from public.doc_artifacts
            where repo_id = %s and id = %s
            """,
            (repo_id, artifact_id),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Artifact not found")
    data = read_artifact(row["storage_path"])
    return row["filename"], row.get("content_type"), data
