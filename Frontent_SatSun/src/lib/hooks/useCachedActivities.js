import { useEffect, useState } from "react";
import { getActivitiesCached } from "../api";

export default function useCachedActivities(params = { limit: 500 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cached = getActivitiesCached(params);
    (async () => {
      setLoading(true);
      try {
        const initial = await cached.initial;
        if (mounted && initial?.items) setItems(initial.items || []);
        const fresh = await cached.refresh;
        if (!mounted) return;
        setItems(fresh?.items || []);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params]);

  return { items, loading, error };
}
