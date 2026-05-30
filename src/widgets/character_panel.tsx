import React, { useState } from 'react';
import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';
import {
  Theme,
  ThemeMode,
  THEMES,
  DEFAULT_THEME_MODE,
  THEME_STORAGE_KEY,
  getTheme,
  getHpFill,
} from './theme';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  costSilver?: number;
  costGold?: number;
  type: 'heal_small' | 'heal_large' | 'xp_scroll' | 'dmg_scroll';
  value: number;
}

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

interface QuestState {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardSilver?: number;
  rewardGold?: number;
  rewardXP?: number;
  scope: 'daily' | 'weekly';
  createdAt: string;
}

interface QuestLogState {
  dailyDate: string;
  weeklyKey: string;
  dailies: QuestState[];
  weeklies: QuestState[];
  lastDailyTitles: string[];
  lastWeeklyTitles: string[];
}

type PanelTab = 'overview' | 'shop' | 'stats' | 'help';

const RESTED_XP_CARDS = 50;
const ELITE_EVERY = 7;

const SHOP_ITEMS: ShopItem[] = [
  { id: 'bandage', name: 'Bandage', description: '+10 HP', costSilver: 3, type: 'heal_small', value: 10 },
  { id: 'heal_small', name: 'Small Healing Potion', description: '+25 HP', costSilver: 6, type: 'heal_small', value: 25 },
  { id: 'heal_large', name: 'Large Healing Potion', description: '+60 HP', costGold: 2, type: 'heal_large', value: 60 },
  { id: 'xp_scroll', name: 'Scroll of Knowledge', description: '2× XP for 20 cards', costGold: 3, type: 'xp_scroll', value: 20 },
  { id: 'dmg_scroll', name: 'Scroll of Fury', description: '2× Damage for 10 cards', costGold: 2, type: 'dmg_scroll', value: 10 },
];

const defaultCharacter: CharacterState = {
  level: 1, currentXP: 0, totalXP: 0, cardsAnswered: 0,
  monstersDefeated: 0, elitesDefeated: 0, hp: 100, maxHp: 100,
  silver: 0, gold: 0, streakDays: 0, lastActiveDate: '',
  restedXPUsed: 0, activeScrollCards: 0, activeDamageCards: 0, goodStreak: 0,
};

const defaultEnemy: EnemyState = {
  id: '', name: 'Enter the queue…', emoji: '⚔️',
  maxHP: 1, currentHP: 1, elite: false,
  zoneId: 'elwynn', zoneName: 'Elwynn Forest', damage: 2,
};

function xpForLevel(level: number): number {
  const n = Math.max(1, Math.min(60, level));
  return Math.floor(100 * n * (1 + 0.1 * n));
}

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

function getNextMilestones(char: CharacterState): string[] {
  const msgs: string[] = [];
  const level = Math.max(1, Math.min(59, char.level));
  const xpNeeded = xpForLevel(level);
  const xpLeft = xpNeeded - char.currentXP;
  const estCards = Math.max(1, Math.ceil(xpLeft / 50));
  msgs.push(`⚔️ Level up in ~${estCards} cards`);
  const nextElite = ELITE_EVERY - (char.monstersDefeated % ELITE_EVERY || ELITE_EVERY);
  msgs.push(`⭐ Next elite in ${nextElite} kill${nextElite === 1 ? '' : 's'}`);
  const restedLeft = Math.max(0, RESTED_XP_CARDS - char.restedXPUsed);
  if (restedLeft > 0) msgs.push(`💤 Rested XP: ${restedLeft} cards`);
  if (char.activeScrollCards > 0) msgs.push(`📜 XP Scroll: ${char.activeScrollCards} cards`);
  if (char.activeDamageCards > 0) msgs.push(`💢 DMG Scroll: ${char.activeDamageCards} cards`);
  return msgs;
}

function questPercent(quest: QuestState): number {
  return Math.min(100, Math.round((quest.progress / Math.max(1, quest.target)) * 100));
}

function rewardLine(quest: QuestState): string {
  const bits: string[] = [];
  if (quest.rewardSilver) bits.push(`🥈 ${quest.rewardSilver}`);
  if (quest.rewardGold) bits.push(`🥇 ${quest.rewardGold}`);
  if (quest.rewardXP) bits.push(`✨ ${quest.rewardXP} XP`);
  return bits.join(' · ');
}

function tabButton(theme: Theme, active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '5px 4px',
    borderRadius: '5px',
    border: active ? `1px solid ${theme.tabActiveBorder}` : `1px solid ${theme.tabIdleBorder}`,
    background: active ? theme.tabActiveBg : theme.tabIdleBg,
    color: active ? theme.tabActiveText : theme.tabIdleText,
    fontSize: '9px',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; emoji: string; hint: string }[] = [
  { mode: 'dark',  label: 'Dark',  emoji: '🌙', hint: 'Original night theme' },
  { mode: 'light', label: 'Light', emoji: '☀️', hint: 'Parchment / daylight theme' },
  { mode: 'eink',  label: 'E-Ink', emoji: '📖', hint: 'High-contrast B/W for E-Ink readers' },
];

function ThemeSwitcher({
  theme,
  mode,
  onChange,
}: {
  theme: Theme;
  mode: ThemeMode;
  onChange: (m: ThemeMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}
    >
      {THEME_OPTIONS.map((opt) => {
        const active = opt.mode === mode;
        return (
          <button
            key={opt.mode}
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.mode)}
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              border: active
                ? `1px solid ${theme.tabActiveBorder}`
                : `1px solid ${theme.tabIdleBorder}`,
              background: active ? theme.tabActiveBg : theme.tabIdleBg,
              color: active ? theme.tabActiveText : theme.tabIdleText,
              fontSize: '11px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            <span aria-hidden="true">{opt.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

function CharacterPanel() {
  const plugin = usePlugin();
  const rootURL = plugin.rootURL ?? '';

  const [rawChar, setRawChar] = useSyncedStorageState<CharacterState>('character', defaultCharacter);
  const [enemyRaw] = useSyncedStorageState<EnemyState | null>('activeEnemy', null);
  const [questLogRaw] = useSyncedStorageState<QuestLogState | null>('questLog', null);
  const [themeMode, setThemeMode] = useSyncedStorageState<ThemeMode>(
    THEME_STORAGE_KEY,
    DEFAULT_THEME_MODE
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');

  const theme: Theme = getTheme(themeMode);
  const enemy: EnemyState = enemyRaw ? { ...defaultEnemy, ...enemyRaw } : { ...defaultEnemy };
  const character: CharacterState = { ...defaultCharacter, ...(rawChar ?? {}) };
  const questLog: QuestLogState = questLogRaw ?? { dailyDate: '', weeklyKey: '', dailies: [], weeklies: [], lastDailyTitles: [], lastWeeklyTitles: [] };

  const dailyQuest = questLog.dailies[0] ?? null;
  const weeklyQuest = questLog.weeklies[0] ?? null;

  const level = Math.max(1, Math.min(60, character.level));
  const xpNeeded = xpForLevel(Math.min(59, level));
  const xpPct = level >= 60 ? 100 : Math.min(100, xpNeeded > 0 ? Math.round((character.currentXP / xpNeeded) * 100) : 0);
  const hpPct = Math.min(100, character.maxHp > 0 ? Math.round((character.hp / character.maxHp) * 100) : 0);
  const mobHpPct = Math.min(100, enemy.maxHP > 0 ? Math.round((enemy.currentHP / enemy.maxHP) * 100) : 0);
  const hpColor = getHpFill(theme, hpPct);
  const milestones = getNextMilestones(character);

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setRawChar({ ...defaultCharacter });
    setActiveTab('overview');
    setConfirmReset(false);
  }

  function buyItem(shop: ShopItem) {
    if (!rawChar) return;
    const char: CharacterState = { ...defaultCharacter, ...(rawChar ?? {}) };
    if (shop.costSilver !== undefined && char.silver < shop.costSilver) return;
    if (shop.costGold !== undefined && char.gold < shop.costGold) return;
    if (shop.costSilver) char.silver -= shop.costSilver;
    if (shop.costGold) char.gold -= shop.costGold;
    if (shop.type === 'heal_small' || shop.type === 'heal_large') {
      char.hp = Math.min(char.maxHp, char.hp + shop.value);
    } else if (shop.type === 'xp_scroll') {
      char.activeScrollCards = (char.activeScrollCards ?? 0) + shop.value;
    } else if (shop.type === 'dmg_scroll') {
      char.activeDamageCards = (char.activeDamageCards ?? 0) + shop.value;
    }
    setRawChar(char);
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: theme.text, background: theme.panelBg, borderTop: theme.borderTopAccent, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px 6px', borderBottom: `1px solid ${theme.border}` }}>
        <img src={`${rootURL}ui/sidebar_icon.png`} alt="" style={{ width: '28px', height: '28px', imageRendering: 'pixelated', borderRadius: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: theme.textAccent, textShadow: theme.textShadow }}>⚔️ World of Remcraft</div>
          <div style={{ fontSize: '10px', color: theme.textMuted }}>{enemy.zoneName}</div>
        </div>
        <ThemeSwitcher theme={theme} mode={themeMode ?? DEFAULT_THEME_MODE} onChange={setThemeMode} />
      </div>

      <div style={{ padding: '10px 12px' }}>
        {/* Character bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <img src={getCharacterSprite(rootURL, level)} alt="Character" style={{ width: '64px', height: '64px', imageRendering: 'pixelated', borderRadius: '6px', border: theme.imageBorder }} onError={(e) => { (e.target as HTMLImageElement).outerHTML = '<span style="font-size:32px">🧙</span>'; }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.textAccent }}>Level {level}{level >= 60 ? ' (MAX)' : ''}</div>
            {character.streakDays > 1 && <div style={{ fontSize: '10px', color: theme.textStreak, fontWeight: theme.mode === 'eink' ? 700 : 400 }}>🔥 Streak: {character.streakDays} days</div>}
            <div style={{ fontSize: '10px', color: theme.textMuted }}>{character.cardsAnswered} cards · {character.totalXP} XP</div>
            <div style={{ marginTop: '3px', background: theme.xpTrack, borderRadius: '3px', height: '7px', border: `1px solid ${theme.border}`, boxShadow: theme.insetShadow }}>
              <div style={{ width: `${xpPct}%`, background: theme.xpFill, borderRadius: '2px', height: '100%', transition: 'width 0.25s' }} />
            </div>
            <div style={{ fontSize: '9px', color: theme.textSubtle, marginTop: '1px' }}>{level < 60 ? `${character.currentXP} / ${xpNeeded} XP` : 'Max level reached!'}</div>
          </div>
        </div>

        {/* HP bar */}
        <div style={{ marginBottom: '8px', padding: '6px 8px', background: theme.surface, borderRadius: '6px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.textMuted, marginBottom: '3px' }}>
            <span>❤️ Health</span>
            <span style={{ color: hpColor, fontWeight: theme.mode === 'eink' ? 700 : 400 }}>{character.hp} / {character.maxHp}</span>
          </div>
          <div style={{ background: theme.hpTrack, borderRadius: '3px', height: '7px', boxShadow: theme.insetShadow, border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none' }}>
            <div style={{ width: `${hpPct}%`, background: theme.mode === 'eink' ? hpColor : `linear-gradient(90deg, #7f1d1d, ${hpColor})`, borderRadius: '3px', height: '100%', transition: 'width 0.2s' }} />
          </div>
        </div>

        {/* Currency */}
        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', marginBottom: '8px', flexWrap: 'wrap', color: theme.text }}>
          <span>🥈 {character.silver}</span>
          <span style={{ color: theme.textGold, fontWeight: theme.mode === 'eink' ? 700 : 400 }}>🥇 {character.gold}</span>
          {character.activeScrollCards > 0 && <span style={{ color: theme.mode === 'eink' ? theme.text : '#60a5fa' }}>📜 XP×{character.activeScrollCards}</span>}
          {character.activeDamageCards > 0 && <span style={{ color: theme.mode === 'eink' ? theme.text : '#f97373' }}>💢 DMG×{character.activeDamageCards}</span>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button onClick={() => setActiveTab('overview')} style={tabButton(theme, activeTab === 'overview')}>Overview</button>
          <button onClick={() => setActiveTab('shop')} style={tabButton(theme, activeTab === 'shop')}>Shop</button>
          <button onClick={() => setActiveTab('stats')} style={tabButton(theme, activeTab === 'stats')}>Stats</button>
          <button onClick={() => setActiveTab('help')} style={tabButton(theme, activeTab === 'help')}>Help</button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Enemy */}
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '8px', background: theme.surface, marginBottom: '8px', boxShadow: theme.cardShadow }}>
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                {enemy.imageKey ? (
                  <img src={`${rootURL}mobs/${enemy.imageKey}.png`} alt={enemy.name} style={{ width: '64px', height: '64px', imageRendering: 'pixelated', borderRadius: '4px' }} onError={(e) => { (e.target as HTMLImageElement).outerHTML = `<span style="font-size:40px">${enemy.emoji}</span>`; }} />
                ) : <span style={{ fontSize: '40px' }}>{enemy.emoji}</span>}
              </div>
              <div style={{ fontWeight: 700, textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: enemy.elite ? theme.textEnemyElite : theme.textEnemyNormal, textShadow: theme.textShadow, textDecoration: theme.mode === 'eink' && enemy.elite ? 'underline' : 'none' }}>{enemy.elite && theme.mode === 'eink' ? '★ ' : ''}{enemy.name}</div>
              <div style={{ background: theme.mobHpTrack, borderRadius: '4px', height: '7px', boxShadow: theme.insetShadow, border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ width: `${mobHpPct}%`, background: enemy.elite ? theme.mobHpFillElite : theme.mobHpFillNormal, borderRadius: '3px', height: '100%', transition: 'width 0.2s' }} />
              </div>
              <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px', textAlign: 'center' }}>❤️ {Math.max(0, enemy.currentHP)} / {enemy.maxHP} · ⚔️ {enemy.damage} dmg/round</div>
            </div>

            {/* Milestones */}
            <div style={{ marginBottom: '8px', padding: '6px 8px', background: theme.surface, borderRadius: '6px', border: `1px solid ${theme.borderHelp}` }}>
              <div style={{ fontSize: '10px', color: theme.textAccent, fontWeight: 600, marginBottom: '3px' }}>Next goals</div>
              {milestones.map((m, i) => <div key={i} style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '1px' }}>{m}</div>)}
            </div>

            {/* Daily quest */}
            <div style={{ padding: '8px', background: theme.surfaceQuest, borderRadius: '8px', border: `1px solid ${theme.borderQuest}`, marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: theme.textEnemyNormal, fontWeight: 700, marginBottom: '6px' }}>Active Daily Quest</div>
              {!dailyQuest ? <div style={{ fontSize: '9px', color: theme.textSubtle }}>No daily quest loaded yet.</div> : (
                <div>
                  <div style={{ fontSize: '10px', color: dailyQuest.completed ? theme.textQuestDone : theme.textQuestActive, fontWeight: 700 }}>{dailyQuest.completed ? '✅ ' : '❓ '}{dailyQuest.title}</div>
                  <div style={{ fontSize: '9px', color: theme.textMuted, marginTop: '2px', marginBottom: '4px' }}>{dailyQuest.description}</div>
                  <div style={{ background: theme.questBarTrack, borderRadius: '4px', height: '8px', overflow: 'hidden', border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none' }}>
                    <div style={{ width: `${questPercent(dailyQuest)}%`, height: '100%', background: dailyQuest.completed ? theme.questBarFillDone : theme.questBarFillActive }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '9px', color: theme.textSubtle }}>
                    <span>{dailyQuest.progress}/{dailyQuest.target}</span>
                    <span>{rewardLine(dailyQuest)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly quest */}
            <div style={{ padding: '8px', background: theme.surfaceQuestWeekly, borderRadius: '8px', border: `1px solid ${theme.borderQuestWeekly}`, marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: theme.textQuestWeekly, fontWeight: 700, marginBottom: '6px' }}>Active Weekly Quest</div>
              {!weeklyQuest ? <div style={{ fontSize: '9px', color: theme.textSubtle }}>No weekly quest loaded yet.</div> : (
                <div>
                  <div style={{ fontSize: '10px', color: weeklyQuest.completed ? theme.textQuestDone : theme.textQuestActive, fontWeight: 700 }}>{weeklyQuest.completed ? '✅ ' : '❓ '}{weeklyQuest.title}</div>
                  <div style={{ fontSize: '9px', color: theme.textMuted, marginTop: '2px', marginBottom: '4px' }}>{weeklyQuest.description}</div>
                  <div style={{ background: theme.questBarTrack, borderRadius: '4px', height: '8px', overflow: 'hidden', border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none' }}>
                    <div style={{ width: `${questPercent(weeklyQuest)}%`, height: '100%', background: weeklyQuest.completed ? theme.questBarFillDone : theme.questBarFillWeeklyActive }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '9px', color: theme.textSubtle }}>
                    <span>{weeklyQuest.progress}/{weeklyQuest.target}</span>
                    <span>{rewardLine(weeklyQuest)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div style={{ padding: '8px', background: theme.surfaceShop, borderRadius: '8px', border: `1px solid ${theme.borderShop}`, marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: theme.textShop, fontWeight: 700, marginBottom: '6px' }}>🏪 Shop</div>
            <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '8px' }}>Buy healing or scrolls to boost your run.</div>
            {SHOP_ITEMS.map((shop) => {
              const canAfford = shop.costSilver !== undefined ? character.silver >= shop.costSilver : character.gold >= (shop.costGold ?? 0);
              const costLabel = shop.costSilver !== undefined ? `🥈 ${shop.costSilver}` : `🥇 ${shop.costGold}`;
              return (
                <div key={shop.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '6px 0', borderBottom: `1px solid ${theme.divider}` }}>
                  <div style={{ paddingRight: '8px' }}>
                    <div style={{ fontSize: '10px', color: theme.text, fontWeight: 600 }}>{shop.name}</div>
                    <div style={{ fontSize: '9px', color: theme.textMuted }}>{shop.description}</div>
                  </div>
                  <button onClick={() => buyItem(shop)} disabled={!canAfford} style={{ fontSize: '9px', padding: '4px 8px', borderRadius: '4px', border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none', cursor: canAfford ? 'pointer' : 'not-allowed', background: canAfford ? theme.buyBg : theme.buyDisabledBg, color: canAfford ? theme.buyText : theme.buyDisabledText, minWidth: '58px', fontWeight: theme.mode === 'eink' ? 700 : 400 }}>
                    {costLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div style={{ padding: '8px', background: theme.surfaceStats, borderRadius: '8px', border: `1px solid ${theme.borderStats}`, marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: theme.textStats, fontWeight: 700, marginBottom: '6px' }}>📊 Statistics</div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {[
                { label: '🧟 Enemies defeated', value: character.monstersDefeated },
                { label: '🏆 Elites defeated', value: character.elitesDefeated },
                { label: '📚 Cards answered', value: character.cardsAnswered },
                { label: '✨ Total XP', value: character.totalXP.toLocaleString() },
                { label: '🔥 Current streak', value: `${character.streakDays} days` },
              ].map((s) => (
                <div key={s.label} style={{ padding: '6px 8px', background: theme.surface, borderRadius: '6px', border: `1px solid ${theme.borderStats}` }}>
                  <div style={{ fontSize: '9px', color: theme.textSubtle }}>{s.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HELP TAB */}
        {activeTab === 'help' && (
          <div style={{ padding: '8px', background: theme.surfaceHelp, borderRadius: '8px', border: `1px solid ${theme.borderHelp}`, marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: theme.textHelp, fontWeight: 700, marginBottom: '6px' }}>📖 Quick Guide</div>
            <div style={{ display: 'grid', gap: '4px', fontSize: '9px', color: theme.textHelpBody, lineHeight: '1.45' }}>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>⚔️ Fight:</span> each reviewed card deals 1 damage.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>✅ Good/Easy:</span> full XP, no damage taken.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>🟡 Hard:</span> 40% XP, take normal enemy damage.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>❌ Again:</span> no XP, take double damage.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>💥 Crit:</span> 5 Good/Easy in a row = next hit deals 2× damage.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>⭐ Elites:</span> every 7th kill, stronger enemy, rewards gold.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>💤 Rested:</span> first 50 daily cards give 2× XP.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>🔥 Streak:</span> study daily; dying resets streak and sets HP to 20.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>🏪 Shop:</span> silver = healing, gold = big items and scrolls.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>📜 Scrolls:</span> XP Scroll = 20 cards, Damage Scroll = 10 cards.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>🗺️ Quests:</span> 1 daily + 1 weekly active at all times.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>🌍 Zones:</span> level up to move through Azeroth zones.</div>
              <div><span style={{ color: theme.textEnemyNormal, fontWeight: 700 }}>🎨 Theme:</span> use the icons in the header to switch dark, light or E-Ink mode.</div>
            </div>
          </div>
        )}

        {/* Reset */}
        <button onClick={handleReset} style={{ width: '100%', padding: '6px', borderRadius: '5px', border: theme.mode === 'eink' ? `1px solid ${theme.border}` : 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, background: confirmReset ? theme.resetConfirmBg : theme.resetIdleBg, color: confirmReset ? theme.resetConfirmText : theme.resetIdleText, transition: 'all 0.2s' }}>
          {confirmReset ? '⚠️ Really reset? (click again)' : '🔄 Reset character'}
        </button>
      </div>
    </div>
  );
}

renderWidget(CharacterPanel);
