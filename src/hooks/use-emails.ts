import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import type { Email, FilterOption } from "@/types/email";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FilterId = FilterOption["id"];

interface EmailsApiResponse {
  emails: Email[];
  nextCursor: string | null;
  counts: { total: number; unread: number; P1: number; P2: number; P3: number } | null;
}

interface EmailDetailApiResponse {
  email: Email;
}

function emailListKey(filter: FilterId, sender?: string) {
  return (_index: number, previousPageData: EmailsApiResponse | null) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (sender) params.set("sender", sender);
    if (previousPageData?.nextCursor) params.set("cursor", previousPageData.nextCursor);
    return `/api/emails?${params.toString()}`;
  };
}

function useEmailList(filter: FilterId, sender?: string) {
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<
    EmailsApiResponse | undefined
  >(emailListKey(filter, sender), fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateFirstPage: true,
    parallel: false,
  });

  const emails = data ? data.flatMap((page) => page?.emails ?? []) : [];
  const counts = data?.[0]?.counts ?? null;
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : true;
  const loading = !data && !error;

  const loadMore = () => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  };

  return {
    emails,
    counts,
    hasMore,
    loading,
    isValidating,
    error,
    loadMore,
    mutate,
    setSize,
  };
}

export function useEmailDetail(id: string | null) {
  const { data, error, isValidating, mutate } = useSWR<EmailDetailApiResponse | undefined>(
    id ? `/api/emails/${id}` : null,
    fetcher,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    },
  );

  return {
    email: data?.email ?? null,
    loading: !data && !error,
    error,
    isValidating,
    mutate,
  };
}

export function useEmailCounts(phase: string | undefined) {
  const isSyncing = phase === "classifying" || phase === "syncing" || phase === "complete";

  const { data, error } = useSWR<EmailsApiResponse["counts"]>(
    "/api/emails/counts",
    fetcher,
    {
      refreshInterval: isSyncing
        ? phase === "classifying" ? 3000 : 5000
        : 30000,
      revalidateOnFocus: true,
    },
  );

  return {
    counts: data ?? null,
    error,
  };
}
