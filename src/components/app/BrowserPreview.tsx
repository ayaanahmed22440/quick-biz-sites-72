import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { PreviewFrame } from "@/components/app/PreviewFrame";
import { cn } from "@/lib/utils";

const DEVICES = {
  desktop: { width: 1280, height: 860, label: "Desktop", icon: Monitor },
  tablet: { width: 820, height: 900, label: "Tablet", icon: Tablet },
  mobile: { width: 390, height: 780, label: "Phone", icon: Smartphone },
} as const;

type DeviceKey = keyof typeof DEVICES;

type Props = {
  /** Address shown in the fake browser bar. */
  address?: string;
  children: React.ReactNode;
  className?: string;
  defaultDevice?: DeviceKey;
};

/**
 * Wraps the live website preview in browser chrome with a device switcher, so
 * customers see something that reads as a real website rather than a cropped
 * box. Used by onboarding, the editor and the admin template gallery.
 */
export function BrowserPreview({ address, children, className, defaultDevice = "desktop" }: Props) {
  const [device, setDevice] = useState<DeviceKey>(defaultDevice);
  const { width, height } = DEVICES[device];

  return (
    <div className={cn("rounded-2xl border border-border bg-muted/40 p-2 shadow-sm", className)}>
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="flex-1 truncate rounded-full bg-background px-3 py-1 text-center text-xs text-muted-foreground">
          {address ?? "webwarheads.com/your-business"}
        </div>
        <div className="hidden gap-0.5 rounded-full bg-background p-0.5 sm:flex">
          {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
            const Icon = DEVICES[key].icon;
            return (
              <button
                key={key}
                type="button"
                aria-label={DEVICES[key].label}
                aria-pressed={device === key}
                onClick={() => setDevice(key)}
                className={cn(
                  "rounded-full p-1.5 transition-colors",
                  device === key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto overflow-hidden rounded-xl bg-white" style={{ maxWidth: width }}>
        <PreviewFrame width={width} height={height}>
          {children}
        </PreviewFrame>
      </div>
    </div>
  );
}
