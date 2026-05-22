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
      <p className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-foreground">
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
          className="flex-1 h-11 px-4 rounded-[6px] bg-white border-[1.5px] border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10 text-base transition-all"
        />
        {selectedCity && (
          <button
            onClick={() => onCityChange("")}
            className="inline-action h-11 px-5 rounded-[6px] border-[1.5px] border-gray-300 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-all"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {POPULAR_CITIES.map((c) => (
          <button
            key={c}
            onClick={() => onCityChange(selectedCity === c ? "" : c)}
            className={`inline-action text-sm px-4 py-2 rounded-[6px] border-[1.5px] font-medium transition-all ${
              selectedCity === c
                ? "bg-brand text-white border-brand"
                : "bg-white border-gray-300 hover:border-brand hover:text-brand"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
