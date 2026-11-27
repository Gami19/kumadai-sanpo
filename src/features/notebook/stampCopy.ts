import { formatStampDistance, spokenStampDistance, STAMP_RADIUS_METERS } from '@/lib/geo/distance';
import type { StampBlock } from '@/lib/stamp/gate';

/** 帳面の1行ヒント。 */
export const STAMP_HINT = `現地の建物から約${STAMP_RADIUS_METERS}m以内でスタンプを押せます`;

/** 未取得マスに出す短い取り方。 */
export function howToGetLabel(block: StampBlock | null, ready: boolean): string {
  if (ready) {
    return '押せます';
  }
  if (block == null) {
    return `約${STAMP_RADIUS_METERS}m以内で押せます`;
  }
  switch (block.kind) {
    case 'far':
      return `あと${formatStampDistance(block.meters).replace(/^約/, '')}`;
    case 'denied':
      return '位置の許可が必要です';
    case 'off':
      return '位置情報をオンにしてください';
    case 'unknown':
      return '位置を再試行してください';
    case 'pending':
      return '位置を確認しています';
  }
}

/** モーダル本文。 */
export function howToGetBody(block: StampBlock | null, ready: boolean): string {
  if (ready) {
    return `いまこの建物の約${STAMP_RADIUS_METERS}m以内にいます。スタンプを押せます。`;
  }
  if (block == null) {
    return `建物の約${STAMP_RADIUS_METERS}m以内に来ると、スタンプを押せます。`;
  }
  switch (block.kind) {
    case 'far':
      return `建物まで${spokenStampDistance(block.meters)}です。約${STAMP_RADIUS_METERS}m以内に来ると押せます。`;
    case 'denied':
      return '位置情報を許可すると、近くに来たときにスタンプを押せます。';
    case 'off':
      return '位置情報サービスをオンにすると、近くに来たときにスタンプを押せます。';
    case 'unknown':
      return 'いまの位置が分かりません。再試行するか、地図で建物の場所を確認してください。';
    case 'pending':
      return '位置を確認しています。しばらくお待ちください。';
  }
}

/** 印の中に置く短い語（詳細ボタン用）。 */
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

/** 詳細のボタン。 */
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
