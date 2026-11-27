/**
 * 互換エントリ。実処理は prepare-stamp-artwork.mjs。
 *
 * 使い方: node scripts/embed-stamp-artwork.mjs <building-id>
 */
import { spawnSync } from 'node:child_process';

const id = process.argv[2];
if (id == null || id.length === 0) {
  console.error('usage: node scripts/embed-stamp-artwork.mjs <building-id>');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['scripts/prepare-stamp-artwork.mjs', id], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
