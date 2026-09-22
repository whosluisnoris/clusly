import { Badge } from "@/components/ui";

// Insignia "EN VIVO" del reproductor (rojo, la convención universal).
export function StatusBadge() {
  return (
    <Badge tone="live" size="md" dot="pulse">
      En vivo
    </Badge>
  );
}
