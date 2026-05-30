import React from 'react';
import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';
import {
  Theme,
  ThemeMode,
  DEFAULT_THEME_MODE,
  THEME_STORAGE_KEY,
  getTheme,
  getHpFill,
} from './theme';

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
  const [themeMode] = useSyncedStorageState<ThemeMode>(THEME_STORAGE_KEY, DEFAULT_THEME_MODE);
  const theme: Theme = getTheme(themeMode);

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
  const hpColor = getHpFill(theme, charHpPct);
  const restedLeft = Math.max(0, RESTED_XP_CARDS - character.restedXPUsed);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '10px 12px',
        boxSizing: 'border-box',
        background: theme.overlayBg,
      }}
    >
      <div
        style={{
          background: theme.overlayInner,
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          boxShadow: theme.overlayShadow,
          padding: '10px 14px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: theme.text,
          width: '100%',
          maxWidth: '620px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: 0,
            }}
          >
            <img
              src={getCharacterSprite(rootURL, level)}
              alt="Character"
              style={{
                width: '64px',
                height: '64px',
                imageRendering: 'pixelated',
                borderRadius: '6px',
                border: theme.imageBorder,
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).outerHTML =
                  '<span style="font-size:28px">🧙</span>';
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  color: theme.textAccent,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Lvl {level}
                {restedLeft > 0 && (
                  <span style={{ color: theme.mode === 'eink' ? theme.text : '#93c5fd', marginLeft: '8px', fontSize: '10px' }}>
                    💤 {restedLeft}
                  </span>
                )}
              </div>

              <div
                style={{
                  background: theme.hpTrack,
                  borderRadius: '4px',
                  height: '6px',
                  marginTop: '4px',
                  border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none',
                }}
              >
                <div
                  style={{
                    width: `${charHpPct}%`,
                    background: theme.mode === 'eink' ? hpColor : `linear-gradient(90deg,#7f1d1d,${hpColor})`,
                    borderRadius: '4px',
                    height: '100%',
                    transition: 'width 0.2s',
                  }}
                />
              </div>

              <div style={{ fontSize: '10px', color: hpColor, marginTop: '4px', fontWeight: theme.mode === 'eink' ? 700 : 400 }}>
                ❤️ {character.hp}/{character.maxHp}
              </div>

              <div
                style={{
                  background: theme.xpTrack,
                  borderRadius: '4px',
                  height: '6px',
                  marginTop: '5px',
                  border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none',
                }}
              >
                <div
                  style={{
                    width: `${xpPct}%`,
                    background: theme.xpFill,
                    borderRadius: '4px',
                    height: '100%',
                    transition: 'width 0.3s',
                  }}
                />
              </div>

              <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>
                🥈 {character.silver} · 🥇 {character.gold}
              </div>
            </div>
          </div>

          <div
            style={{
              width: '1px',
              alignSelf: 'stretch',
              background: theme.border,
              flexShrink: 0,
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: 0,
            }}
          >
            {enemy.imageKey ? (
              <img
                src={`${rootURL}mobs/${enemy.imageKey}.png`}
                alt={enemy.name}
                style={{
                  width: '64px',
                  height: '64px',
                  imageRendering: 'pixelated',
                  borderRadius: '6px',
                  border: theme.imageBorder,
                  flexShrink: 0,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).outerHTML =
                    `<span style="font-size:28px">${enemy.emoji}</span>`;
                }}
              />
            ) : (
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{enemy.emoji}</span>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '12px',
                  color: enemy.elite ? theme.textEnemyElite : theme.textEnemyNormal,
                  textShadow: theme.textShadow,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  textDecoration: theme.mode === 'eink' && enemy.elite ? 'underline' : 'none',
                }}
              >
                {enemy.elite && theme.mode === 'eink' ? '★ ' : ''}{enemy.name}
              </div>

              <div
                style={{
                  background: theme.mobHpTrack,
                  borderRadius: '4px',
                  height: '6px',
                  marginTop: '4px',
                  boxShadow: theme.insetShadow,
                  border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none',
                }}
              >
                <div
                  style={{
                    width: `${hpPct}%`,
                    background: enemy.elite ? theme.mobHpFillElite : theme.mobHpFillNormal,
                    borderRadius: '4px',
                    height: '100%',
                    transition: 'width 0.2s',
                  }}
                />
              </div>

              <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>
                ❤️ {Math.max(0, enemy.currentHP)}/{enemy.maxHP} · ⚔️ {enemy.damage} dmg
              </div>

              <div style={{ fontSize: '10px', color: theme.textSubtle, marginTop: '4px' }}>
                ⚰️ {character.monstersDefeated} kills · {enemy.zoneName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

renderWidget(BattleOverlay);
