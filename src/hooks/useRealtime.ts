import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';

export const useRealtime = (table: string, callback: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
        callback();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback]);
};
