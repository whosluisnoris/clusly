import { cn } from "./cn";

const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl",
};

// Círculo con la inicial del nombre (no hay fotos de perfil).
export function Avatar({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display grid shrink-0 place-items-center rounded-full bg-accent/15 font-extrabold text-accent-ink ring-1 ring-inset ring-accent/30",
        SIZES[size],
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
