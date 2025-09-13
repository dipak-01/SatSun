import { useEffect, useState } from "react";
import { getWeekendsCached } from "../api";

export default function useCachedWeekends(params = { includeDays: true }) {
  const [weekends, setWeekends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cached = getWeekendsCached(params);
    (async () => {
      setLoading(true);
      try {
        const initial = await cached.initial;
        if (mounted && initial) setWeekends(initial || []);
        const fresh = await cached.refresh;
        if (!mounted) return;
        setWeekends(fresh || []);
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

  return { weekends, loading, error };
}
