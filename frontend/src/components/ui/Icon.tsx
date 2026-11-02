import { cn } from "@/lib/cn";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
};

/**
 * Material Symbols Outlined icon, matching the Stitch design source.
 */
export function Icon({
  name,
  className,
  filled = false,
  weight = 400,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
}: IconProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}
