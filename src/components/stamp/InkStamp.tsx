import { useId } from 'react';
import { Circle, Ellipse, G, Mask, Path, Rect, Svg, Text } from 'react-native-svg';

import { theme } from '@/theme/tokens';

import { CAMPUS_LABEL } from './catalog';
import { MARKS } from './marks';
import { INK_SPECKS } from './wear';
import {
  beadPoints,
  captionGlyphs,
  FRAME_INNER,
  FRAME_OUTER,
  framePath,
  STAMP_BOX,
  type FrameKind,
  type Glyph,
} from './geometry';
import { StampLanding } from './StampLanding';

type Props = {
  frame: FrameKind;
  kanji: string;
  arc: string;
  mark: string;
  /** 単色のインク。 */
  ink: string;
  /** あるとき、内枠と線画とうこん側の点に使う。全制覇だけ。 */
  accent?: string;
  /** 区画制覇と全制覇。左右に点を足す。 */
  ornate?: boolean;
  size: number;
  pop?: boolean;
};

const FRAME_STROKE = 1.75;
const INNER_STROKE = 1.05;
const LINE_STROKE = 1.35;

export function InkStamp({ frame, kanji, arc, mark, ink, accent, ornate = false, size, pop = false }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const maskId = `wear${rawId}`;
  const showArc = size >= 88;
  const showMark = size >= 64;
  const drawing = MARKS[mark];
  const motif = accent ?? ink;
  const top = captionGlyphs(frame, arc, 'top');
  const bottom = captionGlyphs(frame, CAMPUS_LABEL, 'bottom');

  return (
    <StampLanding pop={pop}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${STAMP_BOX} ${STAMP_BOX}`}
      >
        <Mask id={maskId} x="0" y="0" width={STAMP_BOX} height={STAMP_BOX}>
          <Rect width={STAMP_BOX} height={STAMP_BOX} fill={theme.color.white} />
          {/* #000 はマスクの穴。インク色ではない。 */}
          {INK_SPECKS.map((speck, index) => (
            <Ellipse
              key={index}
              cx={speck.x}
              cy={speck.y}
              rx={speck.rx}
              ry={speck.ry}
              fill="#000000"
              opacity={speck.o}
            />
          ))}
        </Mask>
        <G mask={`url(#${maskId})`}>
          <Path
            d={framePath(frame, FRAME_OUTER)}
            fill={theme.color.paper}
            stroke={ink}
            strokeWidth={FRAME_STROKE}
          />
          <Path
            d={framePath(frame, FRAME_INNER)}
            fill="none"
            stroke={accent ?? ink}
            strokeWidth={INNER_STROKE}
          />
          {showArc ? <Glyphs glyphs={top.glyphs} fill={ink} fontSize={top.fontSize} /> : null}
          {showArc ? <Glyphs glyphs={bottom.glyphs} fill={ink} fontSize={bottom.fontSize} /> : null}
          {ornate && showArc
            ? beadPoints().map(([x, y], index) => (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={1.15}
                  fill={accent != null && index % 2 === 0 ? accent : ink}
                />
              ))
            : null}
          <Text
            x={50}
            y={showMark ? 46 : 56}
            fill={ink}
            fontSize={showMark ? 16 : 28}
            fontFamily={theme.font.heading}
            textAnchor="middle"
          >
            {kanji}
          </Text>
          {showMark && drawing != null ? (
            <G transform="translate(29 46) scale(0.86)">
              {drawing.paths.map((d, index) => (
                <Path
                  key={index}
                  d={d}
                  fill="none"
                  stroke={motif}
                  strokeWidth={LINE_STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {drawing.circles?.map((circle, index) => (
                <Circle
                  key={index}
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  fill="none"
                  stroke={motif}
                  strokeWidth={LINE_STROKE}
                />
              ))}
            </G>
          ) : null}
        </G>
      </Svg>
    </StampLanding>
  );
}

function Glyphs({ glyphs, fill, fontSize }: { glyphs: readonly Glyph[]; fill: string; fontSize: number }) {
  return glyphs.map((glyph, index) => (
    <Text
      key={`${glyph.char}${index}`}
      x={glyph.x}
      y={glyph.y}
      fill={fill}
      fontSize={fontSize}
      fontFamily={theme.font.heading}
      textAnchor="middle"
      transform={`rotate(${glyph.rotate.toFixed(2)} ${glyph.x.toFixed(2)} ${glyph.y.toFixed(2)})`}
    >
      {glyph.char}
    </Text>
  ));
}
