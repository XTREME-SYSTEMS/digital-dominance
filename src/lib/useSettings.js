import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { hasRuntimeBase44AppId } from "@/lib/base44Binding";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

export function useSettings() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["app-settings", hasRuntimeBase44AppId ? "bound" : "preview"],
    enabled: hasRuntimeBase44AppId,
    queryFn: async () => {
      const rows = await base44.entities.AppSettings.list("-created_date", 1);
      return rows[0] || null;
    }
  });
  return { settings: { ...DEFAULT_SETTINGS, ...(data || {}) }, record: data, isLoading, refetch };
}