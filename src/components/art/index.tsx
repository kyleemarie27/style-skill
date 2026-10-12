import type { SizeTheme } from "../../content/pregnancy";
import { ANIMALS } from "./animals";
import { FRUIT } from "./fruit";
import { OBJECTS } from "./objects";
import type { ArtMap } from "./shared";

export { BabyArt } from "./Baby";

export const ART: Record<SizeTheme, ArtMap> = { fruit: FRUIT, object: OBJECTS, animal: ANIMALS };

/** Draw one comparison item; falls back to a soft circle if a key is missing. */
export function SizeArt({ theme, art, size = 120, title }: { theme: SizeTheme; art: string; size?: number; title?: string }) {
  const Draw = ART[theme][art];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={title}>
      {Draw ? <Draw /> : <circle cx="50" cy="50" r="30" fill="var(--brand-soft)" />}
    </svg>
  );
}
