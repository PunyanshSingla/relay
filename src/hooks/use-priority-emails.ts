import useSWRInfinite from "swr/infinite";
import type { Email } from "@/types/email";

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

interface UsePriorityEmailListResult {
  emails: Email[];
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

function buildKey(filter: string, sender?: string) {
  return (_index: number, previousPageData: EmailsApiResponse | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const params = new URLSearchParams({ filter });
    if (sender) params.set("sender", sender);
    if (previousPageData?.nextCursor) params.set("cursor", previousPageData.nextCursor);
    return `/api/emails?${params.toString()}`;
  };
}

export function usePriorityEmailList(
  filter: string,
  sender?: string
): UsePriorityEmailListResult {
  const {
    data, size, setSize, isValidating, mutate,
  } = useSWRInfinite<EmailsApiResponse | undefined>(
    buildKey(filter, sender),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
    }
  );

  const emails = data ? data.flatMap((page) => page?.emails ?? []) : [];
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : true;
  const loading = !data;

  const loadMore = () => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  };

  // Determine which priority groups have loaded
  // P1 emails come first due to sort order, then P2, then P3
  const p1Emails = emails.filter((e) => e.priority === "P1");
  const p2Emails = emails.filter((e) => e.priority === "P2");
  const p3Emails = emails.filter((e) => e.priority === "P3");

  // If we have emails and are not loading the first page, all groups are "loaded"
  // The staggered animation in PriorityEmailList handles the visual reveal
  const groupsLoaded = emails.length > 0;

  return {
    emails,
    loading,
    loadingGroups: {
      p1: !groupsLoaded,
      p2: !groupsLoaded,
      p3: !groupsLoaded,
    },
    hasMore,
    isValidating,
    mutate: () => {},
    loadMore,
  };
}
