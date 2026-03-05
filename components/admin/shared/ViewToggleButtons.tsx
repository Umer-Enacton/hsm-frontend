import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleButtonsProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function ViewToggleButtons({
  viewMode,
  onViewModeChange,
}: ViewToggleButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant={viewMode === "grid" ? "default" : "outline"}
        className="h-8 w-8 p-0"
        onClick={() => onViewModeChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant={viewMode === "list" ? "default" : "outline"}
        className="h-8 w-8 p-0"
        onClick={() => onViewModeChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
