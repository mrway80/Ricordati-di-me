// ===== Core Types — Ricordati di Te =====

// ---- Enums ----
export type MemorialStatus =
  | "draft"
  | "verification_pending"
  | "active"
  | "restricted"
  | "disputed"
  | "suspended"
  | "archived"
  | "deleted";

export type ContentStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "pending_family_review"
  | "pending_platform_review"
  | "approved"
  | "published"
  | "rejected"
  | "hidden"
  | "removed"
  | "deleted";

export type MembershipStatus =
  | "invited"
  | "requested"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "revoked";

export type ModerationStatus =
  | "open"
  | "automated_review"
  | "human_review"
  | "action_required"
  | "resolved"
  | "appealed"
  | "closed";

export type MediaType = "image" | "video" | "audio" | "document";

export type Visibility = "public" | "private" | "invitation_only";

export type ReactionType =
  | "candle"
  | "flower"
  | "heart"
  | "prayer"
  | "memory"
  | "gratitude";

export type NotificationType =
  | "memorial_created"
  | "content_pending"
  | "content_approved"
  | "member_invited"
  | "member_joined"
  | "anniversary"
  | "report_submitted"
  | "moderation_action"
  | "guardianship_transferred";

export type MemorialRole =
  | "guardian"
  | "co_guardian"
  | "collaborator"
  | "trusted_contributor"
  | "member"
  | "visitor";

export type PublicationMode =
  | "strict_review"
  | "trusted_members_auto_publish"
  | "open_with_post_moderation"
  | "family_only";

export type AbuseType =
  | "impersonation"
  | "offensive_content"
  | "spam"
  | "fraud"
  | "harassment"
  | "privacy_violation"
  | "copyright"
  | "minor_content"
  | "other";

// ---- Domain Entities ----
export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  birthDate: string | null;
  location: string | null;
  language: string;
  timezone: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  accountStatus: "active" | "suspended" | "deactivated";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  biography: string | null;
  mainPhotoUrl: string | null;
  coverPhotoUrl: string | null;
  visibility: string;
  status: string;
  publicationMode: string;
  createdBy: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MemorialWithGuardian extends Memorial {
  guardian?: {
    id: string;
    profileId: string;
    fullName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    relationship: string;
  } | null;
  stats?: {
    memberCount: number;
    postCount: number;
    photoCount: number;
    supportMessageCount: number;
  };
}

export interface MemorialGuardian {
  id: string;
  memorialId: string;
  profileId: string;
  role: "guardian" | "co_guardian";
  relationship: string;
  relationshipDescription: string | null;
  canEdit: boolean;
  canManageMembers: boolean;
  canModerate: boolean;
  isActive: boolean;
  transferredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemorialMember {
  id: string;
  memorialId: string;
  profileId: string;
  status: MembershipStatus;
  role: MemorialRole;
  relationship: string | null;
  relationshipDescription: string | null;
  requestedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  memorialId: string;
  authorId: string;
  title: string | null;
  content: string;
  status: string;
  publishedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isPinned: boolean;
  pinOrder: number | null;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    fullName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  memorial?: {
    id: string;
    slug: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface MediaAsset {
  id: string;
  memorialId: string;
  uploadedBy: string;
  postId: string | null;
  albumId: string | null;
  mediaType: MediaType;
  originalFilename: string;
  originalPath: string;
  originalSize: number;
  mimeType: string;
  status: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  exifStripped: boolean;
  perceptualHash: string | null;
  isDuplicate: boolean;
  altText: string | null;
  ocrText: string | null;
  ocrConfidence: number | null;
  moderationScore: number | null;
  moderationFlags: string[] | null;
  aiGenerated: boolean;
  aiDisclosure: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SupportMessage {
  id: string;
  memorialId: string;
  authorId: string;
  content: string;
  reactionType: ReactionType | null;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  memorialId: string;
  targetType: "post" | "comment" | "media" | "memorial" | "profile";
  targetId: string;
  abuseType: AbuseType;
  description: string;
  evidenceUrl: string | null;
  status: ModerationStatus;
  priority: "low" | "medium" | "high" | "critical";
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolution: string | null;
  actionTaken: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- API Response Types ----
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ---- Permission Types ----
export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canModerate: boolean;
  canPublish: boolean;
  canApproveContent: boolean;
  canConfigure: boolean;
  canTransferGuardianship: boolean;
}

// ---- Form Types ----
export interface CreateMemorialForm {
  firstName: string;
  lastName: string;
  nickname?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  biography?: string;
  visibility: Visibility;
  guardianRelationship: string;
  guardianRelationshipDescription?: string;
}

export interface CreatePostForm {
  memorialId: string;
  title?: string;
  content: string;
  mediaIds?: string[];
  status?: "draft" | "pending_family_review";
}
