import useSWR from "swr";
import type { Email, Priority } from "@/types/email";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EmailsApiResponse {
  emails: Email[];
  nextCursor: string | null;
  counts: {
    total: number;
    unread: number;
    P1: number;
    P2: number;
    P3: number;
  } | null;
}

interface PriorityGroup {
  emails: Email[];
  loaded: boolean;
}

interface UsePriorityEmailListResult {
  emails: Email[];
  counts: EmailsApiResponse["counts"];
  loading: boolean;
  loadingGroups: {
    p1: boolean;
    p2: boolean;
    p3: boolean;
  };
  hasMore: boolean;
  isValidating: boolean;
  mutate: () => void;
  loadMore: () => void;
}

export function usePriorityEmailList(
  filter: string,
  sender?: string
): UsePriorityEmailListResult {
  const isPriorityMode = filter === "all";

  // ── Priority mode: fetch P1, P2, P3 separately ──
  const p1Key = isPriorityMode
    ? buildKey("P1", sender)
    : filter === "unread"
      ? buildKey("unread", sender)
      : filter === "P1" || filter === "P2" || filter === "P3"
        ? buildKey(filter, sender)
        : null;

  const p2Key = isPriorityMode ? buildKey("P2", sender) : null;
  const p3Key = isPriorityMode ? buildKey("P3", sender) : null;

  const { data: p1Data, isValidating: p1Validating } = useSWR<EmailsApiResponse>(
    p1Key,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const { data: p2Data, isValidating: p2Validating } = useSWR<EmailsApiResponse>(
    p2Key,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const { data: p3Data, isValidating: p3Validating } = useSWR<EmailsApiResponse>(
    p3Key,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // ── Non-priority mode: single query (unread, specific priority, etc.) ──
  const singleKey = !isPriorityMode ? p1Key : null;
  const { data: singleData, isValidating: singleValidating } = useSWR<EmailsApiResponse>(
    singleKey,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // ── Combine results ──
  if (isPriorityMode) {
    const p1Emails = p1Data?.emails ?? [];
    const p2Emails = p2Data?.emails ?? [];
    const p3Emails = p3Data?.emails ?? [];

    const p1Loaded = !!p1Data;
    const p2Loaded = !!p2Data;
    const p3Loaded = !!p3Data;

    const emails = [
      ...p1Emails,
      ...p2Emails,
      ...p3Emails,
    ];

    // Use P1's counts as the source of truth (they're global counts, not per-filter)
    const p1Counts = p1Data?.counts;

    return {
      emails,
      counts: p1Counts
        ? { total: p1Counts.total, unread: p1Counts.unread, P1: p1Counts.P1, P2: p1Counts.P2, P3: p1Counts.P3 }
        : null,
      loading: !p1Data && !p2Data && !p3Data,
      loadingGroups: {
        p1: !p1Loaded,
        p2: !p2Loaded,
        p3: !p3Loaded,
      },
      hasMore: false,
      isValidating: p1Validating || p2Validating || p3Validating,
      mutate: () => {},
      loadMore: () => {},
    };
  }

  // ── Single query mode ──
  return {
    emails: singleData?.emails ?? [],
    counts: singleData?.counts ?? null,
    loading: !singleData,
    loadingGroups: { p1: false, p2: false, p3: false },
    hasMore: !!singleData?.nextCursor,
    isValidating: singleValidating,
    mutate: () => {},
    loadMore: () => {},
  };
}

function buildKey(filter: string, sender?: string): string {
  const params = new URLSearchParams();
  params.set("filter", filter);
  if (sender) params.set("sender", sender);
  return `/api/emails?${params.toString()}`;
}
