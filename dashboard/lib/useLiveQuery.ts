'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useLiveQuery<T>(fetcher: (sb: ReturnType<typeof createClient>) => Promise<T>, tables: string[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const sb = createClient();
    let cancelled = false;
    const run = async () => {
      const result = await fetcherRef.current(sb);
      if (!cancelled) { setData(result); setLoading(false); }
    };
    void run();
    const channel = sb.channel('live');
    for (const table of tables) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => { void run(); });
    }
    channel.subscribe();
    return () => { cancelled = true; void sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(',')]);

  return { data, loading };
}
