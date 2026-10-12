import React, { useState, useMemo } from "react";
import { MapPin, Building2, Search, X, Plus, Check } from "lucide-react";
import { US_STATES, US_COUNTIES, slugify } from "@/lib/usCounties";
import { US_CITIES } from "@/lib/usCities";

/**
 * Reusable programmatic targeting system — state → county → city selection.
 * Controlled component: receives value + onChange.
 * value shape: { selectedStates: [], selectedCounties: [], selectedCities: [] }
 */
export default function LocationTargetingSystem({ value, onChange }) {
  const [cityInput, setCityInput] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const selectedStates = value?.selectedStates || [];
  const selectedCounties = value?.selectedCounties || [];
  const selectedCities = value?.selectedCities || [];

  const availableCounties = useMemo(() => {
    const counties = [];
    selectedStates.forEach((st) => {
      (US_COUNTIES[st] || []).forEach((c) => counties.push({ state: st, county: c }));
    });
    return counties;
  }, [selectedStates]);

  const filteredStates = useMemo(() => {
    if (!stateFilter) return US_STATES;
    const f = stateFilter.toLowerCase();
    return US_STATES.filter((s) => s.name.toLowerCase().includes(f) || s.code.toLowerCase().includes(f));
  }, [stateFilter]);

  const toggleState = (code) => {
    const next = selectedStates.includes(code)
      ? selectedStates.filter((s) => s !== code)
      : [...selectedStates, code];
    onChange({ ...value, selectedStates: next });
  };

  const toggleCounty = (state, county) => {
    const key = `${county}, ${state}`;
    const next = selectedCounties.includes(key)
      ? selectedCounties.filter((c) => c !== key)
      : [...selectedCounties, key];
    onChange({ ...value, selectedCounties: next });
  };

  const addCity = () => {
    if (!cityInput.trim()) return;
    const parts = cityInput.split(",").map((p) => p.trim());
    const city = parts[0];
    const state = parts[1]?.toUpperCase() || selectedStates[0] || "";
    const county = parts[2] || "";
    if (city && state) {
      onChange({ ...value, selectedCities: [...selectedCities, { city, state, county }] });
      setCityInput("");
    }
  };

  const removeCity = (idx) => {
    onChange({ ...value, selectedCities: selectedCities.filter((_, i) => i !== idx) });
  };

  const addAllCountiesAsCities = () => {
    const cities = selectedCounties.map((key) => {
      const [county, state] = key.split(", ");
      return { city: county.replace(/ County$/, ""), state, county };
    });
    // Deduplicate
    const existing = new Set(selectedCities.map((c) => `${c.city},${c.state}`));
    const newCities = cities.filter((c) => !existing.has(`${c.city},${c.state}`));
    onChange({ ...value, selectedCities: [...selectedCities, ...newCities] });
  };

  const clearAll = () => {
    onChange({ selectedStates: [], selectedCounties: [], selectedCities: [] });
  };

  const selectAllStates = () => {
    onChange({ ...value, selectedStates: US_STATES.map((s) => s.code) });
  };

  const selectAllCounties = () => {
    const allCountyKeys = availableCounties.map((c) => `${c.county}, ${c.state}`);
    onChange({ ...value, selectedCounties: allCountyKeys });
  };

  const selectAllCities = () => {
    const citiesForStates = US_CITIES.filter((c) => selectedStates.includes(c.state)).map((c) => ({
      city: c.city, state: c.state, county: "",
    }));
    const existing = new Set(selectedCities.map((c) => `${c.city},${c.state}`));
    const newCities = citiesForStates.filter((c) => !existing.has(`${c.city},${c.state}`));
    onChange({ ...value, selectedCities: [...selectedCities, ...newCities] });
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-stone-50 border border-stone-200 px-4 py-2.5">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-stone-800">{selectedStates.length} states</span>
          <span className="text-stone-300">·</span>
          <span className="font-bold text-stone-800">{selectedCounties.length} counties</span>
          <span className="text-stone-300">·</span>
          <span className="font-bold text-amber-600">{selectedCities.length} cities → {selectedCities.length} sites</span>
        </div>
        {(selectedStates.length > 0 || selectedCities.length > 0) && (
          <button onClick={clearAll} className="text-xs font-bold text-red-500 hover:text-red-600">Clear all</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* States */}
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">States</h3>
            </div>
            <button onClick={selectAllStates} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">
              Select All
            </button>
          </div>
          <input
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder="Filter states..."
            className="w-full mb-2 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
          />
          <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
            {filteredStates.map((s) => (
              <button
                key={s.code}
                onClick={() => toggleState(s.code)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  selectedStates.includes(s.code)
                    ? "bg-amber-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:border-amber-300 border border-stone-200"
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>

        {/* Counties */}
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">Counties</h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedStates.length > 0 && (
                <button onClick={selectAllCounties} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">
                  Select All
                </button>
              )}
              {selectedCounties.length > 0 && (
                <button onClick={addAllCountiesAsCities} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">
                  Add as cities →
                </button>
              )}
            </div>
          </div>
          {selectedStates.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">Select states first</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {availableCounties.map(({ state, county }) => {
                const key = `${county}, ${state}`;
                return (
                  <button
                    key={key}
                    onClick={() => toggleCounty(state, county)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      selectedCounties.includes(key)
                        ? "bg-emerald-500 text-white"
                        : "bg-stone-100 text-stone-600 hover:border-emerald-300 border border-stone-200"
                    }`}
                  >
                    {county}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cities */}
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-800">Cities / Targets</h3>
            </div>
            {selectedStates.length > 0 && (
              <button onClick={selectAllCities} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">
                Select All Cities
              </button>
            )}
          </div>
          <div className="flex gap-1.5 mb-2">
            <input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCity()}
              placeholder="City, ST, County"
              className="flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
            />
            <button onClick={addCity} className="rounded-lg bg-stone-800 px-2.5 py-1.5 text-xs font-bold text-white">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {selectedCities.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">Add cities manually or from counties</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
              {selectedCities.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800">
                  {c.city}, {c.state}
                  <button onClick={() => removeCity(i)} className="text-amber-400 hover:text-amber-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}