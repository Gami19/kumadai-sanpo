import { Pressable } from 'react-native';

import { BuildingStamp } from '@/components/stamp/BuildingStamp';
import { StampBlank } from '@/components/stamp/StampBlank';
import { frameForCampus } from '@/components/stamp/catalog';
import type { CampusId } from '@/features/map/campuses';
import type { Building } from '@/lib/content/buildings';
import type { StampGate } from '@/lib/stamp/gate';
import { theme } from '@/theme/tokens';

import { blankCaption, blockNeedsRecover, blockedAccessibility } from './stampCopy';

type Props = {
  building: Building;
  campusId: CampusId;
  stamped: boolean;
  pop: boolean;
  size: number;
  gate: StampGate;
  onStamp: () => void;
  onRemove: () => void;
  onRecover: () => void;
};

/** さんぽ帳の印。押せないときは枠の形とアイコンと距離で理由を示す。 */
export function StampControl({
  building,
  campusId,
  stamped,
  pop,
  size,
  gate,
  onStamp,
  onRemove,
  onRecover,
}: Props) {
  const frame = frameForCampus(campusId);
  const blocked = !stamped && !gate.ok ? gate.block : null;
  const recoverable = blocked != null && blockNeedsRecover(blocked);
  const label = stamped
    ? `${building.name}のスタンプを消す`
    : blocked != null
      ? blockedAccessibility(building.name, blocked)
      : `${building.name}にスタンプを押す`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        selected: stamped,
        disabled: blocked != null && !recoverable,
      }}
      onPress={() => {
        if (stamped) {
          onRemove();
          return;
        }
        if (gate.ok) {
          onStamp();
          return;
        }
        if (blockNeedsRecover(gate.block)) {
          onRecover();
        }
      }}
      pressRetentionOffset={theme.space.md}
      style={({ pressed }) => [
        { width: size, height: size, overflow: 'visible' },
        pressed && { opacity: theme.opacity.pressed },
      ]}
    >
      {stamped ? (
        <BuildingStamp buildingId={building.id} campusId={campusId} size={size} pop={pop} />
      ) : (
        <StampBlank
          frame={frame}
          size={size}
          tone={blocked == null ? 'ready' : 'blocked'}
          icon={blocked != null && blocked.kind !== 'pending' ? 'location.slash' : null}
          caption={blocked != null ? blankCaption(blocked) : null}
        />
      )}
    </Pressable>
  );
}
