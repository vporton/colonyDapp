export const VERSION: number = Number(process.env.VERSION) || 1;

export enum TaskState {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
  FINALIZED = 'FINALIZED',
}

export enum EventTypes {
  ASSIGNED_TO_TASK = 'ASSIGNED_TO_TASK',
  CANCELLED = 'CANCELLED',
  COLONY_AVATAR_REMOVED = 'COLONY_AVATAR_REMOVED',
  COLONY_AVATAR_UPLOADED = 'COLONY_AVATAR_UPLOADED',
  COLONY_PROFILE_CREATED = 'COLONY_PROFILE_CREATED',
  COLONY_PROFILE_UPDATED = 'COLONY_PROFILE_UPDATED',
  COMMENT_MENTION = 'COMMENT_MENTION',
  COMMENT_POSTED = 'COMMENT_POSTED',
  COMMENT_STORE_CREATED = 'COMMENT_STORE_CREATED',
  DOMAIN_CREATED = 'DOMAIN_CREATED',
  DOMAIN_EDITED = 'DOMAIN_EDITED',
  DOMAIN_SET = 'DOMAIN_SET',
  DUE_DATE_SET = 'DUE_DATE_SET',
  FINALIZED = 'FINALIZED',
  PAYOUT_REMOVED = 'PAYOUT_REMOVED',
  PAYOUT_SET = 'PAYOUT_SET',
  READ_UNTIL = 'READ_UNTIL',
  SKILL_SET = 'SKILL_SET',
  SUBSCRIBED_TO_COLONY = 'SUBSCRIBED_TO_COLONY',
  SUBSCRIBED_TO_TASK = 'SUBSCRIBED_TO_TASK',
  TASK_CANCELLED = 'TASK_CANCELLED',
  TASK_CLOSED = 'TASK_CLOSED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_DESCRIPTION_SET = 'TASK_DESCRIPTION_SET',
  TASK_FINALIZED = 'TASK_FINALIZED',
  TASK_FINALIZED_NOTIFICATION = 'TASK_FINALIZED_NOTIFICATION',
  TASK_INDEX_STORE_REGISTERED = 'TASK_INDEX_STORE_REGISTERED',
  TASK_STORE_REGISTERED = 'TASK_STORE_REGISTERED',
  TASK_STORE_UNREGISTERED = 'TASK_STORE_UNREGISTERED',
  TASK_TITLE_SET = 'TASK_TITLE_SET',
  TOKEN_ADDED = 'TOKEN_ADDED',
  TOKEN_INFO_ADDED = 'TOKEN_INFO_ADDED',
  TOKEN_INFO_REMOVED = 'TOKEN_INFO_REMOVED',
  TOKEN_REMOVED = 'TOKEN_REMOVED',
  UNASSIGNED_FROM_TASK = 'UNASSIGNED_FROM_TASK',
  UNSUBSCRIBED_FROM_COLONY = 'UNSUBSCRIBED_FROM_COLONY',
  UNSUBSCRIBED_FROM_TASK = 'UNSUBSCRIBED_FROM_TASK',
  USER_AVATAR_REMOVED = 'USER_AVATAR_REMOVED',
  USER_AVATAR_UPLOADED = 'USER_AVATAR_UPLOADED',
  USER_PROFILE_CREATED = 'USER_PROFILE_CREATED',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  WORK_INVITE_SENT = 'WORK_INVITE_SENT',
  WORK_REQUEST = 'WORK_REQUEST',
  WORK_REQUEST_CREATED = 'WORK_REQUEST_CREATED',
  WORKER_ASSIGNED = 'WORKER_ASSIGNED',
  WORKER_UNASSIGNED = 'WORKER_UNASSIGNED',
}
