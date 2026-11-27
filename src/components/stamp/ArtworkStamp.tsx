import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { StampArtwork } from './artwork/types';
import { StampLanding } from './StampLanding';

type Props = {
  artwork: StampArtwork;
  size: number;
  pop?: boolean;
};

/**
 * -8deg の傾きで外周が切れない余白。
 * cos(8°)≈0.990、対角方向の伸びは約 1 + √2·sin(8°) ≈ 1.20 未満。
 * 実測では 1.12 で円枠が欠けない。
 */
const ROTATION_PAD = 1.12;

/**
 * 原画 SVG の印。縦横比を保ち、インクの重心でマスの中央に置く。
 * 外接矩形の中心ではなく、不透明画素の重心で合わせる。
 */
export function ArtworkStamp({ artwork, size, pop = false }: Props) {
  const draw = size / ROTATION_PAD;
  const aspect = artwork.width / artwork.height;
  const width = aspect >= 1 ? draw : draw * aspect;
  const height = aspect >= 1 ? draw / aspect : draw;
  const scale = width / artwork.width;
  // meet は図形の外接中心を箱の中心に置く。重心差分だけずらす。
  const shiftX = (artwork.width / 2 - artwork.centroidX) * scale;
  const shiftY = (artwork.height / 2 - artwork.centroidY) * scale;

  return (
    <StampLanding pop={pop}>
      <View style={[styles.cell, { width: size, height: size }]} accessible={false}>
        <View
          style={{
            width,
            height,
            transform: [{ translateX: shiftX }, { translateY: shiftY }],
          }}
        >
          <SvgXml
            xml={artwork.xml}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
          />
        </View>
      </View>
    </StampLanding>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
