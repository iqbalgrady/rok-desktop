import type { Session } from '@/lib/rokcode/types';

export type SessionMetadataRecord = Record<string, unknown>;

type RokDesktopMetadata = {
  kind?: 'review';
  originalSessionID?: string;
  reviewSessionID?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

export const getSessionMetadata = (session: Session | null | undefined): SessionMetadataRecord => {
  const metadata = (session as (Session & { metadata?: unknown }) | null | undefined)?.metadata;
  return isRecord(metadata) ? metadata : {};
};

const getRokDesktopMetadata = (metadata: SessionMetadataRecord): RokDesktopMetadata => {
  const value = metadata.openchamber;
  return isRecord(value) ? value as RokDesktopMetadata : {};
};

export const getReviewSessionID = (session: Session | null | undefined): string | null => {
  const value = getRokDesktopMetadata(getSessionMetadata(session)).reviewSessionID;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const getOriginalSessionID = (session: Session | null | undefined): string | null => {
  const value = getRokDesktopMetadata(getSessionMetadata(session)).originalSessionID;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export const isReviewSession = (session: Session | null | undefined): boolean =>
  getRokDesktopMetadata(getSessionMetadata(session)).kind === 'review' && Boolean(getOriginalSessionID(session));

export const withReviewSessionLink = (
  metadata: SessionMetadataRecord,
  reviewSessionID: string,
): SessionMetadataRecord => {
  const current = getRokDesktopMetadata(metadata);
  return {
    ...metadata,
    "rok-desktop": {
      ...current,
      reviewSessionID,
    },
  };
};

export const withReviewSessionMarker = (
  metadata: SessionMetadataRecord,
  originalSessionID: string,
): SessionMetadataRecord => {
  const current = getRokDesktopMetadata(metadata);
  return {
    ...metadata,
    "rok-desktop": {
      ...current,
      kind: 'review' as const,
      originalSessionID,
    },
  };
};

export const withoutReviewSessionLink = (
  metadata: SessionMetadataRecord,
  reviewSessionID: string,
): SessionMetadataRecord => {
  const current = getRokDesktopMetadata(metadata);
  if (current.reviewSessionID !== reviewSessionID) return metadata;

  const restRokDesktop = { ...current };
  delete restRokDesktop.reviewSessionID;
  const next: SessionMetadataRecord = { ...metadata };
  if (Object.keys(restRokDesktop).length > 0) {
    next.openchamber = restRokDesktop;
  } else {
    delete next.openchamber;
  }
  return next;
};
