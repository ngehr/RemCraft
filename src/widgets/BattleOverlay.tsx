import { usePlugin, renderWidget, useSyncedStorageState } from '@remnote/plugin-sdk';

function BattleOverlay() {
  const [enemy] = useSyncedStorageState('activeEnemy', null);
  const [character] = useSyncedStorageState('character', { level: 1 });

  if (!enemy) return <div>Lade...</div>;

  const hpPercent = Math.round((enemy.currentHP / enemy.maxHP) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '8px',
      fontSize: '13px'
    }}>
      <span style={{ fontSize: '24px' }}>{enemy.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold' }}>{enemy.name}</div>
        <div style={{ background: '#500', borderRadius: '3px', height: '6px', marginTop: '3px' }}>
          <div style={{
            width: `${hpPercent}%`,
            background: `hsl(${hpPercent}, 80%, 40%)`,
            borderRadius: '3px',
            height: '100%'
          }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', color: '#888' }}>
        <div>Lv. {character.level}</div>
        <div style={{ fontSize: '11px' }}>⚔️ Angriff!</div>
      </div>
    </div>
  );
}

renderWidget(BattleOverlay);