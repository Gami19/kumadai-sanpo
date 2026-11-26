import type { InfoId } from '@/lib/sheet/session';

/**
 * 画面に繰り返さない注意の全文。見える場所は記号にし、文章はシートのここにだけ置く。
 * 端末内保存の4点（アカウントなし、サーバーへ送らない、位置は保存しない、機種変更では移らない）は弱めない。
 */
export const notices: Record<InfoId, { title: string; paragraphs: readonly string[] }> = {
  device: {
    title: 'この端末だけ',
    paragraphs: [
      'アカウントはありません。訪問スタンプ、お気に入り、クイズの成績は、この端末の中だけに残します。',
      'サーバーへは送りません。位置情報は保存しません。',
      '端末を替えると、記録は移りません。',
      'スタンプは、建物の画面で手で付けます。近くにいるだけでは付きません。',
    ],
  },
  estimated: {
    title: '位置は推定',
    paragraphs: [
      '位置は推定です。現地で確認できるまで、確定した場所としては扱いません。',
    ],
  },
  osm: {
    title: '地図の出典',
    paragraphs: [
      '地図の下敷きは OpenStreetMap のデータを使っています。ライセンスは ODbL です。',
      '© OpenStreetMap contributors',
    ],
  },
};

export const ESTIMATED_LABEL = '推定';

export const OSM_CREDIT = '© OpenStreetMap contributors';
