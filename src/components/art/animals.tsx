import type { ArtMap } from "./shared";
import { Cheek, Eye, Shine } from "./shared";

/** Animals, small to large. Drawn simply and cute on a 100×100 canvas. Not to scale. */
export const ANIMALS: ArtMap = {
  antEgg: () => (
    <g>
      <ellipse cx="44" cy="54" rx="16" ry="24" fill="#f5f0e3" stroke="#e2d9c2" strokeWidth="2" />
      <ellipse cx="66" cy="62" rx="11" ry="17" fill="#f5f0e3" stroke="#e2d9c2" strokeWidth="2" opacity="0.8" />
      <Shine cx={40} cy={44} rx={4} ry={8} />
    </g>
  ),
  ant: () => (
    <g>
      <g stroke="#5a3a2a" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M44 56l-10 16M50 56l0 20M56 56l10 16M44 52l-12-8M56 52l12-8" />
        <path d="M28 40c-4-8-10-12-14-10M30 38c0-8-4-14-8-16" />
      </g>
      <circle cx="30" cy="46" r="10" fill="#7a4a32" />
      <ellipse cx="50" cy="52" rx="8" ry="7" fill="#7a4a32" />
      <ellipse cx="72" cy="56" rx="15" ry="12" fill="#7a4a32" />
      <Eye cx={27} cy={44} r={2.2} />
    </g>
  ),
  ladybug: () => (
    <g>
      <circle cx="50" cy="28" r="12" fill="#2b2230" />
      <circle cx="50" cy="58" r="30" fill="#e0323f" />
      <path d="M50 28v60" stroke="#2b2230" strokeWidth="2.5" />
      {[[38, 48], [62, 48], [34, 66], [66, 66], [44, 78], [56, 78]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="5" fill="#2b2230" />)}
      <circle cx="45" cy="25" r="2" fill="#fff" />
      <circle cx="55" cy="25" r="2" fill="#fff" />
    </g>
  ),
  bee: () => (
    <g>
      <ellipse cx="40" cy="32" rx="14" ry="10" fill="#dff0fb" stroke="#b5d6ec" strokeWidth="2" transform="rotate(-20 40 32)" />
      <ellipse cx="60" cy="32" rx="14" ry="10" fill="#dff0fb" stroke="#b5d6ec" strokeWidth="2" transform="rotate(20 60 32)" />
      <ellipse cx="50" cy="58" rx="28" ry="20" fill="#f6c83a" />
      <path d="M42 40c-4 12-4 24 0 36M58 40c4 12 4 24 0 36" stroke="#2b2230" strokeWidth="6" fill="none" />
      <path d="M78 58l8 0" stroke="#2b2230" strokeWidth="3" strokeLinecap="round" />
      <Eye cx={30} cy={54} r={3} />
    </g>
  ),
  joey: () => (
    <g>
      <path d="M30 60c-6-18 6-36 24-36 16 0 24 12 22 26-2 16-14 30-30 30-8 0-14-8-16-20z" fill="#f4b7b0" />
      <ellipse cx="60" cy="34" rx="5" ry="4" fill="#e99a92" />
      <path d="M40 58c-6 2-8 8-6 12M50 62c-2 6 0 10 4 12" stroke="#e99a92" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M56 40c2 2 6 2 8 0" stroke="#7a4a4a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Cheek cx={66} cy={46} />
    </g>
  ),
  tadpole: () => (
    <g>
      <path d="M52 52c10 0 20 6 28 2s10-12 14-10c-2 10-10 18-22 18-8 0-14-4-20-4z" fill="#4a5a6a" />
      <ellipse cx="38" cy="50" rx="22" ry="18" fill="#3d4d5c" />
      <Eye cx={30} cy={44} r={4} />
      <Shine cx={40} cy={40} rx={8} ry={4} />
    </g>
  ),
  frog: () => (
    <g>
      <ellipse cx="50" cy="66" rx="32" ry="22" fill="#5fbf4a" />
      <circle cx="32" cy="38" r="12" fill="#5fbf4a" />
      <circle cx="68" cy="38" r="12" fill="#5fbf4a" />
      <circle cx="32" cy="38" r="7" fill="#fff" />
      <circle cx="68" cy="38" r="7" fill="#fff" />
      <Eye cx={32} cy={39} r={4} />
      <Eye cx={68} cy={39} r={4} />
      <path d="M38 62c6 6 18 6 24 0" stroke="#2f7a2a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="76" rx="18" ry="9" fill="#c6eba6" />
      <Cheek cx={30} cy={58} />
      <Cheek cx={70} cy={58} />
    </g>
  ),
  turtle: () => (
    <g>
      <ellipse cx="22" cy="52" rx="10" ry="8" fill="#8cc06a" />
      <ellipse cx="34" cy="74" rx="7" ry="5" fill="#8cc06a" />
      <ellipse cx="66" cy="74" rx="7" ry="5" fill="#8cc06a" />
      <ellipse cx="34" cy="34" rx="7" ry="5" fill="#8cc06a" />
      <ellipse cx="66" cy="34" rx="7" ry="5" fill="#8cc06a" />
      <ellipse cx="54" cy="54" rx="26" ry="22" fill="#3e7a3a" />
      <path d="M54 34l10 10-4 14h-12l-4-14z" fill="#5a9a4a" />
      <path d="M34 50l10-6M74 50l-10-6M42 70l6-12M66 70l-6-12" stroke="#5a9a4a" strokeWidth="3" />
      <Eye cx={19} cy={50} r={2.2} />
    </g>
  ),
  hedgehog: () => (
    <g>
      <path d="M18 70c0-24 16-40 38-40s30 18 30 40z" fill="#8a6a4a" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI + (i / 8) * Math.PI;
        return <path key={i} d={`M${54 + Math.cos(a) * 26} ${70 + Math.sin(a) * 30}l${Math.cos(a) * 10} ${Math.sin(a) * 10}`} stroke="#6b4e34" strokeWidth="5" strokeLinecap="round" />;
      })}
      <path d="M14 70c0-10 6-18 16-18s14 8 14 18z" fill="#e8c9a6" />
      <circle cx="12" cy="66" r="3.5" fill="#2b2230" />
      <Eye cx={24} cy={60} r={2.6} />
      <Cheek cx={30} cy={66} />
    </g>
  ),
  hummingbird: () => (
    <g>
      <path d="M58 42c10-20 28-26 34-22-6 12-20 20-34 22z" fill="#9ad6c4" opacity="0.9" />
      <ellipse cx="50" cy="54" rx="22" ry="14" fill="#3fa37a" transform="rotate(-15 50 54)" />
      <path d="M68 62l20 14-24-6z" fill="#2f7a5a" />
      <circle cx="32" cy="46" r="11" fill="#3fa37a" />
      <path d="M36 54c6 4 14 4 18 2" stroke="#d63b6a" strokeWidth="6" strokeLinecap="round" />
      <path d="M22 46L4 44" stroke="#2b2230" strokeWidth="2.5" strokeLinecap="round" />
      <Eye cx={30} cy={44} r={2.4} />
    </g>
  ),
  chick: () => (
    <g>
      <circle cx="50" cy="58" r="28" fill="#f8d84a" />
      <circle cx="50" cy="34" r="18" fill="#f8d84a" />
      <path d="M46 38l4 6 4-6z" fill="#f08a2c" />
      <Eye cx={43} cy={32} r={2.8} />
      <Eye cx={57} cy={32} r={2.8} />
      <path d="M24 58c-6 0-10 6-8 12 6-2 10-6 12-10zM76 58c6 0 10 6 8 12-6-2-10-6-12-10z" fill="#f0c43a" />
      <path d="M42 86v6M58 86v6M38 92h8M54 92h8" stroke="#f08a2c" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 16c0-4 2-6 4-6" stroke="#f0c43a" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  bunny: () => (
    <g>
      <ellipse cx="38" cy="24" rx="7" ry="18" fill="#cfc6c0" />
      <ellipse cx="62" cy="24" rx="7" ry="18" fill="#cfc6c0" />
      <ellipse cx="38" cy="26" rx="3.5" ry="12" fill="#f4c3c8" />
      <ellipse cx="62" cy="26" rx="3.5" ry="12" fill="#f4c3c8" />
      <ellipse cx="50" cy="72" rx="26" ry="20" fill="#e2dbd6" />
      <circle cx="50" cy="50" r="20" fill="#e2dbd6" />
      <Eye cx={42} cy={48} r={2.8} />
      <Eye cx={58} cy={48} r={2.8} />
      <path d="M48 56h4l-2 3z" fill="#e88a9a" />
      <Cheek cx={38} cy={56} />
      <Cheek cx={62} cy={56} />
    </g>
  ),
  kitten: () => (
    <g>
      <path d="M24 40l6-26 18 16zM76 40l-6-26-18 16z" fill="#f2a04a" />
      <path d="M29 34l3-12 8 8zM71 34l-3-12-8 8z" fill="#f7c9a8" />
      <circle cx="50" cy="52" r="30" fill="#f2a04a" />
      <path d="M40 26c2 6 2 10 0 14M50 24v14M60 26c-2 6-2 10 0 14" stroke="#d9822a" strokeWidth="3" strokeLinecap="round" />
      <Eye cx={39} cy={52} r={3.6} />
      <Eye cx={61} cy={52} r={3.6} />
      <path d="M47 60h6l-3 3z" fill="#e8798a" />
      <path d="M50 63c-2 4-6 4-8 2M50 63c2 4 6 4 8 2" stroke="#8a5a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M22 60h12M22 66l12-2M78 60H66M78 66l-12-2" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
      <Cheek cx={34} cy={62} />
      <Cheek cx={66} cy={62} />
    </g>
  ),
  panda: () => (
    <g>
      <circle cx="26" cy="28" r="11" fill="#2b2230" />
      <circle cx="74" cy="28" r="11" fill="#2b2230" />
      <circle cx="50" cy="54" r="32" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" />
      <ellipse cx="38" cy="50" rx="8" ry="10" fill="#2b2230" transform="rotate(-20 38 50)" />
      <ellipse cx="62" cy="50" rx="8" ry="10" fill="#2b2230" transform="rotate(20 62 50)" />
      <circle cx="39" cy="49" r="2.6" fill="#fff" />
      <circle cx="61" cy="49" r="2.6" fill="#fff" />
      <ellipse cx="50" cy="64" rx="5" ry="3.5" fill="#2b2230" />
      <path d="M50 67c-2 4-6 4-8 2M50 67c2 4 6 4 8 2" stroke="#2b2230" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Cheek cx={32} cy={66} />
      <Cheek cx={68} cy={66} />
    </g>
  ),
  hamster: () => (
    <g>
      <circle cx="30" cy="30" r="9" fill="#e0a25a" />
      <circle cx="70" cy="30" r="9" fill="#e0a25a" />
      <circle cx="30" cy="30" r="5" fill="#f4c3c8" />
      <circle cx="70" cy="30" r="5" fill="#f4c3c8" />
      <ellipse cx="50" cy="58" rx="34" ry="30" fill="#e8b06a" />
      <ellipse cx="50" cy="68" rx="22" ry="18" fill="#fbecd6" />
      <Eye cx={38} cy={50} r={3.4} />
      <Eye cx={62} cy={50} r={3.4} />
      <ellipse cx="50" cy="58" rx="3" ry="2.2" fill="#e8798a" />
      <Cheek cx={32} cy={62} />
      <Cheek cx={68} cy={62} />
    </g>
  ),
  puppy: () => (
    <g>
      <ellipse cx="22" cy="48" rx="10" ry="20" fill="#7a4f2e" transform="rotate(15 22 48)" />
      <ellipse cx="78" cy="48" rx="10" ry="20" fill="#7a4f2e" transform="rotate(-15 78 48)" />
      <circle cx="50" cy="50" r="28" fill="#c58a52" />
      <ellipse cx="50" cy="64" rx="16" ry="12" fill="#f2dcc0" />
      <circle cx="62" cy="40" r="8" fill="#a8713e" />
      <Eye cx={40} cy={46} r={3.4} />
      <Eye cx={60} cy={46} r={3.4} />
      <ellipse cx="50" cy="58" rx="5" ry="3.6" fill="#2b2230" />
      <path d="M50 62v4M50 66c-3 3-6 3-8 1M50 66c3 3 6 3 8 1" stroke="#2b2230" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M48 70c0 6 4 6 4 0z" fill="#e8798a" />
    </g>
  ),
  guineapig: () => (
    <g>
      <ellipse cx="52" cy="60" rx="38" ry="24" fill="#f7efe6" />
      <path d="M52 36c20 0 38 10 38 24s-10 22-20 24c4-16-2-36-18-48z" fill="#c9823a" />
      <path d="M14 60c0-14 8-22 20-24 6 10 6 26 0 36-12-2-20-6-20-12z" fill="#3d2f28" />
      <circle cx="30" cy="38" r="6" fill="#e9b0a6" />
      <Eye cx={24} cy={52} r={3} />
      <ellipse cx="14" cy="62" rx="3" ry="2.4" fill="#e8798a" />
      <path d="M36 82v6M64 82v6" stroke="#e9b0a6" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  squirrel: () => (
    <g>
      <path d="M62 82c22-4 30-26 22-46-6-16-24-20-30-10 12-2 20 8 18 20-2 14-14 18-14 36z" fill="#c26b2e" />
      <ellipse cx="42" cy="66" rx="18" ry="20" fill="#d97f3a" />
      <ellipse cx="40" cy="70" rx="10" ry="12" fill="#f7dcc0" />
      <circle cx="38" cy="40" r="15" fill="#d97f3a" />
      <path d="M30 28l2-10 8 8zM44 26l4-10 4 10z" fill="#d97f3a" />
      <Eye cx={34} cy={38} r={3} />
      <circle cx="25" cy="44" r="2.6" fill="#2b2230" />
      <ellipse cx="38" cy="56" rx="6" ry="4" fill="#8a5a33" />
    </g>
  ),
  pigeon: () => (
    <g>
      <path d="M78 52l16 10-18 4z" fill="#5f6b7a" />
      <ellipse cx="56" cy="58" rx="28" ry="20" fill="#8a96a6" />
      <path d="M42 50c10-4 26-4 36 6-10 10-26 10-36 4z" fill="#6f7b8c" />
      <circle cx="34" cy="38" r="13" fill="#7e8a9a" />
      <path d="M30 48c4 6 10 8 16 6" stroke="#6fae8a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M22 38l-8 3 8 2z" fill="#e8a24a" />
      <Eye cx={32} cy={35} r={2.6} />
      <path d="M50 78v10M62 78v10" stroke="#e8798a" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  chinchilla: () => (
    <g>
      <circle cx="28" cy="28" r="14" fill="#a9adb6" />
      <circle cx="72" cy="28" r="14" fill="#a9adb6" />
      <circle cx="28" cy="28" r="8" fill="#e6c2c6" />
      <circle cx="72" cy="28" r="8" fill="#e6c2c6" />
      <ellipse cx="50" cy="62" rx="32" ry="28" fill="#bfc3cc" />
      <ellipse cx="50" cy="72" rx="18" ry="14" fill="#eceef2" />
      <Eye cx={38} cy={54} r={4} />
      <Eye cx={62} cy={54} r={4} />
      <ellipse cx="50" cy="62" rx="3" ry="2" fill="#e8798a" />
      <path d="M36 64h-14M64 64h14" stroke="#fff" strokeWidth="1.5" />
    </g>
  ),
  rabbit: () => (
    <g>
      <ellipse cx="38" cy="26" rx="7" ry="14" fill="#9c7350" transform="rotate(-12 38 26)" />
      <ellipse cx="62" cy="26" rx="7" ry="14" fill="#9c7350" transform="rotate(12 62 26)" />
      <ellipse cx="52" cy="70" rx="32" ry="20" fill="#b08660" />
      <circle cx="84" cy="64" r="6" fill="#f2ece4" />
      <circle cx="48" cy="48" r="20" fill="#b08660" />
      <Eye cx={40} cy={46} r={3} />
      <Eye cx={56} cy={46} r={3} />
      <path d="M46 54h4l-2 3z" fill="#e8798a" />
      <Cheek cx={36} cy={54} />
    </g>
  ),
  owl: () => (
    <g>
      <ellipse cx="50" cy="56" rx="32" ry="34" fill="#d9a86a" />
      <path d="M50 24c-12-6-28 2-28 18 0 14 14 24 28 24s28-10 28-24c0-16-16-24-28-18z" fill="#fbf3e6" />
      <Eye cx={40} cy={44} r={4} />
      <Eye cx={60} cy={44} r={4} />
      <path d="M47 52l3 7 3-7z" fill="#c9823a" />
      <ellipse cx="50" cy="76" rx="16" ry="12" fill="#f4dfbf" />
      {[[44, 72], [56, 72], [50, 80]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="1.6" fill="#a8713e" />)}
    </g>
  ),
  meerkat: () => (
    <g>
      <path d="M40 30c0-10 6-16 12-16s12 6 12 16v54c0 6-6 8-12 8s-12-2-12-8z" fill="#d6b48a" />
      <ellipse cx="52" cy="62" rx="9" ry="18" fill="#f1dfc4" />
      <ellipse cx="45" cy="30" rx="4" ry="5" fill="#5a4030" />
      <ellipse cx="59" cy="30" rx="4" ry="5" fill="#5a4030" />
      <Eye cx={45} cy={30} r={2.4} />
      <Eye cx={59} cy={30} r={2.4} />
      <ellipse cx="52" cy="38" rx="3" ry="2.2" fill="#2b2230" />
      <path d="M42 54c-4 4-6 8-4 10M62 54c4 4 6 8 4 10" stroke="#c49a6a" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  ),
  ferret: () => (
    <g>
      <path d="M78 66c10 2 14 10 10 14-6-2-10-8-10-14z" fill="#7a5a40" />
      <rect x="22" y="52" width="62" height="24" rx="12" fill="#c9a37a" />
      <circle cx="24" cy="54" r="16" fill="#f2e2cc" />
      <path d="M12 52c4-6 20-6 24 0-4 4-20 4-24 0z" fill="#6b4c36" />
      <circle cx="14" cy="42" r="5" fill="#c9a37a" />
      <circle cx="32" cy="42" r="5" fill="#c9a37a" />
      <Eye cx={18} cy={52} r={2.4} />
      <Eye cx={30} cy={52} r={2.4} />
      <ellipse cx="24" cy="60" rx="2.6" ry="2" fill="#e8798a" />
      <path d="M36 74v8M74 74v8" stroke="#7a5a40" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  penguin: () => (
    <g>
      <ellipse cx="50" cy="56" rx="26" ry="34" fill="#3d6c96" />
      <ellipse cx="50" cy="62" rx="18" ry="26" fill="#f5f7fa" />
      <path d="M24 52c-8 8-10 18-6 22 4-4 8-10 8-18zM76 52c8 8 10 18 6 22-4-4-8-10-8-18z" fill="#2f5a80" />
      <Eye cx={42} cy={38} r={3} />
      <Eye cx={58} cy={38} r={3} />
      <path d="M46 44l4 6 4-6z" fill="#3a3c44" />
      <path d="M40 88h8M52 88h8" stroke="#e8a24a" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  piglet: () => (
    <g>
      <path d="M26 30l6-14 12 12zM74 30l-6-14-12 12z" fill="#f2a5b0" />
      <circle cx="50" cy="52" r="30" fill="#f7bcc4" />
      <ellipse cx="50" cy="62" rx="13" ry="9" fill="#ef98a6" />
      <ellipse cx="45" cy="62" rx="2.6" ry="3.4" fill="#c9667a" />
      <ellipse cx="55" cy="62" rx="2.6" ry="3.4" fill="#c9667a" />
      <Eye cx={38} cy={46} r={3.2} />
      <Eye cx={62} cy={46} r={3.2} />
      <Cheek cx={30} cy={58} />
      <Cheek cx={70} cy={58} />
    </g>
  ),
  redpanda: () => (
    <g>
      <path d="M22 36l4-18 16 10zM78 36l-4-18-16 10z" fill="#b5491f" />
      <path d="M27 31l2-9 7 5zM73 31l-2-9-7 5z" fill="#fbeee0" />
      <circle cx="50" cy="52" r="30" fill="#d0612c" />
      <path d="M26 46c4-8 14-8 18 0 0 8-6 14-12 16-6-4-8-10-6-16zM74 46c-4-8-14-8-18 0 0 8 6 14 12 16 6-4 8-10 6-16z" fill="#fbeee0" />
      <ellipse cx="50" cy="66" rx="12" ry="9" fill="#fbeee0" />
      <Eye cx={37} cy={50} r={3.2} />
      <Eye cx={63} cy={50} r={3.2} />
      <ellipse cx="50" cy="62" rx="4" ry="3" fill="#2b2230" />
      <path d="M42 30c4 2 6 6 8 10M58 30c-4 2-6 6-8 10" stroke="#fbeee0" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  chihuahua: () => (
    <g>
      <path d="M26 46L12 12l26 18zM74 46l14-34-26 18z" fill="#e3b77e" />
      <path d="M24 38l-6-16 12 10zM76 38l6-16-12 10z" fill="#f4c9b8" />
      <circle cx="50" cy="56" r="26" fill="#e3b77e" />
      <ellipse cx="50" cy="68" rx="12" ry="9" fill="#f6e2c4" />
      <circle cx="38" cy="52" r="5" fill="#2b2230" />
      <circle cx="62" cy="52" r="5" fill="#2b2230" />
      <circle cx="39.5" cy="50.5" r="1.8" fill="#fff" />
      <circle cx="63.5" cy="50.5" r="1.8" fill="#fff" />
      <ellipse cx="50" cy="64" rx="3.6" ry="2.6" fill="#2b2230" />
    </g>
  ),
  otter: () => (
    <g>
      <path d="M10 70c10-4 20 4 30 0s20-4 30 0 20 4 26 0" stroke="#7ec4e8" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="54" cy="56" rx="32" ry="14" fill="#8a5f3e" />
      <ellipse cx="56" cy="54" rx="18" ry="8" fill="#c9a07a" />
      <circle cx="22" cy="46" r="15" fill="#c9a07a" />
      <circle cx="12" cy="36" r="4" fill="#8a5f3e" />
      <circle cx="30" cy="34" r="4" fill="#8a5f3e" />
      <Eye cx={17} cy={44} r={2.4} />
      <Eye cx={27} cy={44} r={2.4} />
      <ellipse cx="22" cy="51" rx="3.4" ry="2.4" fill="#2b2230" />
      <path d="M50 46c4-4 10-4 14 0" stroke="#8a5f3e" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>
  ),
  fox: () => (
    <g>
      <path d="M22 44L16 12l24 16zM78 44l6-32-24 16z" fill="#e8742e" />
      <path d="M24 34l-3-14 10 8zM76 34l3-14-10 8z" fill="#3d2f28" />
      <path d="M50 88L18 48c0-14 14-22 32-22s32 8 32 22z" fill="#e8742e" />
      <path d="M50 88L28 58c8-2 16 2 22 10 6-8 14-12 22-10z" fill="#fbf3e6" />
      <Eye cx={38} cy={50} r={3.2} />
      <Eye cx={62} cy={50} r={3.2} />
      <circle cx="50" cy="84" r="4" fill="#2b2230" />
    </g>
  ),
  goat: () => (
    <g>
      <ellipse cx="18" cy="42" rx="14" ry="6" fill="#e6ddd2" transform="rotate(-20 18 42)" />
      <ellipse cx="82" cy="42" rx="14" ry="6" fill="#e6ddd2" transform="rotate(20 82 42)" />
      <path d="M40 22c-2-6 0-10 4-12M60 22c2-6 0-10-4-12" stroke="#bfb4a6" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M50 22c16 0 22 12 20 30-2 20-10 32-20 32s-18-12-20-32c-2-18 4-30 20-30z" fill="#f7f2ec" />
      <Eye cx={40} cy={44} r={3} />
      <Eye cx={60} cy={44} r={3} />
      <ellipse cx="50" cy="70" rx="10" ry="8" fill="#f2d7d0" />
      <ellipse cx="46" cy="70" rx="1.8" ry="2.4" fill="#8a5a5a" />
      <ellipse cx="54" cy="70" rx="1.8" ry="2.4" fill="#8a5a5a" />
      <path d="M48 84l2 8 2-8z" fill="#e6ddd2" />
    </g>
  ),
  koala: () => (
    <g>
      <circle cx="22" cy="36" r="17" fill="#9aa0aa" />
      <circle cx="78" cy="36" r="17" fill="#9aa0aa" />
      <circle cx="22" cy="36" r="10" fill="#eceef2" />
      <circle cx="78" cy="36" r="10" fill="#eceef2" />
      <circle cx="50" cy="54" r="28" fill="#aab0ba" />
      <ellipse cx="50" cy="58" rx="8" ry="11" fill="#3d3f46" />
      <Eye cx={37} cy={48} r={3} />
      <Eye cx={63} cy={48} r={3} />
      <ellipse cx="50" cy="76" rx="14" ry="6" fill="#d8dce2" />
    </g>
  ),
  cat: () => (
    <g>
      <path d="M78 84c12-2 16-14 10-24" stroke="#8b929e" strokeWidth="7" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="72" rx="26" ry="20" fill="#9aa1ad" />
      <path d="M30 34l4-20 14 12zM70 34l-4-20-14 12z" fill="#9aa1ad" />
      <circle cx="50" cy="42" r="22" fill="#9aa1ad" />
      <ellipse cx="41" cy="42" rx="4" ry="5" fill="#a8d46a" />
      <ellipse cx="59" cy="42" rx="4" ry="5" fill="#a8d46a" />
      <ellipse cx="41" cy="42" rx="1.4" ry="4" fill="#2b2230" />
      <ellipse cx="59" cy="42" rx="1.4" ry="4" fill="#2b2230" />
      <path d="M47 50h6l-3 3z" fill="#e8798a" />
      <path d="M26 50h12M26 55l12-2M74 50H62M74 55l-12-2" stroke="#e8ebef" strokeWidth="1.4" />
      <ellipse cx="50" cy="78" rx="12" ry="10" fill="#c7ccd4" />
    </g>
  ),
  fawn: () => (
    <g>
      <path d="M30 60v28M40 62v26M64 62v26M72 60v28" stroke="#a8713e" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="52" cy="58" rx="26" ry="14" fill="#c58a52" />
      {[[44, 52], [54, 50], [62, 54], [48, 60], [58, 60], [38, 56]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="2.4" fill="#fbf3e6" />)}
      <path d="M26 50c-6-8-6-18 0-26" stroke="#c58a52" strokeWidth="9" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="24" rx="12" ry="9" fill="#c58a52" />
      <ellipse cx="18" cy="12" rx="4" ry="8" fill="#b07a46" transform="rotate(-30 18 12)" />
      <ellipse cx="30" cy="14" rx="4" ry="8" fill="#b07a46" transform="rotate(30 30 14)" />
      <Eye cx={20} cy={22} r={2.6} />
      <circle cx="11" cy="27" r="2.6" fill="#2b2230" />
    </g>
  ),
  lamb: () => (
    <g>
      <path d="M34 72v18M46 74v16M58 74v16M70 72v18" stroke="#4a3f3a" strokeWidth="5" strokeLinecap="round" />
      {[[36, 52], [50, 46], [64, 50], [74, 60], [62, 70], [46, 72], [32, 64], [52, 60]].map(([x, y]) => (
        <circle key={x + "-" + y} cx={x} cy={y} r="13" fill="#fbf8f2" stroke="#ece5d8" strokeWidth="1.5" />
      ))}
      <ellipse cx="22" cy="44" rx="11" ry="13" fill="#4a3f3a" />
      <ellipse cx="12" cy="40" rx="7" ry="4" fill="#4a3f3a" transform="rotate(-20 12 40)" />
      <ellipse cx="30" cy="36" rx="7" ry="4" fill="#4a3f3a" transform="rotate(20 30 36)" />
      <circle cx="22" cy="34" r="7" fill="#fbf8f2" />
      <circle cx="18" cy="44" r="2" fill="#fff" />
      <circle cx="26" cy="44" r="2" fill="#fff" />
    </g>
  ),
  dachshund: () => (
    <g>
      <path d="M86 50c6-6 8-14 4-18" stroke="#8a4b2a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="26" y="46" width="62" height="24" rx="12" fill="#a65a2e" />
      <path d="M34 68v14M44 68v14M72 68v14M80 68v14" stroke="#8a4b2a" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="24" cy="44" rx="15" ry="13" fill="#a65a2e" />
      <path d="M10 46c-4 0-6-4-4-6l10-2z" fill="#a65a2e" />
      <ellipse cx="6" cy="44" rx="3" ry="2.6" fill="#2b2230" />
      <ellipse cx="30" cy="48" rx="6" ry="12" fill="#7a3f1e" />
      <Eye cx={20} cy={40} r={2.6} />
    </g>
  ),
};
