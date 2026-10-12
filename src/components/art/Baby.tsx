/**
 * A simple side-view of the baby that changes with gestational age: a cell ball (4–5 weeks),
 * a curled embryo with a tail and limb buds (6–8 weeks), then a curled fetus whose head
 * shrinks relative to the body as the weeks go on. Drawn in a 100×100 box.
 */
const SKIN = "#f2b9a6";
const SKIN_DARK = "#e39b86";
const LINE = "#b86f5c";

export function BabyArt({ days }: { days: number }) {
  const w = days / 7;
  if (w < 5.5) {
    const t = Math.max(0, Math.min(1, (w - 4) / 1.5));
    return (
      <g>
        <circle cx="50" cy="50" r="30" fill="#f7d9cf" opacity="0.5" />
        <circle cx="66" cy="62" r={9 + 3 * t} fill="#f6d77a" opacity="0.85" />
        <ellipse cx="44" cy="44" rx={14 + 4 * t} ry={12 + 3 * t} fill={SKIN} />
        {[[40, 40], [48, 38], [44, 48], [52, 46], [38, 48]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="3" fill={SKIN_DARK} opacity="0.6" />)}
      </g>
    );
  }
  if (w < 9) {
    const t = (w - 5.5) / 3.5;
    const hr = 12 + 6 * t;
    const bw = 18 + 6 * t;
    return (
      <g>
        <circle cx="72" cy="78" r={9 - 3 * t} fill="#f6d77a" opacity="0.8" />
        {/* tail curling under, shrinking as the weeks pass */}
        <path d={`M44 70C46 82 58 86 ${64 - 4 * t} ${78 - 2 * t}`} stroke={SKIN} strokeWidth={9 - 5 * t} strokeLinecap="round" fill="none" />
        {/* curled back */}
        <path d="M58 34C38 34 34 56 44 70" stroke={SKIN} strokeWidth={bw} strokeLinecap="round" fill="none" />
        <circle cx="58" cy="34" r={hr} fill={SKIN} />
        {/* heart bulge, then arm and leg buds growing */}
        <circle cx={56} cy={54} r={6 + 2 * t} fill={SKIN_DARK} opacity="0.7" />
        <ellipse cx={60} cy={58} rx={2 + 6 * t} ry={2.5 + 1 * t} fill={SKIN} transform={`rotate(${20 + 20 * t} 60 58)`} />
        <ellipse cx={53} cy={74} rx={2 + 6 * t} ry={2.5 + 1 * t} fill={SKIN} transform={`rotate(${-20 + 20 * t} 53 74)`} />
        <circle cx={62 + 2 * t} cy={32} r={2 + 1.5 * t} fill="#5a3d3a" opacity="0.75" />
      </g>
    );
  }
  // Fetus: head-to-body ratio falls from about 1:1 (9 weeks) toward 1:4 (term).
  const t = Math.max(0, Math.min(1, (w - 9) / 31));
  const hr = 22 - 7 * t;
  const hx = 60;
  const hy = 30 + 4 * t;
  const bx = 46 - 2 * t;
  const by = 60;
  const brx = 18 + 6 * t;
  const bry = 22 + 4 * t;
  const chub = 0.6 + 0.4 * t;
  return (
    <g>
      {/* umbilical cord */}
      <path d={`M${bx + 10} ${by + 6}c14 8 22 18 30 30`} stroke="#e8c3cf" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* back leg */}
      <path d={`M${bx - 4} ${by + 12}q${18} ${10} ${26} ${-2}`} stroke={SKIN_DARK} strokeWidth={8 + 5 * chub} strokeLinecap="round" fill="none" />
      {/* body */}
      <ellipse cx={bx} cy={by} rx={brx} ry={bry} fill={SKIN} stroke={SKIN_DARK} strokeWidth="1.2" transform={`rotate(-25 ${bx} ${by})`} />
      {/* front leg: thigh up, shin down */}
      <path d={`M${bx - 6} ${by + 14}q${16} ${-4} ${22} ${-14}q${2} ${12} ${-6} ${22}`} stroke={SKIN} strokeWidth={9 + 6 * chub} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={bx + 12} cy={by + 22} r={3.5 + 2 * chub} fill={SKIN} />
      {/* head */}
      <circle cx={hx} cy={hy} r={hr} fill={SKIN} stroke={SKIN_DARK} strokeWidth="1.2" />
      {/* arm to face */}
      <path d={`M${bx + 6} ${by - 14}q${12} ${4} ${hx - bx - 2} ${-(by - hy) + hr + 2}`} stroke={SKIN_DARK} strokeWidth={6 + 4 * chub} strokeLinecap="round" fill="none" />
      <circle cx={hx + 2} cy={hy + hr - 2} r={3 + 1.5 * chub} fill={SKIN_DARK} />
      {/* face */}
      <path d={`M${hx + hr * 0.25} ${hy - hr * 0.05}q${hr * 0.18} ${hr * 0.16} ${hr * 0.36} 0`} stroke={LINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d={`M${hx - hr * 0.2} ${hy - hr * 0.05}a${hr * 0.16} ${hr * 0.2} 0 1 1 0 ${hr * 0.4}`} stroke={LINE} strokeWidth="1.6" fill={SKIN_DARK} strokeLinecap="round" />
      <path d={`M${hx + hr * 0.95} ${hy + hr * 0.05}q${4} ${4} ${-1} ${7}`} fill={SKIN} stroke={LINE} strokeWidth="1.2" strokeLinecap="round" />
      {w >= 26 && <path d={`M${hx - hr * 0.6} ${hy - hr * 0.85}q${hr * 0.5} ${-hr * 0.3} ${hr * 1.1} ${-hr * 0.05}`} stroke="#c9906a" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />}
      <ellipse cx={hx + hr * 0.45} cy={hy + hr * 0.4} rx={hr * 0.18} ry={hr * 0.11} fill="#f28b9b" opacity={0.25 + 0.3 * t} />
    </g>
  );
}
