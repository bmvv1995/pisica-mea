import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, RefreshCcw, Shuffle, Wand2 } from "lucide-react";
import * as htmlToImage from "html-to-image";

// --- Small helper types
 type AccessoryKey = "bow" | "hat" | "scarf" | "collar";
 type BreedKey = "short" | "fluffy" | "siamese";

// --- Random helpers
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomHexColor() {
  const h = (Math.random() * 360) | 0;
  const s = 40 + Math.random() * 40; // muted to vivid
  const l = 35 + Math.random() * 35; // mid-range
  return `hsl(${h} ${s}% ${l}%)`;
}

// --- Simple draggable hook for accessories
function useDrag() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return { pos, setPos, bind: { onPointerDown, onPointerMove, onPointerUp } };
}

// --- Main component
export default function CatDressUpApp() {
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Core state
  const [breed, setBreed] = useState<BreedKey>("short");
  const [fur, setFur] = useState<string>("hsl(30 35% 55%)"); // default warm brown
  const [secondaryFur, setSecondaryFur] = useState<string>("hsl(20 20% 30%)"); // darker mask/ears for siamese etc.
  const [eyes, setEyes] = useState<string>("hsl(190 80% 45%)"); // blue-green

  // Accessory visibility + colors
  const [accVisible, setAccVisible] = useState<Record<AccessoryKey, boolean>>({ bow: true, hat: false, scarf: false, collar: true });
  const [accColor, setAccColor] = useState<Record<AccessoryKey, string>>({ bow: "hsl(340 70% 46%)", hat: "hsl(250 40% 30%)", scarf: "hsl(0 60% 45%)", collar: "hsl(28 80% 45%)" });

  // Draggable positions
  const bowDrag = useDrag();
  const hatDrag = useDrag();
  const scarfDrag = useDrag();
  const collarDrag = useDrag();

  // Base image upload (optional) – allows a real photo as background
  const [userBase, setUserBase] = useState<string | null>(null);
  const onUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUserBase(reader.result as string);
    reader.readAsDataURL(file);
  };

  const doRandomize = () => {
    const breeds: BreedKey[] = ["short", "fluffy", "siamese"];
    setBreed(breeds[rand(0, breeds.length - 1)]);
    setFur(randomHexColor());
    setSecondaryFur(randomHexColor());
    setEyes(randomHexColor());

    const vis: Record<AccessoryKey, boolean> = { bow: Math.random() > 0.5, hat: Math.random() > 0.5, scarf: Math.random() > 0.5, collar: Math.random() > 0.5 };
    setAccVisible(vis);
    const colors: Record<AccessoryKey, string> = {
      bow: randomHexColor(), hat: randomHexColor(), scarf: randomHexColor(), collar: randomHexColor(),
    };
    setAccColor(colors);

    bowDrag.setPos({ x: rand(-20, 20), y: rand(-10, 10) });
    hatDrag.setPos({ x: rand(-30, 30), y: rand(-40, -10) });
    scarfDrag.setPos({ x: rand(-10, 10), y: rand(15, 35) });
    collarDrag.setPos({ x: rand(-10, 10), y: rand(18, 28) });
  };

  const doReset = () => {
    setBreed("short");
    setFur("hsl(30 35% 55%)");
    setSecondaryFur("hsl(20 20% 30%)");
    setEyes("hsl(190 80% 45%)");
    setAccVisible({ bow: true, hat: false, scarf: false, collar: true });
    setAccColor({ bow: "hsl(340 70% 46%)", hat: "hsl(250 40% 30%)", scarf: "hsl(0 60% 45%)", collar: "hsl(28 80% 45%)" });
    bowDrag.setPos({ x: 0, y: 0 });
    hatDrag.setPos({ x: 0, y: -20 });
    scarfDrag.setPos({ x: 0, y: 25 });
    collarDrag.setPos({ x: 0, y: 22 });
    setUserBase(null);
  };

  const exportPNG = async () => {
    if (!stageRef.current) return;
    const dataUrl = await htmlToImage.toPng(stageRef.current, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "pisica-mea.png";
    a.click();
  };

  // Derived: ear + face shapes by breed (SVG paths)
  const shapes = useMemo(() => {
    if (breed === "fluffy") {
      return {
        head: "M 0 -40 C -35 -40 -48 -25 -52 -5 C -58 20 -40 40 0 45 C 40 40 58 20 52 -5 C 48 -25 35 -40 0 -40 Z",
        earL: "M -25 -45 C -40 -75 -10 -80 -8 -52 Z",
        earR: "M 25 -45 C 40 -75 10 -80 8 -52 Z",
        cheekFuzz: true,
      };
    } else if (breed === "siamese") {
      return {
        head: "M 0 -35 C -30 -38 -45 -22 -48 -8 C -52 12 -35 35 0 38 C 35 35 52 12 48 -8 C 45 -22 30 -38 0 -35 Z",
        earL: "M -23 -42 C -38 -68 -8 -72 -6 -50 Z",
        earR: "M 23 -42 C 38 -68 8 -72 6 -50 Z",
        cheekFuzz: false,
      };
    }
    // short hair (default)
    return {
      head: "M 0 -38 C -28 -38 -42 -22 -46 -6 C -50 12 -32 32 0 36 C 32 32 50 12 46 -6 C 42 -22 28 -38 0 -38 Z",
      earL: "M -22 -42 C -34 -66 -8 -70 -6 -48 Z",
      earR: "M 22 -42 C 34 -66 8 -70 6 -48 Z",
      cheekFuzz: false,
    };
  }, [breed]);

  // Siamese face mask toggle
  const showMask = breed === "siamese";

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Stage */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/80 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
            <h1 className="text-xl sm:text-2xl font-semibold">Pisica mea 🐾</h1>
            <div className="flex gap-2">
              <Btn onClick={doRandomize} title="Randomizează"><Shuffle className="w-4 h-4" /></Btn>
              <Btn onClick={doReset} title="Resetează"><RefreshCcw className="w-4 h-4" /></Btn>
              <Btn onClick={exportPNG} title="Descarcă PNG"><Download className="w-4 h-4" /></Btn>
            </div>
          </div>

          <div className="relative aspect-[4/3] sm:aspect-[5/3] md:aspect-[16/9] bg-white/60 rounded-2xl m-4 border border-slate-200 shadow-inner" ref={stageRef}>
            {/* Optional user photo as background */}
            {userBase && (
              <img src={userBase} alt="foto pisică" className="absolute inset-0 w-full h-full object-contain select-none" />
            )}

            {/* Centered cat vector */}
            <motion.div
              className="absolute inset-0 grid place-items-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <svg viewBox="-90 -100 180 175" className="w-[85%] max-w-[700px] drop-shadow-sm">
                {/* shadow */}
                <ellipse cx="0" cy="68" rx="42" ry="10" fill="rgba(0,0,0,0.08)" />

                {/* ears */}
                <path d={shapes.earL} fill={secondaryFur} />
                <path d={shapes.earR} fill={secondaryFur} />
                <path d={shapes.earL} fill="url(#earInner)" opacity="0.6" />
                <path d={shapes.earR} fill="url(#earInner)" opacity="0.6" />

                {/* head base */}
                <path d={shapes.head} fill={fur} />

                {/* siamese darker mask */}
                {showMask && (
                  <path d={shapes.head} fill={secondaryFur} opacity="0.55" />
                )}

                {/* cheek fuzz if fluffy */}
                {shapes.cheekFuzz && (
                  <>
                    <path d="M -40 5 C -50 5 -50 20 -38 20" stroke={fur} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
                    <path d="M 40 5 C 50 5 50 20 38 20" stroke={fur} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
                  </>
                )}

                {/* muzzle */}
                <ellipse cx="0" cy="5" rx="26" ry="18" fill="rgba(255,255,255,0.8)" />

                {/* nose */}
                <path d="M 0 0 m -4 0 l 8 0 l -4 5 z" fill="#c26" />

                {/* mouth */}
                <path d="M 0 6 c -4 4 -10 4 -15 1" stroke="#5a3a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M 0 6 c 4 4 10 4 15 1" stroke="#5a3a3a" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* whiskers */}
                <g opacity="0.7" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M -12 6 c -16 0 -24 -4 -32 -8" />
                  <path d="M -12 11 c -16 2 -24 -1 -32 -4" />
                  <path d="M -12 1 c -16 -2 -24 -6 -32 -10" />
                  <path d="M 12 6 c 16 0 24 -4 32 -8" />
                  <path d="M 12 11 c 16 2 24 -1 32 -4" />
                  <path d="M 12 1 c 16 -2 24 -6 32 -10" />
                </g>

                {/* eyes */}
                <g>
                  {/* sclera */}
                  <ellipse cx="-16" cy="-5" rx="10" ry="7" fill="#fff" />
                  <ellipse cx="16" cy="-5" rx="10" ry="7" fill="#fff" />

                  {/* iris (color) */}
                  <defs>
                    <radialGradient id="irisL" cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                      <stop offset="60%" stopColor={eyes} />
                      <stop offset="100%" stopColor={eyes} />
                    </radialGradient>
                    <radialGradient id="irisR" cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                      <stop offset="60%" stopColor={eyes} />
                      <stop offset="100%" stopColor={eyes} />
                    </radialGradient>
                  </defs>
                  <circle cx="-16" cy="-5" r="6" fill="url(#irisL)" />
                  <circle cx="16" cy="-5" r="6" fill="url(#irisR)" />

                  {/* pupil */}
                  <ellipse cx="-16" cy="-5" rx="2" ry="5" fill="#111" />
                  <ellipse cx="16" cy="-5" rx="2" ry="5" fill="#111" />

                  {/* eye highlight */}
                  <circle cx="-18" cy="-7" r="1.5" fill="#fff" />
                  <circle cx="14" cy="-7" r="1.5" fill="#fff" />
                </g>

                {/* ear inner gradient def */}
                <defs>
                  <linearGradient id="earInner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd1dc" />
                    <stop offset="100%" stopColor="#f6a5b3" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Accessories – simple vector shapes that are draggable */}
              {accVisible.hat && (
                <motion.div
                  className="absolute select-none touch-none"
                  style={{ transform: `translate(${hatDrag.pos.x}px, ${hatDrag.pos.y}px)` }}
                  {...hatDrag.bind}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: hatDrag.pos.y, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                >
                  <svg viewBox="-60 -30 120 50" className="w-40">
                    <ellipse cx="0" cy="0" rx="52" ry="6" fill={accColor.hat} opacity="0.9" />
                    <rect x="-22" y="-16" width="44" height="14" rx="6" fill={accColor.hat} />
                    <rect x="-24" y="-4" width="48" height="6" rx="3" fill="#000" opacity="0.25" />
                  </svg>
                </motion.div>
              )}

              {accVisible.bow && (
                <motion.div
                  className="absolute select-none touch-none"
                  style={{ transform: `translate(${bowDrag.pos.x}px, ${bowDrag.pos.y}px)` }}
                  {...bowDrag.bind}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: bowDrag.pos.y, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 16 }}
                >
                  <svg viewBox="-60 -20 120 40" className="w-36">
                    <path d="M -40 0 C -30 -12 -18 -12 -8 0 C -18 12 -30 12 -40 0 Z" fill={accColor.bow} />
                    <circle cx="0" cy="0" r="6" fill={accColor.bow} />
                    <path d="M 40 0 C 30 -12 18 -12 8 0 C 18 12 30 12 40 0 Z" fill={accColor.bow} />
                  </svg>
                </motion.div>
              )}

              {accVisible.scarf && (
                <motion.div
                  className="absolute select-none touch-none"
                  style={{ transform: `translate(${scarfDrag.pos.x}px, ${scarfDrag.pos.y}px)` }}
                  {...scarfDrag.bind}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: scarfDrag.pos.y, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 18 }}
                >
                  <svg viewBox="-70 -20 140 60" className="w-48">
                    <rect x="-55" y="-4" width="110" height="16" rx="8" fill={accColor.scarf} />
                    <rect x="15" y="10" width="16" height="24" rx="8" fill={accColor.scarf} />
                  </svg>
                </motion.div>
              )}

              {accVisible.collar && (
                <motion.div
                  className="absolute select-none touch-none"
                  style={{ transform: `translate(${collarDrag.pos.x}px, ${collarDrag.pos.y}px)` }}
                  {...collarDrag.bind}
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: collarDrag.pos.y, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <svg viewBox="-70 -20 140 60" className="w-48">
                    <rect x="-52" y="-2" width="104" height="12" rx="6" fill={accColor.collar} />
                    <circle cx="0" cy="16" r="6" fill="#f5d442" />
                    <rect x="-6" y="12" width="12" height="16" rx="4" fill="#f5d442" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Tip for kids */}
          <p className="px-4 sm:px-6 pb-4 text-sm text-slate-600">👉 Poți trage cu degetul/mausul fundița, pălăria, eșarfa sau zgarda ca să le poziționezi exact cum vrei.</p>
        </Card>

        {/* Controls */}
        <Card>
          <div className="p-4 sm:p-6 space-y-5">
            <h2 className="text-lg font-semibold">Setări rapide</h2>

            {/* Breed */}
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Rasă / stil</label>
              <select className="border rounded-xl px-3 py-2" value={breed} onChange={(e) => setBreed(e.target.value as BreedKey)}>
                <option value="short">Short Hair</option>
                <option value="fluffy">Fluffy</option>
                <option value="siamese">Siamese</option>
              </select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Culoare blană</label>
                <input type="color" className="w-full h-10 rounded" value={toHexIfPossible(fur)} onChange={(e) => setFur(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-slate-600">Culoare secundară</label>
                <input type="color" className="w-full h-10 rounded" value={toHexIfPossible(secondaryFur)} onChange={(e) => setSecondaryFur(e.target.value)} />
              </div>
              <div className="grid gap-2 col-span-2">
                <label className="text-sm text-slate-600">Culoare ochi</label>
                <input type="color" className="w-full h-10 rounded" value={toHexIfPossible(eyes)} onChange={(e) => setEyes(e.target.value)} />
              </div>
            </div>

            {/* Accessories toggles */}
            <div className="grid gap-3">
              <label className="text-sm text-slate-600">Accesorii</label>
              <div className="grid grid-cols-2 gap-2">
                <Toggle label="Fundiță" checked={accVisible.bow} onChange={(v) => setAccVisible(s => ({ ...s, bow: v }))} />
                <Toggle label="Pălărie" checked={accVisible.hat} onChange={(v) => setAccVisible(s => ({ ...s, hat: v }))} />
                <Toggle label="Eșarfă" checked={accVisible.scarf} onChange={(v) => setAccVisible(s => ({ ...s, scarf: v }))} />
                <Toggle label="Zgardă" checked={accVisible.collar} onChange={(v) => setAccVisible(s => ({ ...s, collar: v }))} />
              </div>
            </div>

            {/* Accessory colors */}
            <div className="grid gap-3">
              <label className="text-sm text-slate-600">Culori accesorii</label>
              <div className="grid grid-cols-2 gap-4">
                <ColorRow label="Fundiță" value={accColor.bow} onChange={(c) => setAccColor(a => ({ ...a, bow: c }))} />
                <ColorRow label="Pălărie" value={accColor.hat} onChange={(c) => setAccColor(a => ({ ...a, hat: c }))} />
                <ColorRow label="Eșarfă" value={accColor.scarf} onChange={(c) => setAccColor(a => ({ ...a, scarf: c }))} />
                <ColorRow label="Zgardă" value={accColor.collar} onChange={(c) => setAccColor(a => ({ ...a, collar: c }))} />
              </div>
            </div>

            {/* Upload */}
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Vrei un fundal cu o pisică reală? Încarcă o poză (PNG/JPG)</label>
              <div className="flex items-center gap-2">
                <input
                  className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  type="file" accept="image/*"
                  onChange={(e) => onUpload(e.target.files?.[0])}
                />
                {userBase && (
                  <Btn onClick={() => setUserBase(null)} title="Șterge">
                    <Wand2 className="w-4 h-4" />
                  </Btn>
                )}
              </div>
              <p className="text-xs text-slate-500">Imaginea ta va apărea sub pisica desenată. Poți astfel obține un rezultat mai realist, păstrând controlul culorilor și accesoriilor.</p>
            </div>
          </div>
        </Card>
      </div>

      <footer className="max-w-6xl mx-auto pt-6 pb-2 text-center text-xs text-slate-500">Creat cu ❤️ pentru copii. Trage accesoriile pe scenă și apasă „Descarcă PNG”.</footer>
    </div>
  );
}

// --- UI primitives (tiny versions of shadcn-like cards/buttons)
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
  );
}

function Btn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-white hover:bg-slate-50 active:scale-[.98] transition border-slate-200"
    >
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center justify-between gap-3 border rounded-xl px-3 py-2 cursor-pointer select-none">
      <span className="text-sm">{label}</span>
      <input type="checkbox" className="w-4 h-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
      <span className="text-sm">{label}</span>
      <input type="color" className="w-full h-10 rounded" value={toHexIfPossible(value)} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Convert hsl() to hex for color input compatibility (very light util)
function toHexIfPossible(color: string) {
  if (!color.startsWith("hsl")) return color; // assume already hex
  const m = color.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!m) return "#888888";
  const h = parseInt(m[1], 10), s = parseInt(m[2], 10) / 100, l = parseInt(m[3], 10) / 100;
  // hsl -> rgb
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m0 = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const R = Math.round((r + m0) * 255), G = Math.round((g + m0) * 255), B = Math.round((b + m0) * 255);
  return `#${to2(R)}${to2(G)}${to2(B)}`;
}
function to2(n: number) { return n.toString(16).padStart(2, "0"); }
