import { useCallback, useEffect, useState } from "react";
import { listIssues } from "../lib/api";

// Loads the list, refreshes every 15s and when the tab regains focus
export function useIssuesList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isFetching, setFetching] = useState(true);

  const refetch = useCallback(async () => {
    setFetching(true);
    try {
      setData(await listIssues());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const timer = setInterval(refetch, 15000);
    window.addEventListener("focus", refetch);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refetch);
    };
  }, [refetch]);

  return { data, error, isFetching, refetch, isLoading: data === null && !error, isError: Boolean(error) };
}

// Wraps one action (create / update / delete) with pending + error state
export function useAction(fn, onSuccess) {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [variables, setVariables] = useState();

  const run = async (arg) => {
    setPending(true);
    setError(null);
    setVariables(arg);
    try {
      const result = await fn(arg);
      await onSuccess?.(result, arg);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };

  return { run, isPending, error, variables, isError: Boolean(error), reset: () => setError(null) };
}
