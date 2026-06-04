"use client";

import { memo, useCallback } from "react";
import { ALL_POPULAR_INTERESTS } from "@/lib/popular-interests";
import { toggleInterest } from "@/lib/interests";
import { InterestCard } from "./InterestCard";

interface InterestGridProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  socketConnected?: boolean;
}

export const InterestGrid = memo(function InterestGrid({
  selected,
  onChange,
  disabled,
  socketConnected,
}: InterestGridProps) {
  const handleToggle = useCallback(
    (tag: string) => {
      onChange(toggleInterest(selected, tag));
    },
    [selected, onChange]
  );

  return (
    <div
      className="interest-grid grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      role="group"
      aria-label="Interest categories"
    >
      {ALL_POPULAR_INTERESTS.map((interest, index) => (
        <InterestCard
          key={interest.tag}
          interest={interest}
          selected={selected.includes(interest.tag)}
          disabled={disabled}
          index={index}
          networkLive={socketConnected}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
});
