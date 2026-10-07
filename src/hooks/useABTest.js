import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";

/**
 * useABTest — Frontend hook for A/B testing.
 * Assigns visitors to variants, tracks impressions, and exposes trackConversion.
 */
export function useABTest() {
  const location = useLocation();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    let visitorId = localStorage.getItem("ab_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("ab_visitor_id", visitorId);
    }

    const pagePath = location.pathname;
    const trackedKey = `ab_tracked_${pagePath}`;
    const tracked = JSON.parse(localStorage.getItem(trackedKey) || "[]");

    (async () => {
      try {
        const res = await base44.functions.invoke("abTestEngine", {
          action: "assign",
          page_path: pagePath,
          visitor_id: visitorId,
        });
        const data = res.data || res;
        if (data.assignments && data.assignments.length > 0) {
          setAssignments(data.assignments);
          for (const a of data.assignments) {
            const key = `${a.test_id}_${a.variant}`;
            if (!tracked.includes(key)) {
              tracked.push(key);
              base44.functions.invoke("abTestEngine", {
                action: "track",
                test_id: a.test_id,
                variant: a.variant,
                event_type: "impression",
              });
            }
          }
          localStorage.setItem(trackedKey, JSON.stringify(tracked));
        }
      } catch {
        // Silent fail — A/B tests must never break the page
      }
    })();
  }, [location.pathname]);

  const trackConversion = useCallback(
    (eventName) => {
      for (const a of assignments) {
        if (a.conversion_event === eventName) {
          base44.functions.invoke("abTestEngine", {
            action: "track",
            test_id: a.test_id,
            variant: a.variant,
            event_type: "conversion",
          });
        }
      }
    },
    [assignments]
  );

  const activeTest = assignments[0] || null;
  return {
    variant: activeTest?.variant || null,
    config: activeTest?.config || null,
    trackConversion,
    assignments,
  };
}