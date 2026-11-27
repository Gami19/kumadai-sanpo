import { formatStampDistance, spokenStampDistance } from '@/lib/geo/distance';
import type { StampBlock } from '@/lib/stamp/gate';

/** 印の中に置く短い語。距離は目安。 */
export function blankCaption(block: StampBlock): string | null {
  switch (block.kind) {
    case 'far':
      return formatStampDistance(block.meters);
    case 'denied':
      return '許可';
    case 'off':
      return 'オフ';
    case 'unknown':
      return '再試行';
    case 'pending':
      return null;
  }
}

/** 詳細のボタン。印より余白があるので、何が起きるかまで書く。 */
export function blockedButtonLabel(block: StampBlock): string {
  switch (block.kind) {
    case 'far':
      return formatStampDistance(block.meters);
    case 'denied':
      return '位置を許可';
    case 'off':
      return '位置がオフ';
    case 'unknown':
      return '位置を再試行';
    case 'pending':
      return 'スタンプ';
  }
}

export function blockedAccessibility(name: string, block: StampBlock): string {
  switch (block.kind) {
    case 'far':
      return `${name}は${spokenStampDistance(block.meters)}先です。ここでは押せません`;
    case 'denied':
      return `位置情報がないため、${name}のスタンプは押せません`;
    case 'off':
      return `位置情報サービスがオフのため、${name}のスタンプは押せません`;
    case 'unknown':
      return `位置が分からないため、${name}のスタンプは押せません`;
    case 'pending':
      return `${name}のスタンプ`;
  }
}

export function blockNeedsRecover(block: StampBlock): boolean {
  return block.kind === 'denied' || block.kind === 'off' || block.kind === 'unknown';
}
