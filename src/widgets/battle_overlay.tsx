import React from 'react';
import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';

interface CharacterState {
  level: number;
  currentXP: number;
  totalXP: number;
  cardsAnswered: number;
  monstersDefeated: number;
  elitesDefeated: number;
  hp: number;
  maxHp: number;
  silver: number;
  gold: number;
  streakDays: number;
  lastActiveDate: string;
  restedXPUsed: number;
  activeScrollCards: number;
  activeDamageCards: number;
  goodStreak: number;
}

interface EnemyState {
  id: string;
  name: string;
  emoji: string;
  maxHP: number;
  currentHP: number;
  elite: boolean;
  zoneId: string;
  zoneName: string;
  imageKey?: string;
  damage: number;
}

const RESTED_XP_CARDS = 50;

const defaultEnemy: EnemyState = {
  id: '',
  name: 'Enemy loading…',
  emoji: '⚔️',
  maxHP: 1,
  currentHP: 1,
  elite: false,
  zoneId: 'elwynn',
  zoneName: 'Elwynn Forest',
  damage: 2,
};

const defaultCharacter: CharacterState = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  cardsAnswered: 0,
  monstersDefeated: 0,
  elitesDefeated: 0,
  hp: 100,
  maxHp: 100,
  silver: 0,
  gold: 0,
  streakDays: 0,
  lastActiveDate: '',
  restedXPUsed: 0,
  activeScrollCards: 0,
  activeDamageCards: 0,
  goodStreak: 0,
};

function getCharacterSprite(rootURL: string, level: number): string {
  const n = Math.max(1, Math.min(60, level));
  if (n >= 60) return `${rootURL}ui/character_60.png`;
  if (n >= 50) return `${rootURL}ui/character_50.png`;
  if (n >= 40) return `${rootURL}ui/character_40.png`;
  if (n >= 30) return `${rootURL}ui/character_30.png`;
  if (n >= 20) return `${rootURL}ui/character_20.png`;
  if (n >= 10) return `${rootURL}ui/character_10.png`;
  return `${rootURL}ui/character_01.png`;
}

function BattleOverlay() {
  const plugin = usePlugin();
  const rootURL = plugin.rootURL ?? '';
  const [rawEnemy] = useSyncedStorageState<EnemyState>('activeEnemy', defaultEnemy);
  const [rawChar] = useSyncedStorageState<CharacterState>('character', defaultCharacter);

  const enemy: EnemyState = { ...defaultEnemy, ...(rawEnemy ?? {}) };
  const character: CharacterState = { ...defaultCharacter, ...(rawChar ?? {}) };

  const hpPct = Math.min(
    100,
    enemy.maxHP > 0 ? Math.round((enemy.currentHP / enemy.maxHP) * 100) : 0
  );
  const level = Math.max(1, Math.min(60, character.level));
  const xpNeeded = Math.floor(100 * level * (1 + 0.1 * level));
  const xpPct = Math.min(
    100,
    xpNeeded > 0 ? Math.round((character.currentXP / xpNeeded) * 100) : 0
  );
  const charHpPct = Math.min(
    100,
    character.maxHp > 0 ? Math.round((character.hp / character.maxHp) * 100) : 0
  );
  const hpColor = charHpPct > 60 ? '#4ade80' : charHpPct > 30 ? '#facc15' : '#ef4444';
  const restedLeft = Math.max(0, RESTED_XP_CARDS - character.restedXPUsed);

  return (
    <div
      style={{
        background: 'rgba(5,5,12,0.96)',
        borderRadius: '10px',
        border: '1px solid #705030',
        boxShadow: '0 0 16px rgba(0,0,0,0.8)',
        padding: '10px 14px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#f3f3f3',
        width: '300px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid #705030',
          paddingBottom: '4px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: '#c79c6e',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {enemy.zoneName}
        </div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '10px' }}>
          {character.streakDays > 1 && (
            <span style={{ color: '#fb923c' }}>🔥 {character.streakDays}d</span>
          )}
          {restedLeft > 0 && (
            <span style={{ color: '#93c5fd' }}>💤 {restedLeft}</span>
          )}
          {character.activeScrollCards > 0 && (
            <span style={{ color: '#60a5fa' }}>📜 {character.activeScrollCards}</span>
          )}
          {character.activeDamageCards > 0 && (
            <span style={{ color: '#f97373' }}>💢 {character.activeDamageCards}</span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '10px',
        }}
      >
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          {enemy.imageKey ? (
            <img
              src={`${rootURL}mobs/${enemy.imageKey}.png`}
              alt={enemy.name}
              style={{
                width: '64px',
                height: '64px',
                imageRendering: 'pixelated',
                borderRadius: '6px',
                border: '1px solid #705030',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).outerHTML = `<span style="font-size:40px">${enemy.emoji}</span>`;
              }}
            />
          ) : (
            <span style={{ fontSize: '40px' }}>{enemy.emoji}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '13px',
              color: enemy.elite ? '#ff5555' : '#ffd27f',
              textShadow: '0 0 4px #000',
              marginBottom: '4px',
            }}
          >
            {enemy.name}
          </div>
          <div
            style={{
              background: '#3a0000',
              borderRadius: '3px',
              height: '8px',
              boxShadow: 'inset 0 0 4px #000',
            }}
          >
            <div
              style={{
                width: `${hpPct}%`,
                background: enemy.elite
                  ? 'linear-gradient(90deg,#7f1d1d,#ef4444)'
                  : 'linear-gradient(90deg,#b91c1c,#f97373)',
                borderRadius: '3px',
                height: '100%',
                transition: 'width 0.2s',
              }}
            />
          </div>
          <div style={{ fontSize: '10px', color: '#c0c0c0', marginTop: '2px' }}>
            ❤️ {Math.max(0, enemy.currentHP)}/{enemy.maxHP} · ⚔️ {enemy.damage} damage
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #705030',
          margin: '6px 0',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img
          src={getCharacterSprite(rootURL, level)}
          alt="Character"
          style={{
            width: '36px',
            height: '36px',
            imageRendering: 'pixelated',
            borderRadius: '4px',
            border: '1px solid #705030',
            flexShrink: 0,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).outerHTML = '<span style="font-size:20px">🧙</span>';
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '11px',
              color: '#c79c6e',
              fontWeight: 600,
            }}
          >
            Level {level}
          </div>
          <div
            style={{
              background: '#3a0000',
              borderRadius: '3px',
              height: '5px',
              marginTop: '2px',
            }}
          >
            <div
              style={{
                width: `${charHpPct}%`,
                background: `linear-gradient(90deg,#7f1d1d,${hpColor})`,
                borderRadius: '3px',
                height: '100%',
                transition: 'width 0.2s',
              }}
            />
          </div>
          <div style={{ fontSize: '9px', color: hpColor, marginTop: '1px' }}>
            ❤️ {character.hp}/{character.maxHp}
          </div>
          <div
            style={{
              background: '#333',
              borderRadius: '3px',
              height: '4px',
              marginTop: '3px',
            }}
          >
            <div
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg,#503b9a,#8c63ff)',
                borderRadius: '3px',
                height: '100%',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ fontSize: '9px', color: '#777', marginTop: '1px' }}>
            ⚰️ {character.monstersDefeated} · 🥈 {character.silver} · 🥇 {character.gold}
          </div>
        </div>
      </div>
    </div>
  );
}

renderWidget(BattleOverlay);
