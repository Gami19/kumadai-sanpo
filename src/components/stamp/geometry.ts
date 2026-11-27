/**
 * 印面は 100×100。ここでの数は画面の pt ではなく、印どうしで線と字を揃えるための単位。
 * 角度は東が 0、北が 90（数学の向き）。画面では y が下なので、描くときに反転する。
 */
export const STAMP_BOX = 100;
const CX = 50;
const CY = 50;

export const FRAME_OUTER = 46;
export const FRAME_INNER = 33.5;
const TEXT_RADIUS = (FRAME_OUTER + FRAME_INNER) / 2;

export type FrameKind = 'circle' | 'quatrefoil' | 'octagon' | 'hexagon';

export type Glyph = {
  char: string;
  x: number;
  y: number;
  rotate: number;
};

export function point(radius: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)];
}

export function framePath(kind: FrameKind, radius: number): string {
  switch (kind) {
    case 'circle':
      return circlePath(radius);
    case 'quatrefoil':
      return quatrefoil(radius);
    case 'octagon':
      return polygon(8, radius, 112.5);
    case 'hexagon':
      return polygon(6, radius, 120);
  }
}

function circlePath(radius: number): string {
  const r = radius.toFixed(2);
  const d = (radius * 2).toFixed(2);
  return `M ${CX - radius} ${CY} a ${r} ${r} 0 1 0 ${d} 0 a ${r} ${r} 0 1 0 -${d} 0`;
}

/** 東西南北にふくらみ、斜めがくびれる。各ふくらみは先端と両隣のくびれを通る円弧。 */
function quatrefoil(radius: number): string {
  const pinch = radius * 0.58;
  const p = pinch * Math.SQRT1_2;
  const h = (radius * radius - 2 * p * p) / (2 * (radius - p));
  const rho = radius - h;
  const ne = [CX + p, CY - p];
  const se = [CX + p, CY + p];
  const sw = [CX - p, CY + p];
  const nw = [CX - p, CY - p];
  const arc = (to: number[]) =>
    `A ${rho.toFixed(2)} ${rho.toFixed(2)} 0 1 1 ${to[0].toFixed(2)} ${to[1].toFixed(2)}`;
  return `M ${ne[0].toFixed(2)} ${ne[1].toFixed(2)} ${arc(se)} ${arc(sw)} ${arc(nw)} ${arc(ne)} Z`;
}

function polygon(sides: number, radius: number, startDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const [x, y] = point(radius, startDeg - (360 / sides) * i);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

function arcFontSize(text: string): number {
  const count = Array.from(text).length;
  if (count >= 5) {
    return 7;
  }
  if (count >= 4) {
    return 7.6;
  }
  return 8.4;
}

/**
 * 上段は外向き、下段は読める向き（天が印の中心）。
 * 字は弧いっぱいに引き伸ばさず、字間を固定して中央に置く。
 */
function arcGlyphs(
  text: string,
  radius: number,
  centerDeg: number,
  fontSize: number,
  upright: 'out' | 'in',
): Glyph[] {
  const chars = Array.from(text);
  const count = chars.length;
  if (count === 0) {
    return [];
  }
  const step = ((fontSize * 1.45) / radius) * (180 / Math.PI);
  const span = step * (count - 1);
  const dir = upright === 'out' ? -1 : 1;
  const start = centerDeg - (dir * span) / 2;
  return chars.map((char, index) => {
    const deg = start + dir * step * index;
    const [x, y] = point(radius, deg);
    const rotate = upright === 'out' ? 90 - deg : 270 - deg;
    return { char, x, y, rotate };
  });
}

function lineGlyphs(text: string, y: number, fontSize: number, maxWidth: number): Glyph[] {
  const chars = Array.from(text);
  const count = chars.length;
  if (count === 0) {
    return [];
  }
  let dx = fontSize * 1.28;
  if (count > 1 && (count - 1) * dx > maxWidth) {
    dx = maxWidth / (count - 1);
  }
  const start = CX - ((count - 1) * dx) / 2;
  return chars.map((char, index) => ({
    char,
    x: start + index * dx,
    y,
    rotate: 0,
  }));
}

function flatEdgeWidth(sides: 6 | 8): number {
  const start = sides === 6 ? 120 : 112.5;
  const [x1] = point(FRAME_OUTER - 4, start);
  const [x2] = point(FRAME_OUTER - 4, start - 360 / sides);
  return Math.abs(x2 - x1);
}

function flatInsetY(sides: 6 | 8, edge: 'top' | 'bottom', fontSize: number): number {
  const tilt = sides === 6 ? 60 : 67.5;
  const outer = Math.sin((tilt * Math.PI) / 180) * FRAME_OUTER;
  if (edge === 'top') {
    return CY - outer + fontSize * 0.95;
  }
  return CY + outer - fontSize * 0.2;
}

export function captionGlyphs(
  frame: FrameKind,
  text: string,
  edge: 'top' | 'bottom',
): { glyphs: Glyph[]; fontSize: number } {
  const fontSize = arcFontSize(text);
  if (frame === 'circle' || frame === 'quatrefoil') {
    const radius =
      edge === 'top' ? TEXT_RADIUS - fontSize * 0.34 : TEXT_RADIUS + fontSize * 0.62;
    return {
      fontSize,
      glyphs: arcGlyphs(text, radius, edge === 'top' ? 90 : -90, fontSize, edge === 'top' ? 'out' : 'in'),
    };
  }
  const sides = frame === 'hexagon' ? 6 : 8;
  return {
    fontSize,
    glyphs: lineGlyphs(text, flatInsetY(sides, edge, fontSize), fontSize, flatEdgeWidth(sides)),
  };
}

/** 文字とぶつからない、左右の飾り点。全制覇と区画制覇だけ。 */
export function beadPoints(): readonly [number, number][] {
  const radius = TEXT_RADIUS;
  const degrees = [150, 180, 210, 30, 0, -30];
  return degrees.map((deg) => point(radius, deg));
}
