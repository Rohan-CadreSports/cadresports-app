"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

const POPULAR_CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Nagpur"];

export function CitySelector({
  selectedCity,
  onCityChange,
}: {
  selectedCity: string;
  onCityChange: (city: string) => void;
}) {
  const [input, setInput] = useState("");

  return (
    <div>
      <p className="text-sm font-semibold mb-2.5 flex items-center gap-1.5 text-foreground">
        <MapPin className="w-4 h-4 text-brand" />
        {selectedCity ? `Showing leagues in ${selectedCity}` : "Find leagues in your city"}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              onCityChange(input.trim());
              setInput("");
            }
          }}
          placeholder="Enter city name..."
          className="flex-1 h-12 px-4 rounded-2xl bg-surface border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-base transition-all duration-200"
        />
        {selectedCity && (
          <button
            onClick={() => onCityChange("")}
            className="inline-action h-11 px-4 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {POPULAR_CITIES.map((c) => (
          <button
            key={c}
            onClick={() => onCityChange(selectedCity === c ? "" : c)}
            className={`inline-action text-sm px-3 py-1.5 rounded-full border font-medium transition-all duration-200 ${
              selectedCity === c
                ? "bg-brand text-white border-brand"
                : "bg-surface border-border-light hover:border-brand hover:text-brand hover:bg-brand/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
