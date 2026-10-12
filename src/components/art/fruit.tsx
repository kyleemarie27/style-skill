import type { ArtMap } from "./shared";
import { Shine } from "./shared";

/** Fruit & veg, drawn flat on a 100×100 canvas. Not to scale; the card shows the real size. */
export const FRUIT: ArtMap = {
  poppy: () => (
    <g>
      <path d="M30 52c0-14 12-24 24-22 14 2 20 14 16 26-4 13-18 18-28 14-8-3-12-10-12-18z" fill="#3d4a66" />
      <path d="M40 46c4-6 12-8 18-5" stroke="#6b7a9c" strokeWidth="3" fill="none" strokeLinecap="round" />
      {[[44, 56], [52, 50], [58, 58], [48, 64], [60, 46]].map(([x, y]) => <circle key={x + "" + y} cx={x} cy={y} r="1.6" fill="#2a3349" />)}
    </g>
  ),
  sesame: () => (
    <g>
      <path d="M50 18c14 10 22 28 18 44-3 12-12 20-18 20s-15-8-18-20c-4-16 4-34 18-44z" fill="#f1dfb8" />
      <path d="M50 26c-6 10-8 26-4 44" stroke="#d9c08e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Shine cx={58} cy={44} rx={4} ry={10} />
    </g>
  ),
  lentil: () => (
    <g>
      <ellipse cx="50" cy="54" rx="32" ry="22" fill="#b5652b" />
      <ellipse cx="50" cy="50" rx="30" ry="18" fill="#d9823f" />
      <Shine cx={40} cy={44} rx={10} ry={4} />
    </g>
  ),
  blueberry: () => (
    <g>
      <circle cx="50" cy="54" r="30" fill="#3f4f9e" />
      <path d="M42 32l8 6 8-6-2 8 6 4h-8l-4 6-4-6h-8l6-4z" fill="#283476" />
      <Shine cx={38} cy={48} rx={6} ry={9} />
    </g>
  ),
  raspberry: () => (
    <g>
      {[[38, 42], [50, 40], [62, 42], [33, 54], [45, 53], [57, 53], [67, 54], [38, 65], [50, 65], [62, 65], [44, 76], [56, 76]].map(([x, y]) => (
        <g key={x + "-" + y}>
          <circle cx={x} cy={y} r="8" fill="#d6345a" />
          <circle cx={x - 2} cy={y - 2} r="2.4" fill="#f27a96" />
        </g>
      ))}
      <path d="M50 34c-6-8-16-8-20-4 6 0 12 2 16 6zM50 34c6-8 16-8 20-4-6 0-12 2-16 6zM50 34c0-8 2-14 6-16" fill="#5d9b4a" stroke="#5d9b4a" strokeWidth="2" strokeLinejoin="round" />
    </g>
  ),
  cherry: () => (
    <g>
      <path d="M38 60c2-18 12-34 24-42M66 62c-2-14-2-30-4-44" stroke="#6b8f3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M62 18c8-6 18-4 22 2-8 4-16 4-22-2z" fill="#5d9b4a" />
      <circle cx="36" cy="68" r="16" fill="#c4213d" />
      <circle cx="66" cy="70" r="16" fill="#a8172f" />
      <Shine cx={30} cy={63} rx={4} ry={6} />
      <Shine cx={60} cy={65} rx={4} ry={6} />
    </g>
  ),
  strawberry: () => (
    <g>
      <path d="M50 88C30 74 20 54 26 40c4-8 14-10 24-8 10-2 20 0 24 8 6 14-4 34-24 48z" fill="#e0323f" />
      {[[38, 46], [50, 44], [62, 46], [42, 58], [56, 58], [48, 70], [36, 56], [64, 56], [52, 80]].map(([x, y]) => (
        <ellipse key={x + "-" + y} cx={x} cy={y} rx="1.6" ry="2.4" fill="#ffd66b" />
      ))}
      <path d="M50 34l-14-8 10 0-6-10 10 8 0-12 4 12 8-8-4 10 12-2-12 8z" fill="#4f9a3e" />
    </g>
  ),
  fig: () => (
    <g>
      <path d="M50 20c4 0 6 4 6 8 14 10 22 26 18 40-4 12-14 18-24 18s-20-6-24-18c-4-14 4-30 18-40 0-4 2-8 6-8z" fill="#6c3a6e" />
      <path d="M50 28c-10 14-12 34-6 52" stroke="#8c5590" strokeWidth="2" fill="none" />
      <path d="M50 20c0-6 2-10 6-12" stroke="#6b8f3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Shine cx={60} cy={54} rx={5} ry={10} />
    </g>
  ),
  lime: () => (
    <g>
      <ellipse cx="50" cy="54" rx="32" ry="26" fill="#5fae3c" />
      <ellipse cx="82" cy="54" rx="4" ry="5" fill="#4a8f2c" />
      <ellipse cx="18" cy="54" rx="3" ry="3" fill="#4a8f2c" />
      <Shine cx={40} cy={44} rx={12} ry={5} />
    </g>
  ),
  lemon: () => (
    <g>
      <path d="M12 54c4-4 8-6 12-6 6-14 20-22 30-22s22 6 28 20c4 0 8 4 8 8s-4 8-8 8c-6 14-18 20-28 20S30 74 24 60c-4 0-8-2-12-6z" fill="#f6d33c" />
      <Shine cx={42} cy={42} rx={12} ry={5} />
    </g>
  ),
  peach: () => (
    <g>
      <circle cx="50" cy="56" r="32" fill="#f5a35c" />
      <path d="M50 56a32 32 0 0 1 -26 -18a34 34 0 0 0 26 50z" fill="#f08a4b" opacity="0.6" />
      <path d="M50 26c-4 10-4 22 0 34" stroke="#e07a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M52 26c6-10 18-12 24-8-6 8-16 10-24 8z" fill="#5d9b4a" />
      <circle cx="66" cy="50" r="10" fill="#f7c27e" opacity="0.6" />
    </g>
  ),
  apple: () => (
    <g>
      <path d="M50 32c-8-6-26-6-30 12-4 18 8 42 20 42 4 0 6-2 10-2s6 2 10 2c12 0 24-24 20-42-4-18-22-18-30-12z" fill="#d93a3a" />
      <path d="M50 32c0-8 2-14 6-18" stroke="#7a4a2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M54 22c6-8 16-8 20-4-6 6-14 8-20 4z" fill="#5d9b4a" />
      <Shine cx={34} cy={48} rx={5} ry={10} />
    </g>
  ),
  avocado: () => (
    <g>
      <path d="M50 12c12 0 16 14 20 26 6 16 12 22 12 34 0 14-14 22-32 22S18 86 18 72c0-12 6-18 12-34 4-12 8-26 20-26z" fill="#3e6b2e" />
      <path d="M50 18c9 0 12 11 15 21 5 14 10 20 10 32 0 10-11 17-25 17S25 81 25 71c0-12 5-18 10-32 3-10 6-21 15-21z" fill="#c5dd7e" />
      <path d="M50 30c8 0 10 9 12 17 4 10 6 14 6 22 0 8-8 12-18 12" fill="#e1eda6" opacity="0.6" />
      <circle cx="50" cy="66" r="13" fill="#8a5a33" />
      <Shine cx={46} cy={61} rx={4} ry={3} />
    </g>
  ),
  pear: () => (
    <g>
      <path d="M50 22c8 0 10 8 10 16 0 6 16 14 16 32 0 14-12 20-26 20S24 84 24 70c0-18 16-26 16-32 0-8 2-16 10-16z" fill="#b9cc4a" />
      <path d="M50 22c0-6 0-10 4-14" stroke="#7a4a2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M56 14c6-4 14-2 16 2-6 4-12 4-16-2z" fill="#5d9b4a" />
      <Shine cx={38} cy={64} rx={5} ry={10} />
    </g>
  ),
  pepper: () => (
    <g>
      <path d="M50 30c-10-6-30-4-30 18 0 18 6 38 18 38 6 0 8-4 12-4s6 4 12 4c12 0 18-20 18-38 0-22-20-24-30-18z" fill="#d63b2f" />
      <path d="M50 34c-4 14-4 34 0 48" stroke="#b02a20" strokeWidth="3" fill="none" />
      <path d="M42 30c2-6 14-6 16 0z" fill="#3d7a2e" />
      <path d="M50 28c0-8 4-14 10-16" stroke="#3d7a2e" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Shine cx={32} cy={50} rx={4} ry={12} />
    </g>
  ),
  mango: () => (
    <g>
      <path d="M30 34c12-14 40-14 50 6 10 20 0 44-24 46-20 2-32-14-30-30 1-8-2-14 4-22z" fill="#f2a33a" />
      <path d="M30 34c12-14 40-14 50 6-14-8-36-8-50-6z" fill="#e85d3a" />
      <path d="M64 24c4-8 14-12 20-10-2 8-12 12-20 10z" fill="#4f9a3e" />
      <Shine cx={42} cy={58} rx={6} ry={12} />
    </g>
  ),
  banana: () => (
    <g>
      <path d="M18 30c4 30 26 52 60 50 4 0 6-4 4-6-28-2-48-20-54-46-2-4-10-4-10 2z" fill="#f5d33d" />
      <path d="M22 34c8 22 26 38 52 42" stroke="#d9b02a" strokeWidth="2.5" fill="none" />
      <path d="M18 30c-2-6 2-10 6-10l4 8z" fill="#7a5a2a" />
      <circle cx="80" cy="77" r="3" fill="#5a3d1e" />
    </g>
  ),
  carrot: () => (
    <g>
      <path d="M36 30c10-4 22 2 26 10L30 88c-2 2-4 0-4-2z" fill="#f08a2c" />
      <path d="M38 48l8 2M34 62l8 2M30 76l6 2" stroke="#c96a1c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 32c4-10 4-18 0-24M54 34c8-8 16-10 22-8M52 32c10-2 16 2 20 8" stroke="#4f9a3e" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),
  papaya: () => (
    <g>
      <ellipse cx="50" cy="52" rx="24" ry="38" fill="#7aa83e" />
      <ellipse cx="50" cy="52" rx="20" ry="34" fill="#f58a4a" />
      <ellipse cx="50" cy="56" rx="9" ry="18" fill="#e46a2e" />
      {[[48, 44], [52, 50], [47, 56], [53, 62], [49, 68], [51, 40]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="2.6" fill="#2b2230" />)}
    </g>
  ),
  grapefruit: () => (
    <g>
      <circle cx="50" cy="52" r="34" fill="#f2a04a" />
      <circle cx="50" cy="52" r="30" fill="#fbe1c4" />
      <circle cx="50" cy="52" r="26" fill="#ef6a5e" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <line key={i} x1="50" y1="52" x2={50 + Math.cos(a) * 26} y2={52 + Math.sin(a) * 26} stroke="#fbe1c4" strokeWidth="2" />;
      })}
      <circle cx="50" cy="52" r="3" fill="#fbe1c4" />
    </g>
  ),
  corn: () => (
    <g>
      <path d="M50 10c12 0 18 18 18 40s-6 38-18 38-18-16-18-38 6-40 18-40z" fill="#f5cf3d" />
      {Array.from({ length: 8 }, (_, r) =>
        [-8, 0, 8].map((dx) => <ellipse key={r + "-" + dx} cx={50 + dx} cy={20 + r * 8} rx="3.4" ry="3" fill="#e6b52a" />),
      )}
      <path d="M50 92c-16-4-26-24-22-50 4 18 10 30 22 36zM50 92c16-4 26-24 22-50-4 18-10 30-22 36z" fill="#6fae4a" />
    </g>
  ),
  cauliflower: () => (
    <g>
      <path d="M18 60c6 16 18 26 32 26s26-10 32-26c-10 6-20 8-32 8s-22-2-32-8z" fill="#5d9b4a" />
      {[[34, 46, 14], [50, 40, 15], [66, 46, 14], [42, 56, 13], [58, 56, 13], [28, 58, 10], [72, 58, 10]].map(([x, y, r]) => (
        <circle key={x + "-" + y} cx={x} cy={y} r={r} fill="#f4eedb" stroke="#e2d9bc" strokeWidth="1.5" />
      ))}
    </g>
  ),
  zucchini: () => (
    <g>
      <path d="M16 74c-4-6 0-12 8-14l52-36c8-4 14 2 10 10L36 84c-8 4-16 0-20-10z" fill="#3d7a2e" />
      <path d="M24 70l52-38" stroke="#6fae4a" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" />
      <path d="M84 30l6-6" stroke="#7a8a3a" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  cabbage: () => (
    <g>
      <circle cx="50" cy="54" r="34" fill="#8cc06a" />
      <path d="M50 20c-18 6-24 24-20 40M50 20c18 6 24 24 20 40" stroke="#6fa84e" strokeWidth="3" fill="none" />
      <circle cx="50" cy="52" r="18" fill="#b5d98f" />
      <path d="M50 34v36M40 40c4 8 4 18 0 26M60 40c-4 8-4 18 0 26" stroke="#8cc06a" strokeWidth="2" fill="none" />
    </g>
  ),
  eggplant: () => (
    <g>
      <path d="M62 26c14 6 18 22 12 36-6 16-20 26-34 26-12 0-20-8-18-18 2-12 14-14 22-24 6-8 6-22 18-20z" fill="#5b2f6e" />
      <path d="M56 22c4-6 14-8 18-2 4 6 0 12-6 12-4 2-10 0-12-4z" fill="#4f9a3e" />
      <path d="M68 22c2-6 6-10 10-10" stroke="#4f9a3e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Shine cx={42} cy={70} rx={8} ry={4} />
    </g>
  ),
  squash: () => (
    <g>
      <path d="M44 14c8 0 12 4 12 10v18c0 6 18 10 18 28 0 14-10 20-24 20S26 84 26 70c0-18 16-22 16-28V24c0-6-6-10 2-10z" fill="#e8b46a" />
      <circle cx="50" cy="70" r="12" fill="#e09a4a" opacity="0.6" />
      <path d="M48 14c0-4 2-6 4-6" stroke="#6b8f3a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Shine cx={38} cy={66} rx={4} ry={9} />
    </g>
  ),
  cucumber: () => (
    <g>
      <rect x="12" y="38" width="78" height="26" rx="13" fill="#3e8a3a" transform="rotate(-20 50 50)" />
      {[[26, 58], [38, 52], [50, 48], [62, 42], [74, 38], [32, 62], [56, 52], [68, 46]].map(([x, y]) => (
        <circle key={x + "-" + y} cx={x} cy={y} r="1.6" fill="#a8d488" />
      ))}
    </g>
  ),
  coconut: () => (
    <g>
      <circle cx="50" cy="54" r="34" fill="#7a5233" />
      <path d="M24 40c8 4 14 12 16 24M76 40c-8 4-14 12-16 24M50 20v14" stroke="#5c3b22" strokeWidth="2" fill="none" />
      <circle cx="42" cy="34" r="4" fill="#3d2615" />
      <circle cx="58" cy="34" r="4" fill="#3d2615" />
      <circle cx="50" cy="44" r="4" fill="#3d2615" />
    </g>
  ),
  spaghettisquash: () => (
    <g>
      <ellipse cx="50" cy="54" rx="38" ry="28" fill="#f5d36a" />
      {[-24, -12, 0, 12, 24].map((dx) => (
        <path key={dx} d={`M${50 + dx} 28c${dx / 3} 8 ${dx / 3} 44 0 52`} stroke="#e6b84a" strokeWidth="2.5" fill="none" />
      ))}
      <path d="M86 52l8-2" stroke="#7a8a3a" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  pineapple: () => (
    <g>
      <path d="M50 34c-6-10-16-16-22-14 6 4 12 10 16 16M50 34c6-10 16-16 22-14-6 4-12 10-16 16M50 34c-2-12 0-22 4-28 2 8 0 18-4 28" fill="#4f9a3e" stroke="#4f9a3e" strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="50" cy="64" rx="24" ry="28" fill="#f2b23a" />
      <clipPath id="pine-clip"><ellipse cx="50" cy="64" rx="24" ry="28" /></clipPath>
      <g clipPath="url(#pine-clip)" stroke="#c98a1c" strokeWidth="2">
        {[-30, -18, -6, 6, 18, 30].map((d) => <line key={"a" + d} x1={50 + d - 30} y1="36" x2={50 + d + 30} y2="92" />)}
        {[-30, -18, -6, 6, 18, 30].map((d) => <line key={"b" + d} x1={50 + d + 30} y1="36" x2={50 + d - 30} y2="92" />)}
      </g>
    </g>
  ),
  cantaloupe: () => (
    <g>
      <circle cx="50" cy="52" r="34" fill="#d8c08a" />
      <clipPath id="cant-clip"><circle cx="50" cy="52" r="34" /></clipPath>
      <g clipPath="url(#cant-clip)" stroke="#f1e2bb" strokeWidth="1.6" fill="none">
        {Array.from({ length: 9 }, (_, i) => <path key={"h" + i} d={`M10 ${22 + i * 8}c20 -6 60 6 80 0`} />)}
        {Array.from({ length: 9 }, (_, i) => <path key={"v" + i} d={`M${18 + i * 8} 14c-6 20 6 60 0 80`} />)}
      </g>
    </g>
  ),
  honeydew: () => (
    <g>
      <ellipse cx="50" cy="54" rx="36" ry="32" fill="#cfe3a2" />
      <ellipse cx="50" cy="54" rx="36" ry="32" fill="none" stroke="#b6cf86" strokeWidth="2" />
      <Shine cx={36} cy={40} rx={12} ry={6} />
    </g>
  ),
  romaine: () => (
    <g>
      <path d="M50 92c-6-20-24-40-22-64 2-12 10-18 14-14 2 4 6 6 8 4 2 2 6 0 8-4 4-4 12 2 14 14 2 24-16 44-22 64z" fill="#6fae4a" />
      <path d="M50 92c-2-24-14-44-10-66 4-6 8-2 10 2 2-4 6-8 10-2 4 22-8 42-10 66z" fill="#a8d488" />
      <path d="M50 90V30" stroke="#e8f4d4" strokeWidth="3" />
    </g>
  ),
  chard: () => (
    <g>
      {[[-14, -8], [0, 0], [14, 8]].map(([dx, rot]) => (
        <g key={dx} transform={`rotate(${rot} 50 90)`}>
          <path d={`M${50 + dx} 90c-14-20-18-46-6-66 6-8 18-8 22 2 8 22-4 44-16 64z`} fill="#3d7a2e" />
          <path d={`M${50 + dx} 90c0-24 2-44 8-62`} stroke="#d6345a" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  ),
  pumpkin: () => (
    <g>
      <ellipse cx="34" cy="58" rx="20" ry="26" fill="#e6782a" />
      <ellipse cx="66" cy="58" rx="20" ry="26" fill="#e6782a" />
      <ellipse cx="50" cy="58" rx="20" ry="28" fill="#f28c38" />
      <path d="M50 32c0-8 2-14 8-18" stroke="#6b5a2a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <Shine cx={44} cy={46} rx={4} ry={10} />
    </g>
  ),
  miniwatermelon: () => (
    <g>
      <circle cx="50" cy="54" r="32" fill="#3e8a3a" />
      <clipPath id="mw-clip"><circle cx="50" cy="54" r="32" /></clipPath>
      <g clipPath="url(#mw-clip)" stroke="#9ccf6a" strokeWidth="4" fill="none">
        {[-24, -12, 0, 12, 24].map((d) => <path key={d} d={`M${50 + d} 18c${d / 2} 16 ${d / 2} 56 0 72`} />)}
      </g>
      <circle cx="50" cy="22" r="3" fill="#6b8f3a" />
    </g>
  ),
  watermelon: () => (
    <g>
      <ellipse cx="50" cy="54" rx="42" ry="32" fill="#2f7a33" />
      <clipPath id="wm-clip"><ellipse cx="50" cy="54" rx="42" ry="32" /></clipPath>
      <g clipPath="url(#wm-clip)" stroke="#8cc65e" strokeWidth="5" fill="none">
        {[-30, -15, 0, 15, 30].map((d) => <path key={d} d={`M${50 + d} 18c${d / 2} 16 ${d / 2} 56 0 72`} />)}
      </g>
      <Shine cx={34} cy={38} rx={12} ry={5} />
    </g>
  ),
};
