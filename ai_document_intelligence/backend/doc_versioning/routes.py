"""FastAPI routes for git-style document versioning."""

from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from auth import AuthUser, get_current_user
from doc_versioning import service as svc
from doc_versioning.models import (
    AddMemberRequest,
    CommitDiff,
    CommitOut,
    CreateBranchRequest,
    CreateCommitRequest,
    DocumentContent,
    MemberOut,
    MergeRequest,
    RepositoryOut,
    RepositorySummary,
    RepositoryTree,
)

router = APIRouter(prefix="/doc-repos", tags=["document-versioning"])


@router.get("", response_model=List[RepositorySummary])
def list_doc_repos(user: AuthUser = Depends(get_current_user)):
    return svc.list_repositories(user)


@router.post("", response_model=RepositoryOut)
async def create_doc_repo(
    title: str = Form(...),
    description: str = Form(""),
    message: str = Form("Initial commit"),
    content_json: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    user: AuthUser = Depends(get_current_user),
):
    content = None
    if content_json:
        try:
            content = json.loads(content_json)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="content_json must be valid JSON") from exc

    uploads: list[tuple[str, str | None, bytes]] = []
    for upload in files:
        data = await upload.read()
        if data:
            uploads.append((upload.filename or "upload.bin", upload.content_type, data))

    return svc.create_repository(
        user,
        title=title,
        description=description,
        message=message,
        content=content,
        uploads=uploads,
    )


@router.get("/{repo_id}", response_model=RepositoryOut)
def get_doc_repo(repo_id: str, user: AuthUser = Depends(get_current_user)):
    return svc.get_repository(repo_id, user)


@router.delete("/{repo_id}", status_code=204)
def delete_doc_repo(repo_id: str, user: AuthUser = Depends(get_current_user)):
    svc.delete_repository(repo_id, user)
    return Response(status_code=204)


@router.get("/{repo_id}/branches")
def list_branches(repo_id: str, user: AuthUser = Depends(get_current_user)):
    repo = svc.get_repository(repo_id, user)
    return repo.branches


@router.post("/{repo_id}/branches")
def create_branch(repo_id: str, body: CreateBranchRequest, user: AuthUser = Depends(get_current_user)):
    return svc.create_branch(
        repo_id,
        user,
        name=body.name,
        from_commit_id=body.from_commit_id,
        from_branch=body.from_branch,
    )


@router.get("/{repo_id}/commits", response_model=List[CommitOut])
def list_commits(
    repo_id: str,
    branch: Optional[str] = None,
    limit: int = 50,
    user: AuthUser = Depends(get_current_user),
):
    return svc.list_commits(repo_id, user, branch=branch, limit=limit)


@router.get("/{repo_id}/commits/{commit_id}", response_model=CommitOut)
def get_commit(repo_id: str, commit_id: str, user: AuthUser = Depends(get_current_user)):
    return svc.get_commit(repo_id, commit_id, user)


@router.post("/{repo_id}/commits", response_model=CommitOut)
async def create_commit(
    repo_id: str,
    branch: str = Form(...),
    message: str = Form(""),
    content_json: str = Form(...),
    parent_commit_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    user: AuthUser = Depends(get_current_user),
):
    try:
        raw = json.loads(content_json)
        content = DocumentContent.model_validate(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid content_json: {exc}") from exc

    uploads: list[tuple[str, str | None, bytes]] = []
    for upload in files:
        data = await upload.read()
        if data:
            uploads.append((upload.filename or "upload.bin", upload.content_type, data))

    return svc.create_commit(
        repo_id,
        user,
        branch=branch,
        message=message,
        content=content,
        parent_commit_id=parent_commit_id,
        uploads=uploads,
    )


@router.post("/{repo_id}/commits/json", response_model=CommitOut)
async def create_commit_json(
    repo_id: str,
    body: CreateCommitRequest,
    user: AuthUser = Depends(get_current_user),
):
    return svc.create_commit(
        repo_id,
        user,
        branch=body.branch,
        message=body.message,
        content=body.content,
        parent_commit_id=body.parent_commit_id,
    )


@router.get("/{repo_id}/tree", response_model=RepositoryTree)
def get_repo_tree(repo_id: str, user: AuthUser = Depends(get_current_user)):
    return svc.get_tree(repo_id, user)


@router.get("/{repo_id}/log", response_model=List[CommitOut])
def get_branch_log(
    repo_id: str,
    branch: str = "main",
    limit: int = 50,
    user: AuthUser = Depends(get_current_user),
):
    return svc.list_commits(repo_id, user, branch=branch, limit=limit)


@router.post("/{repo_id}/merge", response_model=CommitOut)
def merge_branches(repo_id: str, body: MergeRequest, user: AuthUser = Depends(get_current_user)):
    return svc.merge_branches(
        repo_id,
        user,
        source_branch=body.source_branch,
        target_branch=body.target_branch,
        message=body.message,
    )


@router.get("/{repo_id}/diff", response_model=CommitDiff)
def diff_commits(
    repo_id: str,
    from_commit: str,
    to_commit: str,
    user: AuthUser = Depends(get_current_user),
):
    return svc.diff_commits(repo_id, user, from_commit, to_commit)


@router.get("/{repo_id}/members", response_model=List[MemberOut])
def list_members(repo_id: str, user: AuthUser = Depends(get_current_user)):
    return svc.list_members(repo_id, user)


@router.post("/{repo_id}/members", response_model=MemberOut)
def add_member(repo_id: str, body: AddMemberRequest, user: AuthUser = Depends(get_current_user)):
    return svc.add_member(repo_id, user, body.user_id, body.role)


@router.delete("/{repo_id}/members/{member_id}", status_code=204)
def remove_member(repo_id: str, member_id: str, user: AuthUser = Depends(get_current_user)):
    svc.remove_member(repo_id, user, member_id)
    return Response(status_code=204)


@router.get("/{repo_id}/artifacts/{artifact_id}")
def download_artifact(repo_id: str, artifact_id: str, user: AuthUser = Depends(get_current_user)):
    filename, content_type, data = svc.download_artifact(repo_id, artifact_id, user)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=data, media_type=content_type or "application/octet-stream", headers=headers)
