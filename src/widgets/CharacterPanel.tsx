import { usePlugin, renderWidget, useSyncedStorageState } from '@remnote/plugin-sdk';

function CharacterPanel() {
  const plugin = usePlugin();

  const [character] = useSyncedStorageState('character', {
    level: 1, currentXP: 0, totalXP: 0, cardsAnswered: 0
  });
  const [enemy] = useSyncedStorageState('activeEnemy', null);

  const xpPercent = character
    ? Math.round((character.currentXP / (100 * character.level * character.level)) * 100)
    : 0;

  return (
    <div style={{ padding: '12px', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
        ⚔️ StudyQuest
      </div>

      {/* Charakter */}
      <div style={{ marginBottom: '12px' }}>
        <div>🧙 Level {character?.level ?? 1}</div>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {character?.cardsAnswered ?? 0} Karten beantwortet
        </div>

        {/* XP-Leiste */}
        <div style={{ marginTop: '6px', background: '#333', borderRadius: '4px', height: '10px' }}>
          <div style={{
            width: `${xpPercent}%`,
            background: '#f0a500',
            borderRadius: '4px',
            height: '100%',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          {character?.currentXP ?? 0} / {100 * (character?.level ?? 1) ** 2} XP
        </div>
      </div>

      {/* Aktiver Gegner */}
      {enemy && (
        <div style={{ border: '1px solid #444', borderRadius: '6px', padding: '8px' }}>
          <div style={{ fontSize: '20px' }}>{enemy.emoji}</div>
          <div style={{ fontWeight: 'bold' }}>{enemy.name}</div>
          <div style={{ background: '#3a0000', borderRadius: '4px', height: '8px', marginTop: '4px' }}>
            <div style={{
              width: `${Math.round((enemy.currentHP / enemy.maxHP) * 100)}%`,
              background: '#cc0000',
              borderRadius: '4px',
              height: '100%',
              transition: 'width 0.2s ease'
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
            HP: {enemy.currentHP} / {enemy.maxHP}
          </div>
        </div>
      )}
    </div>
  );
}

renderWidget(CharacterPanel);