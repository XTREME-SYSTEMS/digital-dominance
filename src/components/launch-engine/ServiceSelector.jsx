import React from "react";
import { Wrench } from "lucide-react";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";

export default function ServiceSelector({ templateKey, selectedServices, onChange }) {
  const industry = TOP_20_INDUSTRIES.find((t) => t.id === templateKey);
  const allServices = industry?.services || [];
  const allSelected = selectedServices.length === allServices.length && allServices.length > 0;

  const toggleService = (svc) => {
    if (selectedServices.includes(svc)) {
      onChange(selectedServices.filter((s) => s !== svc));
    } else {
      onChange([...selectedServices, svc]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...allServices]);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-stone-800">Services per Site</h3>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-amber-600 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
          Include all known services
        </label>
      </div>
      {allServices.length === 0 ? (
        <p className="text-xs text-stone-400">No services defined for this industry.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {allServices.map((svc) => (
            <label key={svc} className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 cursor-pointer hover:border-amber-300 transition">
              <input type="checkbox" checked={selectedServices.includes(svc)} onChange={() => toggleService(svc)} className="rounded" />
              {svc}
            </label>
          ))}
        </div>
      )}
      <p className="text-[10px] text-stone-400 mt-2">
        {selectedServices.length} of {allServices.length} services selected — each site will include all selected services with unique, location-specific descriptions.
      </p>
    </div>
  );
}