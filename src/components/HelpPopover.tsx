import { useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function HelpPopover({ label, children, compact = false }: { label: string; children: ReactNode; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <span onMouseEnter={show} onMouseLeave={hide}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            className={compact ? "size-5 min-h-5 min-w-5 rounded-full text-primary [&_svg]:size-4" : "size-8 min-h-8 min-w-8 rounded-full text-primary"}
            onFocus={show}
          >
            <CircleHelp aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          onMouseEnter={show}
          onMouseLeave={hide}
          className="max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto border bg-card text-card-foreground"
        >
          {children}
        </PopoverContent>
      </Popover>
    </span>
  );
}