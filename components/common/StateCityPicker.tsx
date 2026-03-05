"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { getAllStates, getCitiesByState } from "@/lib/data/india-locations";

interface StateCityPickerProps {
  state?: string;
  city?: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function StateCityPicker({
  state,
  city,
  onStateChange,
  onCityChange,
  required = false,
  disabled = false,
}: StateCityPickerProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const lastStateRef = useRef<string | undefined>(undefined);

  // Update cities when state changes
  useEffect(() => {
    // Only update if state actually changed
    if (state !== lastStateRef.current) {
      lastStateRef.current = state;

      if (state) {
        const cities = getCitiesByState(state);
        setAvailableCities(cities);
      } else {
        setAvailableCities([]);
      }
    }
  }, [state]); // Only depend on state, not city

  const handleStateChange = (newState: string) => {
    onStateChange(newState);
  };

  const handleCityChange = (newCity: string) => {
    onCityChange(newCity);
  };

  const states = getAllStates();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="state" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          State/UT {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={state}
          onValueChange={handleStateChange}
          disabled={disabled}
        >
          <SelectTrigger id="state">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          City {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={city}
          onValueChange={handleCityChange}
          disabled={disabled || !state}
        >
          <SelectTrigger id="city">
            <SelectValue
              placeholder={state ? "Select city" : "Select state first"}
            />
          </SelectTrigger>
          <SelectContent>
            {state && availableCities.length > 0 ? (
              availableCities.map((c, index) => (
                <SelectItem key={`${c}-${index}`} value={c}>
                  {c}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {state ? "No cities available" : "Select state first"}
              </div>
            )}
          </SelectContent>
        </Select>
        {state && availableCities.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No cities found for {state}
          </p>
        )}
      </div>
    </div>
  );
}
