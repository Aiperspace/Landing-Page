"""Pydantic models for git-style document versioning API."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class SectionContent(BaseModel):
    title: str
    content: str


class DocumentContent(BaseModel):
    title: str = ""
    sections: List[SectionContent] = Field(default_factory=list)
    extra: dict[str, Any] = Field(default_factory=dict)


class ArtifactOut(BaseModel):
    id: str
    filename: str
    content_type: Optional[str] = None
    size_bytes: int
    created_at: datetime


class CommitOut(BaseModel):
    id: str
    repo_id: str
    parent_commit_id: Optional[str] = None
    author_id: str
    message: str
    content: dict[str, Any]
    created_at: datetime
    artifacts: List[ArtifactOut] = Field(default_factory=list)


class BranchOut(BaseModel):
    id: str
    name: str
    head_commit_id: Optional[str] = None
    created_by: str
    created_at: datetime


class MemberOut(BaseModel):
    user_id: str
    role: str
    invited_by: Optional[str] = None
    created_at: datetime


class RepositoryOut(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    default_branch: str
    created_at: datetime
    updated_at: datetime
    branches: List[BranchOut] = Field(default_factory=list)


class RepositorySummary(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str
    default_branch: str
    created_at: datetime
    updated_at: datetime
    role: str


class CreateRepositoryRequest(BaseModel):
    title: str
    description: str = ""
    message: str = "Initial commit"
    content: Optional[DocumentContent] = None


class CreateCommitRequest(BaseModel):
    branch: str
    message: str = ""
    content: DocumentContent
    parent_commit_id: Optional[str] = None


class CreateBranchRequest(BaseModel):
    name: str
    from_commit_id: Optional[str] = None
    from_branch: Optional[str] = None


class MergeRequest(BaseModel):
    source_branch: str
    target_branch: str
    message: str = "Merge branch"


class AddMemberRequest(BaseModel):
    user_id: str
    role: str = "editor"


class TreeNode(BaseModel):
    id: str
    parent_commit_id: Optional[str] = None
    author_id: str
    message: str
    created_at: datetime
    branch_tips: List[str] = Field(default_factory=list)


class RepositoryTree(BaseModel):
    repo_id: str
    branches: List[BranchOut]
    commits: List[TreeNode]


class SectionDiff(BaseModel):
    title: str
    status: str
    before: Optional[str] = None
    after: Optional[str] = None


class CommitDiff(BaseModel):
    from_commit_id: str
    to_commit_id: str
    sections: List[SectionDiff]
