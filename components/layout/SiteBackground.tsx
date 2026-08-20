/**
 * Fixed cybersecurity vector backdrop for the whole app.
 * Pure decorative — no interaction, no layout impact.
 */
export function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Soft cool washes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,oklch(0.78_0.08_210_/_0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_95%_15%,oklch(0.82_0.07_185_/_0.28),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,oklch(0.88_0.04_220_/_0.4),transparent_55%)]" />

      {/* Drifting orbs */}
      <div className="site-orb site-orb-a absolute -left-24 top-24 h-72 w-72 rounded-full bg-[oklch(0.72_0.09_200_/_0.18)] blur-3xl" />
      <div className="site-orb site-orb-b absolute -right-16 top-[40%] h-80 w-80 rounded-full bg-[oklch(0.75_0.08_175_/_0.14)] blur-3xl" />
      <div className="site-orb site-orb-c absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-[oklch(0.8_0.05_230_/_0.16)] blur-3xl" />

      {/* Hex grid + circuit mesh */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.55]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="hex-grid"
            width="56"
            height="97"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.15)"
          >
            <path
              d="M28 2 L54 17 L54 47 L28 62 L2 47 L2 17 Z"
              fill="none"
              stroke="oklch(0.55 0.06 210 / 0.22)"
              strokeWidth="1"
            />
            <path
              d="M28 62 L54 77 L54 107 L28 122 L2 107 L2 77 Z"
              fill="none"
              stroke="oklch(0.55 0.06 210 / 0.14)"
              strokeWidth="1"
            />
          </pattern>

          <linearGradient id="circuit-fade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.5 0.1 200)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="oklch(0.55 0.08 185)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="oklch(0.5 0.06 220)" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#hex-grid)" />

        {/* Abstract security mesh — top-right */}
        <g
          className="site-mesh"
          fill="none"
          stroke="url(#circuit-fade)"
          strokeWidth="1.25"
          strokeLinecap="round"
        >
          <path d="M720 40 L820 90 L920 70 L1020 140 L1120 110" />
          <path d="M780 160 L860 120 L940 180 L1040 150" />
          <path d="M820 90 L820 200 L900 240" />
          <path d="M920 70 L960 40 L1020 40" />
          <circle cx="820" cy="90" r="3.5" fill="oklch(0.5 0.1 200 / 0.45)" stroke="none" />
          <circle cx="920" cy="70" r="3" fill="oklch(0.52 0.09 185 / 0.4)" stroke="none" />
          <circle cx="1020" cy="140" r="3.5" fill="oklch(0.48 0.08 210 / 0.45)" stroke="none" />
          <circle cx="860" cy="120" r="2.5" fill="oklch(0.55 0.07 195 / 0.35)" stroke="none" />
          <circle className="site-node-pulse" cx="900" cy="240" r="4" fill="oklch(0.5 0.11 200 / 0.5)" stroke="none" />
        </g>

        {/* Abstract security mesh — bottom-left */}
        <g
          className="site-mesh-alt"
          fill="none"
          stroke="oklch(0.5 0.07 210 / 0.2)"
          strokeWidth="1.1"
          strokeLinecap="round"
        >
          <path d="M40 620 L120 580 L200 640 L280 600 L360 680" />
          <path d="M120 580 L120 700 L220 740" />
          <path d="M200 640 L260 700" />
          <circle cx="120" cy="580" r="3" fill="oklch(0.5 0.08 200 / 0.35)" stroke="none" />
          <circle cx="200" cy="640" r="2.5" fill="oklch(0.52 0.07 185 / 0.3)" stroke="none" />
          <circle className="site-node-pulse" cx="280" cy="600" r="3.5" fill="oklch(0.48 0.09 210 / 0.4)" stroke="none" />
          <circle cx="220" cy="740" r="2.5" fill="oklch(0.5 0.06 220 / 0.3)" stroke="none" />
        </g>

        {/* Shield outline watermark */}
        <g
          className="site-shield"
          transform="translate(1080 520) scale(1.15)"
          fill="none"
          stroke="oklch(0.5 0.08 200 / 0.12)"
          strokeWidth="2"
        >
          <path d="M40 8 L72 20 L72 48 C72 68 56 84 40 92 C24 84 8 68 8 48 L8 20 Z" />
          <path d="M28 48 L36 56 L54 36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      {/* Fine scan-line texture */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-multiply bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,oklch(0.4_0.05_210)_3px,oklch(0.4_0.05_210)_4px)]" />
    </div>
  );
}
