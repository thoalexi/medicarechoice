import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function HelpPopover({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className="size-8 min-h-8 min-w-8 rounded-full text-primary"
        >
          <CircleHelp aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto border bg-card text-card-foreground"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}