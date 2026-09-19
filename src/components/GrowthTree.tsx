import { useEffect, useId, useRef, useState } from "react";
import type { GrowthStage } from "../lib/growth";

const BASE_WIDTH = 56;
const BASE_HEIGHT = 102;

type Pt = [number, number];
/** Where things happen, per stage, so nothing floats in empty sky:
 * perch = where the bird's feet touch; tip = a canopy edge a needle lets go
 * from; wind = heights of the two streaks (at the tree's own height);
 * fly = the butterfly's home, in free air beside the canopy. */
const SCENE: Record<GrowthStage, { perch?: Pt; tip?: Pt; wind: [number, number]; fly?: Pt }> = {
  1: { wind: [212, 232] },
  2: { wind: [205, 230] },
  3: { tip: [72, 218], wind: [195, 225] },
  4: { perch: [50, 166], tip: [76, 215], wind: [180, 210] },
  5: { perch: [50, 146], tip: [80, 218], wind: [160, 205] },
  6: { perch: [50, 126], tip: [78, 198], wind: [140, 190], fly: [86, 150] },
  7: { perch: [50, 106], tip: [78, 180], wind: [120, 175], fly: [88, 130] },
  8: { perch: [50, 86], tip: [80, 162], wind: [100, 160], fly: [90, 112] },
  9: { perch: [50, 86], wind: [100, 160] },
  10: { perch: [27, 140], tip: [80, 162], wind: [100, 160], fly: [90, 112] },
};

export function GrowthTree({ stage, scale = 1 }: { stage: GrowthStage; scale?: number }) {
  const prevStage = useRef(stage);
  // Stable per-tree phase/tempo so several trees never move in sync.
  const seed = [...useId()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const delay = (n: number) => ({ animationDelay: `-${(seed * (n + 3)) % 8000}ms` });
  const sway = { animationDelay: `-${seed % 5000}ms`, animationDuration: `${4500 + (seed % 1500)}ms` };
  const scene = SCENE[stage];
  const [justGrew, setJustGrew] = useState(false);

  useEffect(() => {
    if (stage > prevStage.current) {
      setJustGrew(true);
      const id = setTimeout(() => setJustGrew(false), 550);
      prevStage.current = stage;
      return () => clearTimeout(id);
    }
    prevStage.current = stage;
  }, [stage]);

  return (
    <svg
      viewBox="-5 55 110 200"
      width={BASE_WIDTH * scale}
      height={BASE_HEIGHT * scale}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`growth stage ${stage}`}
      className={`shrink-0 transition-opacity duration-500 ${justGrew ? "tree-grow" : ""}`}
    >
      <defs>
        {/* Stage 1: Seed in Mound */}
        <g id="stage-1">
          <ellipse cx="50" cy="245" rx="36" ry="12" fill="#4a2810" />
          <ellipse cx="50" cy="244" rx="28" ry="8" fill="#6b3a19" />
          <rect x="47" y="234" width="6" height="6" rx="2" fill="#68a336" />
          <rect x="49" y="232" width="2" height="3" fill="#a4de02" />
        </g>

        {/* Stage 2: Small Sprout */}
        <g id="stage-2">
          <ellipse cx="50" cy="245" rx="34" ry="11" fill="#4a2810" />
          <ellipse cx="50" cy="244" rx="26" ry="7" fill="#6b3a19" />
          <rect x="48" y="226" width="4" height="14" fill="#4c7c24" />
          <polygon points="48,226 36,218 42,228 48,230" fill="#68a336" />
          <polygon points="52,226 64,218 58,228 52,230" fill="#7bc638" />
        </g>

        {/* Stage 3: Seedling */}
        <g id="stage-3">
          <ellipse cx="50" cy="246" rx="30" ry="10" fill="#4a2810" />
          <ellipse cx="50" cy="245" rx="22" ry="6" fill="#6b3a19" />
          <rect x="48" y="206" width="4" height="36" fill="#5c3818" />
          <polygon points="48,212 30,204 40,216" fill="#3e6b1d" />
          <polygon points="52,212 70,204 60,216" fill="#548f28" />
          <polygon points="48,224 28,218 38,228" fill="#3e6b1d" />
          <polygon points="52,224 72,218 62,228" fill="#548f28" />
          <polygon points="48,206 50,192 52,206" fill="#7bc638" />
        </g>

        {/* Stage 4: Little Pine */}
        <g id="stage-4">
          <rect x="47" y="190" width="6" height="55" fill="#4a2810" />
          <polygon points="50,165 30,195 70,195" fill="#2d5a27" />
          <polygon points="50,185 24,215 76,215" fill="#23471f" />
          <polygon points="50,205 18,232 82,232" fill="#1b3818" />
          <ellipse cx="50" cy="246" rx="24" ry="6" fill="#4a2810" />
        </g>

        {/* Stage 5: Young Pine */}
        <g id="stage-5">
          <rect x="46" y="180" width="8" height="65" fill="#4a2810" />
          <polygon points="50,145 32,175 68,175" fill="#3e7a33" />
          <polygon points="50,165 26,196 74,196" fill="#2d5a27" />
          <polygon points="50,185 20,218 80,218" fill="#23471f" />
          <polygon points="50,205 14,236 86,236" fill="#1b3818" />
          <ellipse cx="50" cy="246" rx="22" ry="5" fill="#301b0b" />
        </g>

        {/* Stage 6: Medium Pine */}
        <g id="stage-6">
          <rect x="45" y="160" width="10" height="85" fill="#4a2810" />
          <polygon points="50,125 34,155 66,155" fill="#4a8f3d" />
          <polygon points="50,145 28,176 72,176" fill="#3e7a33" />
          <polygon points="50,166 22,198 78,198" fill="#2d5a27" />
          <polygon points="50,188 16,220 84,220" fill="#23471f" />
          <polygon points="50,210 10,240 90,240" fill="#1b3818" />
          <circle cx="42" cy="180" r="3" fill="#6b3a19" />
          <circle cx="60" cy="202" r="3.5" fill="#6b3a19" />
        </g>

        {/* Stage 7: Maturing Pine */}
        <g id="stage-7">
          <rect x="44" y="145" width="12" height="100" fill="#3d200a" />
          <polygon points="50,105 34,136 66,136" fill="#529c44" />
          <polygon points="50,126 28,158 72,158" fill="#438437" />
          <polygon points="50,148 22,180 78,180" fill="#356c2c" />
          <polygon points="50,170 16,202 84,202" fill="#275421" />
          <polygon points="50,192 10,225 90,225" fill="#1c3e17" />
          <polygon points="50,214 4,244 96,244" fill="#142e11" />
          <circle cx="38" cy="162" r="3.5" fill="#5c2d12" />
          <circle cx="64" cy="184" r="4" fill="#5c2d12" />
          <circle cx="36" cy="208" r="4" fill="#5c2d12" />
        </g>

        {/* Stage 8: Full Grown Pine */}
        <g id="stage-8">
          <polygon points="42,246 44,135 56,135 58,246" fill="#3d200a" />
          <polygon points="50,85 34,118 66,118" fill="#529c44" />
          <polygon points="50,108 27,140 73,140" fill="#438437" />
          <polygon points="50,130 20,162 80,162" fill="#356c2c" />
          <polygon points="50,152 14,185 86,185" fill="#275421" />
          <polygon points="50,174 8,208 92,208" fill="#1c3e17" />
          <polygon points="50,196 2,230 98,230" fill="#142e11" />
          <polygon points="50,218 -2,245 102,245" fill="#0d210b" />
          <circle cx="40" cy="142" r="3.5" fill="#5c2d12" />
          <circle cx="62" cy="164" r="4" fill="#5c2d12" />
          <circle cx="35" cy="188" r="4" fill="#5c2d12" />
          <circle cx="66" cy="212" r="4.5" fill="#5c2d12" />
        </g>

        {/* Stage 9: Snowy Winter Pine */}
        <g id="stage-9">
          <use href="#stage-8" />
          <polygon points="50,85 40,102 60,102" fill="#f0f6fc" />
          <polygon points="50,108 32,124 68,124" fill="#e2edf8" />
          <polygon points="50,130 24,146 76,146" fill="#d4e4f4" />
          <polygon points="50,152 18,168 82,168" fill="#c6dbf0" />
          <polygon points="50,174 12,190 88,190" fill="#e2edf8" />
          <polygon points="50,196 6,212 94,212" fill="#d4e4f4" />
        </g>

        {/* Stage 10: Legendary Star Pine */}
        <g id="stage-10">
          <use href="#stage-8" />
          <polygon
            points="50,60 53,70 63,70 55,76 58,86 50,80 42,86 45,76 37,70 47,70"
            fill="#ffcc00"
            stroke="#ff9900"
            strokeWidth="1.5"
          />
          <circle className="twinkle" style={{ animationDelay: "-700ms" }} cx="34" cy="90" r="2" fill="#ffe066" opacity="0.8" />
          <circle className="twinkle" style={{ animationDelay: "-1400ms" }} cx="68" cy="85" r="2.5" fill="#ffe066" opacity="0.9" />
          <circle className="twinkle" style={{ animationDelay: "-2100ms" }} cx="28" cy="120" r="1.5" fill="#ffe066" opacity="0.7" />
          <circle className="twinkle" style={{ animationDelay: "-2800ms" }} cx="74" cy="115" r="2" fill="#ffe066" opacity="0.8" />
        </g>
      </defs>

      {/* Wind: two faint streaks at the tree's own height, blowing left to right. */}
      <g fill="none" stroke="#f2f0ea" strokeWidth="1.2" strokeLinecap="round" shapeRendering="geometricPrecision">
        <path className="wind" style={delay(0)} d={`M2 ${scene.wind[0]} q10 -7 20 0 t20 0`} />
        <path
          className="wind"
          style={{ ...delay(1), animationDuration: "7.5s" }}
          d={`M8 ${scene.wind[1]} q9 -6 18 0 t18 0`}
        />
      </g>

      {/* Ladybug on the soil while the plant is still small. */}
      {stage <= 3 && (
        <g transform="translate(50 240)">
          <g className="crawl" style={delay(4)}>
            <rect x="-3" y="-3" width="6" height="4" rx="1.5" fill="#e0523a" />
            <rect x="-0.5" y="-3" width="1" height="4" fill="#1c1000" />
            <rect x="2" y="-2.5" width="2" height="2.5" fill="#1c1000" />
            <rect x="-1.5" y="-2" width="1" height="1" fill="#1c1000" />
            <rect x="0.7" y="-1" width="1" height="1" fill="#1c1000" />
          </g>
        </g>
      )}

      <g className="tree-sway" style={sway}>
        <use href={`#stage-${stage}`} />
        {/* A small bird perched on the tree top (on a tier tip for the star pine). */}
        {scene.perch && (
          <g transform={`translate(${scene.perch[0]} ${scene.perch[1]})`}>
            <g className="hop" style={delay(5)}>
              <rect x="4" y="-4" width="3" height="2" fill="#b5533b" />
              <rect x="-4" y="-5" width="8" height="5" fill="#e0725a" />
              <rect x="-6" y="-7" width="4" height="4" fill="#e0725a" />
              <rect x="-2" y="-4" width="4" height="2.5" fill="#b5533b" />
              <rect x="-8" y="-6" width="2" height="1.5" fill="#ffcc00" />
              <rect x="-5" y="-6" width="1" height="1" fill="#1c1000" />
              <rect x="-2" y="0" width="1" height="1.5" fill="#ffcc00" />
              <rect x="1" y="0" width="1" height="1.5" fill="#ffcc00" />
            </g>
          </g>
        )}
      </g>

      {/* A butterfly circling the fuller trees. */}
      {scene.fly && (
        <g transform={`translate(${scene.fly[0]} ${scene.fly[1]})`} shapeRendering="geometricPrecision" aria-hidden="true">
          <g className="flutter" style={delay(6)}>
            <ellipse className="flap" cx="-2" cy="0" rx="2.2" ry="2.8" fill="#f2a0c0" />
            <ellipse className="flap" cx="2" cy="0" rx="2.2" ry="2.8" fill="#f2a0c0" />
            <rect x="-0.4" y="-2" width="0.8" height="4.5" rx="0.4" fill="#1c1000" />
          </g>
        </g>
      )}

      {/* A needle lets go of the canopy edge and spirals down (snow falls from the sky on the winter pine). */}
      <g shapeRendering="geometricPrecision" aria-hidden="true">
        {scene.tip && (
          <g transform={`translate(${scene.tip[0]} ${scene.tip[1]})`}>
            <path className="drift" style={delay(2)} d="M0 0 l4 -2 l3 2 l-4 2z" fill="#4a8f3d" />
          </g>
        )}
        {stage === 9 &&
          [18, 52, 84].map((x, i) => (
            <g key={x} transform={`translate(${x} 58)`}>
              <circle className="fall" style={{ ...delay(i * 1.3), animationDuration: `${8 + i}s` }} r="1.3" fill="#f0f6fc" />
            </g>
          ))}
      </g>
    </svg>
  );
}
