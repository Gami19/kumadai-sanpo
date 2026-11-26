import categories from '../../../data/geo/categories.json';

const designationIds = new Set(categories.categories.map((category) => category.id));

const POSITION_STATUSES = ['確定', '推定', '未取得'] as const;

export type PositionStatus = (typeof POSITION_STATUSES)[number];

export type Spot = {
  name: string;
  osmName: string;
  /** 座標が無い行は null。文書館のように未確定の地点はここに残し、ピンにはしない。 */
  lat: number | null;
  lon: number | null;
  latText: string;
  lonText: string;
  footprintPoints: string;
  designation: string;
  positionStatus: PositionStatus;
  source: string;
};

const REQUIRED_COLUMNS = [
  'spot',
  'osm_name',
  'lat',
  'lon',
  'footprint_points',
  'designation',
  'position_status',
  'source',
] as const;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, '');

  const pushRow = () => {
    row.push(field);
    field = '';
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row);
    }
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') {
        index += 1;
      }
      pushRow();
      continue;
    }
    field += char;
  }

  if (inQuotes) {
    throw new Error('spots.csv の引用符が閉じていません');
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }
  return rows;
}

function columnIndex(header: string[], name: string): number {
  const index = header.indexOf(name);
  if (index < 0) {
    throw new Error(`spots.csv に ${name} 列がありません`);
  }
  return index;
}

function parseCoordinate(value: string, spotName: string, axis: 'lat' | 'lon'): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${spotName} の ${axis} が数値ではありません: ${value}`);
  }
  return parsed;
}

function isPositionStatus(value: string): value is PositionStatus {
  return (POSITION_STATUSES as readonly string[]).includes(value);
}

export function parseSpotsCsv(text: string): Spot[] {
  const table = parseCsv(text);
  const header = table[0];
  if (!header) {
    throw new Error('spots.csv が空です');
  }
  for (const name of REQUIRED_COLUMNS) {
    columnIndex(header, name);
  }

  const spotIndex = columnIndex(header, 'spot');
  const osmIndex = columnIndex(header, 'osm_name');
  const latIndex = columnIndex(header, 'lat');
  const lonIndex = columnIndex(header, 'lon');
  const footprintIndex = columnIndex(header, 'footprint_points');
  const designationIndex = columnIndex(header, 'designation');
  const statusIndex = columnIndex(header, 'position_status');
  const sourceIndex = columnIndex(header, 'source');
  const spots: Spot[] = [];
  const seen = new Set<string>();

  for (const cells of table.slice(1)) {
    if (cells.length !== header.length) {
      throw new Error(`spots.csv の列数が見出しと違います: ${cells.join(',')}`);
    }
    const name = cells[spotIndex]?.trim() ?? '';
    if (name.length === 0) {
      throw new Error('spots.csv に名前の無い行があります');
    }
    if (seen.has(name)) {
      throw new Error(`スポット名が重複しています: ${name}`);
    }
    seen.add(name);

    const latText = cells[latIndex]?.trim() ?? '';
    const lonText = cells[lonIndex]?.trim() ?? '';
    const lat = parseCoordinate(latText, name, 'lat');
    const lon = parseCoordinate(lonText, name, 'lon');
    if ((lat == null) !== (lon == null)) {
      throw new Error(`${name} は緯度と経度の片方だけが入っています`);
    }

    const designation = cells[designationIndex]?.trim() ?? '';
    if (designation.length > 0 && !designationIds.has(designation)) {
      throw new Error(`${name} の designation が区分にありません: ${designation}`);
    }

    const positionStatus = cells[statusIndex]?.trim() ?? '';
    if (!isPositionStatus(positionStatus)) {
      throw new Error(`${name} の position_status が不正です: ${positionStatus}`);
    }
    if (positionStatus === '未取得' && (lat != null || lon != null)) {
      throw new Error(`${name} は未取得なのに座標があります`);
    }
    if (positionStatus !== '未取得' && (lat == null || lon == null)) {
      throw new Error(`${name} は座標が無いのに ${positionStatus} です`);
    }
    if (positionStatus !== '未取得' && designation.length === 0) {
      throw new Error(`${name} に文化財指定の区分がありません`);
    }

    spots.push({
      name,
      osmName: cells[osmIndex]?.trim() ?? '',
      lat,
      lon,
      latText,
      lonText,
      footprintPoints: cells[footprintIndex]?.trim() ?? '',
      designation,
      positionStatus,
      source: cells[sourceIndex]?.trim() ?? '',
    });
  }

  return spots;
}
