import type { ArtMap } from "./shared";
import { Shine } from "./shared";

/** Everyday objects on a 100×100 canvas. Not to scale. */
export const OBJECTS: ArtMap = {
  salt: () => (
    <g>
      <path d="M50 22l26 14v28L50 78 24 64V36z" fill="#f4f1ec" />
      <path d="M50 22l26 14-26 14-26-14z" fill="#ffffff" />
      <path d="M50 50v28L24 64V36z" fill="#dcd6cc" />
      <path d="M50 22l26 14v28L50 78 24 64V36z" fill="none" stroke="#c9c1b4" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  ),
  pin: () => (
    <g>
      <path d="M44 44L84 88" stroke="#a9b0ba" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 44L84 88" stroke="#e3e7ec" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="38" cy="38" r="16" fill="#d63b4a" />
      <Shine cx={33} cy={32} rx={5} ry={4} />
    </g>
  ),
  rice: () => (
    <g>
      <ellipse cx="50" cy="50" rx="34" ry="14" fill="#f6f1e4" transform="rotate(-25 50 50)" />
      <ellipse cx="50" cy="50" rx="34" ry="14" fill="none" stroke="#e0d6bd" strokeWidth="2" transform="rotate(-25 50 50)" />
      <Shine cx={44} cy={48} rx={14} ry={3} />
    </g>
  ),
  candy: () => (
    <g>
      <ellipse cx="50" cy="56" rx="32" ry="24" fill="#2a74c9" />
      <ellipse cx="50" cy="52" rx="32" ry="22" fill="#3b8ae0" />
      <Shine cx={40} cy={44} rx={10} ry={5} />
    </g>
  ),
  gummy: () => (
    <g fill="#e8414f" opacity="0.92">
      <circle cx="36" cy="22" r="8" />
      <circle cx="64" cy="22" r="8" />
      <circle cx="50" cy="32" r="16" />
      <ellipse cx="50" cy="62" rx="20" ry="22" />
      <ellipse cx="30" cy="54" rx="7" ry="9" />
      <ellipse cx="70" cy="54" rx="7" ry="9" />
      <ellipse cx="38" cy="82" rx="9" ry="8" />
      <ellipse cx="62" cy="82" rx="9" ry="8" />
      <Shine cx={42} cy={54} rx={5} ry={10} />
    </g>
  ),
  quarter: () => (
    <g>
      <circle cx="50" cy="50" r="36" fill="#b9bec6" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#9aa0aa" strokeWidth="3" strokeDasharray="2 2" />
      <circle cx="50" cy="50" r="28" fill="#cdd2d9" />
      <text x="50" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fill="#8d939c" fontFamily="Georgia, serif">25¢</text>
    </g>
  ),
  paperclip: () => (
    <path d="M38 80V30a12 12 0 0 1 24 0v44a7 7 0 0 1-14 0V34" fill="none" stroke="#8d96a3" strokeWidth="5" strokeLinecap="round" transform="rotate(20 50 50)" />
  ),
  golfball: () => (
    <g>
      <path d="M44 76h12l-2 16h-8z" fill="#e6c27a" />
      <circle cx="50" cy="46" r="30" fill="#fbfbf8" stroke="#dedbd2" strokeWidth="2" />
      {[[40, 34], [52, 30], [62, 38], [36, 48], [48, 44], [60, 52], [42, 60], [54, 62], [64, 44]].map(([x, y]) => (
        <circle key={x + "-" + y} cx={x} cy={y} r="2.5" fill="#e6e3da" />
      ))}
    </g>
  ),
  egg: () => (
    <g>
      <path d="M50 14c18 0 30 30 30 48 0 16-14 26-30 26S20 78 20 62c0-18 12-48 30-48z" fill="#f1dcc0" />
      <Shine cx={40} cy={40} rx={6} ry={12} />
    </g>
  ),
  lipbalm: () => (
    <g>
      <rect x="38" y="36" width="24" height="54" rx="4" fill="#f28fae" />
      <rect x="38" y="52" width="24" height="18" fill="#fbd3e0" />
      <rect x="36" y="12" width="28" height="26" rx="4" fill="#e66a92" />
      <Shine cx={44} cy={24} rx={2} ry={8} />
    </g>
  ),
  card: () => (
    <g>
      <rect x="12" y="26" width="76" height="48" rx="6" fill="#5b5fc7" />
      <rect x="12" y="36" width="76" height="9" fill="#2b2f86" />
      <rect x="20" y="52" width="14" height="11" rx="2" fill="#f2c84b" />
      <rect x="42" y="58" width="36" height="4" rx="2" fill="#b9bbf0" />
    </g>
  ),
  deck: () => (
    <g>
      <rect x="30" y="20" width="44" height="62" rx="5" fill="#e9e4dc" transform="rotate(8 52 51)" />
      <rect x="26" y="18" width="44" height="62" rx="5" fill="#fff" stroke="#d9d2c6" strokeWidth="2" />
      <path d="M48 36c-8 8-12 12-12 17a6 6 0 0 0 10 4l-2 7h8l-2-7a6 6 0 0 0 10-4c0-5-4-9-12-17z" fill="#2b2230" />
      <text x="32" y="32" fontSize="10" fontWeight="700" fill="#2b2230" fontFamily="Georgia, serif">A</text>
    </g>
  ),
  mouse: () => (
    <g>
      <path d="M30 70c0 12 9 20 20 20s20-8 20-20V36c0-12-9-20-20-20S30 24 30 36z" fill="#d7dbe2" />
      <path d="M30 40c0-14 9-24 20-24v24z" fill="#c4c9d2" />
      <path d="M50 16v24" stroke="#9aa1ad" strokeWidth="2" />
      <rect x="47" y="24" width="6" height="10" rx="3" fill="#7a8290" />
      <path d="M50 16c0-6 4-10 10-12" stroke="#9aa1ad" strokeWidth="2.5" fill="none" />
    </g>
  ),
  remote: () => (
    <g>
      <rect x="36" y="10" width="28" height="80" rx="10" fill="#3a3f4a" />
      <circle cx="50" cy="22" r="4" fill="#e85d5d" />
      <circle cx="50" cy="40" r="8" fill="#5a6070" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={r + "-" + c} cx={42 + c * 8} cy={58 + r * 8} r="2.6" fill="#8b92a1" />))}
    </g>
  ),
  phone: () => (
    <g>
      <rect x="30" y="10" width="40" height="80" rx="8" fill="#2f3440" />
      <rect x="33" y="16" width="34" height="66" rx="4" fill="#8fc3e8" />
      <rect x="44" y="12" width="12" height="3" rx="1.5" fill="#1b1f27" />
      <path d="M33 60l12-12 8 8 6-6 8 8v24H33z" fill="#6fae8a" opacity="0.8" />
      <circle cx="58" cy="30" r="5" fill="#f6d36a" />
    </g>
  ),
  book: () => (
    <g>
      <rect x="26" y="12" width="48" height="76" rx="3" fill="#e2814a" />
      <rect x="26" y="12" width="7" height="76" fill="#c66632" />
      <rect x="40" y="28" width="26" height="4" rx="2" fill="#fbe3cf" />
      <rect x="40" y="36" width="18" height="3" rx="1.5" fill="#fbe3cf" />
      <circle cx="53" cy="62" r="8" fill="#fbe3cf" opacity="0.7" />
    </g>
  ),
  tablet: () => (
    <g>
      <rect x="22" y="12" width="56" height="76" rx="7" fill="#2f3440" />
      <rect x="26" y="17" width="48" height="66" rx="3" fill="#b4d3ef" />
      <rect x="32" y="24" width="16" height="16" rx="4" fill="#f28b9b" />
      <rect x="52" y="24" width="16" height="16" rx="4" fill="#6fae8a" />
      <rect x="32" y="44" width="16" height="16" rx="4" fill="#f6d36a" />
      <rect x="52" y="44" width="16" height="16" rx="4" fill="#8f86d6" />
    </g>
  ),
  sneaker: () => (
    <g>
      <path d="M12 66c0-10 4-22 10-28 6 0 10 8 18 10 10 2 20 2 28 8 10 6 20 6 20 14v6H12z" fill="#5aa7de" />
      <path d="M40 48c10 2 20 2 28 8 10 6 20 6 20 14H40z" fill="#3b7fc4" />
      <path d="M12 72h76v6c0 2-2 4-4 4H16c-2 0-4-2-4-4z" fill="#d9d2c6" />
      <path d="M22 38c4 10 12 14 18 14" stroke="#ffffff" strokeWidth="4" fill="none" />
      <path d="M38 50l4-6M46 52l4-6M54 54l4-6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  football: () => (
    <g>
      <ellipse cx="50" cy="50" rx="38" ry="22" fill="#8a4b2a" transform="rotate(-25 50 50)" />
      <path d="M36 58l28-16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      {[-9, -3, 3, 9].map((d) => <path key={d} d={`M${50 + d - 3} ${50 - d * 0.57 - 5}l6 10`} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />)}
      <path d="M20 66l8-4M72 34l8-4" stroke="#f2e8de" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  hardcover: () => (
    <g>
      <rect x="22" y="12" width="56" height="76" rx="3" fill="#2f6b6a" />
      <rect x="22" y="12" width="9" height="76" fill="#235453" />
      <rect x="40" y="26" width="30" height="20" rx="2" fill="#f2d79a" />
      <rect x="44" y="32" width="22" height="3" rx="1.5" fill="#2f6b6a" />
      <rect x="44" y="38" width="14" height="3" rx="1.5" fill="#2f6b6a" />
    </g>
  ),
  basketball: () => (
    <g>
      <circle cx="50" cy="50" r="36" fill="#e9782e" />
      <g stroke="#7a3a14" strokeWidth="2.5" fill="none">
        <path d="M14 50h72M50 14v72" />
        <path d="M24 24c10 10 10 42 0 52M76 24c-10 10-10 42 0 52" />
      </g>
    </g>
  ),
  teddy: () => (
    <g fill="#b07a4f">
      <circle cx="32" cy="22" r="9" />
      <circle cx="68" cy="22" r="9" />
      <circle cx="50" cy="34" r="20" />
      <ellipse cx="50" cy="70" rx="22" ry="20" />
      <circle cx="26" cy="62" r="8" />
      <circle cx="74" cy="62" r="8" />
      <circle cx="36" cy="88" r="9" />
      <circle cx="64" cy="88" r="9" />
      <ellipse cx="50" cy="40" rx="9" ry="7" fill="#e8c7a2" />
      <circle cx="50" cy="37" r="2.6" fill="#2b2230" />
      <circle cx="43" cy="30" r="2.4" fill="#2b2230" />
      <circle cx="57" cy="30" r="2.4" fill="#2b2230" />
      <ellipse cx="50" cy="72" rx="12" ry="11" fill="#e8c7a2" />
    </g>
  ),
  hairdryer: () => (
    <g>
      <path d="M58 52l8 34c1 4-2 6-6 6h-6c-3 0-5-2-6-5l-6-31z" fill="#c95b8a" />
      <path d="M16 34c0-10 8-16 18-16h30c12 0 20 8 20 18s-8 18-20 18H34c-10 0-18-8-18-20z" fill="#e57aa6" />
      <ellipse cx="84" cy="36" rx="5" ry="16" fill="#c95b8a" />
      <circle cx="40" cy="36" r="8" fill="#f6b6cf" />
    </g>
  ),
  sugar: () => (
    <g>
      <path d="M26 22h48l4 66H22z" fill="#f7f3ea" stroke="#ddd5c4" strokeWidth="2" />
      <path d="M26 22l6-8h36l6 8z" fill="#e8e1d1" />
      <rect x="30" y="44" width="40" height="22" rx="3" fill="#4f88c6" />
      <text x="50" y="59" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">SUGAR</text>
    </g>
  ),
  waterbottle: () => (
    <g>
      <rect x="42" y="8" width="16" height="10" rx="2" fill="#3b7fc4" />
      <path d="M40 18h20v8c6 4 8 8 8 14v44c0 4-4 8-8 8H40c-4 0-8-4-8-8V40c0-6 2-10 8-14z" fill="#bfe1f6" />
      <rect x="32" y="48" width="36" height="20" fill="#5aa7de" />
      <Shine cx={38} cy={76} rx={2} ry={6} />
    </g>
  ),
  laptop: () => (
    <g>
      <rect x="20" y="20" width="60" height="42" rx="4" fill="#3a3f4a" />
      <rect x="24" y="24" width="52" height="34" rx="2" fill="#9fc9ea" />
      <path d="M10 66h80l-6 10H16z" fill="#c4c9d2" />
      <rect x="42" y="66" width="16" height="3" rx="1.5" fill="#9aa1ad" />
    </g>
  ),
  bowlingpin: () => (
    <g>
      <path d="M50 8c8 0 10 8 9 16-1 6-4 10-4 14 0 6 14 16 14 32 0 12-8 22-19 22S31 82 31 70c0-16 14-26 14-32 0-4-3-8-4-14-1-8 1-16 9-16z" fill="#f7f4ef" stroke="#dcd6cc" strokeWidth="1.5" />
      <path d="M45 30h10M44 35h12" stroke="#d63b4a" strokeWidth="3" />
    </g>
  ),
  helmet: () => (
    <g>
      <path d="M18 56c0-24 16-40 36-40s30 14 30 34v10H52l-4 18H26c-6-6-8-14-8-22z" fill="#2f5fa8" />
      <path d="M58 60h30M58 70h26M66 56v24M78 56v20" stroke="#c4c9d2" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="42" cy="54" r="5" fill="#1d3d70" />
      <path d="M34 18c2 10 2 20 0 30" stroke="#f2f2f5" strokeWidth="4" />
    </g>
  ),
  soda: () => (
    <g>
      <rect x="43" y="6" width="14" height="8" rx="2" fill="#d63b4a" />
      <path d="M44 14h12c0 8 12 12 12 24v46c0 4-4 8-8 8H40c-4 0-8-4-8-8V38c0-12 12-16 12-24z" fill="#5a2e1a" opacity="0.9" />
      <rect x="32" y="46" width="36" height="22" fill="#d63b4a" />
      <path d="M38 57c6-4 18 4 24 0" stroke="#fff" strokeWidth="2.5" fill="none" />
    </g>
  ),
  boots: () => (
    <g>
      <path d="M26 14h26v40c10 2 30 8 34 18v8H16V62c0-6 4-10 10-12z" fill="#8a5a33" />
      <path d="M16 80h70v6c0 2-2 4-4 4H20c-2 0-4-2-4-4z" fill="#3a3028" />
      <path d="M28 24h20M28 32h20M28 40h20" stroke="#e8c37a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 14h26v6H26z" fill="#6b4426" />
    </g>
  ),
  skillet: () => (
    <g>
      <path d="M58 54l32 22c3 2 2 6-2 6l-36-18z" fill="#2f3138" />
      <circle cx="40" cy="48" r="30" fill="#3a3c44" />
      <circle cx="40" cy="48" r="24" fill="#4c4f58" />
      <ellipse cx="34" cy="42" rx="8" ry="4" fill="#6b6f7a" opacity="0.6" />
    </g>
  ),
  toaster: () => (
    <g>
      <path d="M32 22h12v16H32zM56 22h12v16H56z" fill="#e8b46a" />
      <path d="M34 20c0-4 8-4 8 0M58 20c0-4 8-4 8 0" fill="#d99a4a" />
      <rect x="16" y="34" width="68" height="50" rx="14" fill="#c4c9d2" />
      <rect x="28" y="34" width="20" height="5" rx="2" fill="#7a8290" />
      <rect x="52" y="34" width="20" height="5" rx="2" fill="#7a8290" />
      <rect x="78" y="50" width="10" height="5" rx="2" fill="#7a8290" />
      <Shine cx={30} cy={60} rx={4} ry={12} />
    </g>
  ),
  bowlingball: () => (
    <g>
      <circle cx="50" cy="52" r="36" fill="#6b3fa0" />
      <circle cx="42" cy="38" r="4.5" fill="#2b1a40" />
      <circle cx="54" cy="36" r="4.5" fill="#2b1a40" />
      <circle cx="50" cy="50" r="5" fill="#2b1a40" />
      <Shine cx={64} cy={64} rx={8} ry={5} />
    </g>
  ),
  kettlebell: () => (
    <g>
      <path d="M34 42V30a16 16 0 0 1 32 0v12" fill="none" stroke="#3a3c44" strokeWidth="9" />
      <circle cx="50" cy="62" r="28" fill="#3a3c44" />
      <rect x="40" y="56" width="20" height="12" rx="3" fill="#f2c84b" />
      <text x="50" y="65.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#3a3c44" fontFamily="Inter, sans-serif">6 lb</text>
    </g>
  ),
  pillow: () => (
    <g>
      <path d="M14 30c12-6 60-6 72 0 4 10 4 30 0 40-12 6-60 6-72 0-4-10-4-30 0-40z" fill="#eef1f7" stroke="#d4d9e4" strokeWidth="2" />
      <path d="M30 36c10-2 30-2 40 0M30 64c10 2 30 2 40 0" stroke="#d4d9e4" strokeWidth="2" fill="none" />
    </g>
  ),
  books: () => (
    <g>
      <rect x="18" y="66" width="64" height="16" rx="2" fill="#2f6b6a" />
      <rect x="22" y="50" width="58" height="16" rx="2" fill="#c95b5b" transform="rotate(-3 50 58)" />
      <rect x="20" y="34" width="60" height="16" rx="2" fill="#e8b44a" transform="rotate(2 50 42)" />
      <path d="M26 74h48M28 58h48M26 42h48" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
    </g>
  ),
  milk: () => (
    <g>
      <path d="M58 22h10c6 0 10 4 10 10v10c0 4-2 6-4 6" fill="none" stroke="#e8edf3" strokeWidth="6" />
      <path d="M38 10h18v10l12 8v56c0 4-2 6-6 6H30c-4 0-6-2-6-6V30l14-10z" fill="#f7f9fc" stroke="#d4d9e4" strokeWidth="2" />
      <rect x="38" y="6" width="18" height="8" rx="2" fill="#3b7fc4" />
      <rect x="24" y="50" width="44" height="18" fill="#3b7fc4" />
      <text x="46" y="63" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">MILK</text>
    </g>
  ),
};
