import {
  declareIndexPlugin,
  ReactRNPlugin,
  WidgetLocation,
  AppEvents,
  QueueInteractionScore,
} from '@remnote/plugin-sdk';

interface CharacterState {
  level: number;
  currentXP: number;
  totalXP: number;
  cardsAnswered: number;
  monstersDefeated: number;
  elitesDefeated: number;
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

interface ZoneMob {
  name: string;
  emoji: string;
  imageKey?: string;
}

interface ZoneConfig {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  normalMobs: ZoneMob[];
  eliteMobs: ZoneMob[];
}

type QuestType =
  | 'reviews_total'
  | 'good_easy_total'
  | 'kill_total'
  | 'elite_total'
  | 'streak_days'
  | 'no_again_total'
  | 'silver_total'
  | 'gold_total'
  | 'hard_total'
  | 'take_damage_total'
  | 'spend_silver_total'
  | 'spend_gold_total'
  | 'use_xp_scroll_total'
  | 'use_dmg_scroll_total'
  | 'critical_hits_total';

interface QuestState {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  progress: number;
  completed: boolean;
  rewardSilver?: number;
  rewardGold?: number;
  rewardXP?: number;
  scope: 'daily' | 'weekly';
  createdAt: string;
}

interface QuestTemplate {
  title: string;
  description: string;
  type: QuestType;
  target: number;
  rewardSilver?: number;
  rewardGold?: number;
  rewardXP?: number;
}

interface QuestLogState {
  dailyDate: string;
  weeklyKey: string;
  dailies: QuestState[];
  weeklies: QuestState[];
  lastDailyTitles: string[];
  lastWeeklyTitles: string[];
}

const RESTED_XP_CARDS = 50;
const RESTED_XP_MULTIPLIER = 2;
const ELITE_EVERY = 7;
const QUEST_HISTORY_LIMIT = 5;

const ZONES: ZoneConfig[] = [
  {
    id: 'elwynn',
    name: 'Elwynn Forest',
    minLevel: 1,
    maxLevel: 10,
    normalMobs: [
      { name: 'Defias Thug', emoji: '🗡️', imageKey: 'elwynn_normal_1' },
      { name: 'Defias Bandit', emoji: '🗡️', imageKey: 'elwynn_normal_2' },
      { name: 'Kobold Tunneler', emoji: '⛏️', imageKey: 'elwynn_normal_3' },
      { name: 'Kobold Laborer', emoji: '🪓', imageKey: 'elwynn_normal_4' },
      { name: 'Forest Wolf', emoji: '🐺', imageKey: 'elwynn_normal_5' },
      { name: 'Young Forest Bear', emoji: '🐻', imageKey: 'elwynn_normal_6' },
      { name: 'Rogue Wizard', emoji: '🧙', imageKey: 'elwynn_normal_7' },
    ],
    eliteMobs: [
      { name: 'Hogger', emoji: '🐺', imageKey: 'elwynn_elite_hogger' },
      { name: 'Yowler', emoji: '🐺', imageKey: 'elwynn_elite_yowler' },
      { name: 'Gruff Swiftbite', emoji: '🐺', imageKey: 'elwynn_elite_gruff' },
    ],
  },
  {
    id: 'westfall',
    name: 'Westfall',
    minLevel: 10,
    maxLevel: 20,
    normalMobs: [
      { name: 'Defias Highwayman', emoji: '🗡️', imageKey: 'westfall_normal_1' },
      { name: 'Defias Pillager', emoji: '🔥', imageKey: 'westfall_normal_2' },
      { name: 'Harvest Watcher', emoji: '🤖', imageKey: 'westfall_normal_3' },
      { name: 'Harvest Golem', emoji: '🤖', imageKey: 'westfall_normal_4' },
      { name: 'Goretusk', emoji: '🐗', imageKey: 'westfall_normal_5' },
      { name: 'Coyote', emoji: '🐺', imageKey: 'westfall_normal_6' },
    ],
    eliteMobs: [
      { name: 'Edwin VanCleef', emoji: '💀', imageKey: 'westfall_elite_vancleef' },
      { name: 'Captain Greenskin', emoji: '⚓', imageKey: 'westfall_elite_greenskin' },
      { name: 'Mr. Smite', emoji: '🔨', imageKey: 'westfall_elite_smite' },
    ],
  },
  {
    id: 'redridge',
    name: 'Redridge Mountains',
    minLevel: 20,
    maxLevel: 25,
    normalMobs: [
      { name: 'Redridge Mongrel', emoji: '🐺', imageKey: 'redridge_normal_1' },
      { name: 'Redridge Brute', emoji: '💪', imageKey: 'redridge_normal_2' },
      { name: 'Blackrock Outrunner', emoji: '🧌', imageKey: 'redridge_normal_3' },
      { name: 'Blackrock Renegade', emoji: '🧌', imageKey: 'redridge_normal_4' },
      { name: 'Murloc Flesheater', emoji: '🐟', imageKey: 'redridge_normal_5' },
      { name: 'Dire Condor', emoji: '🦅', imageKey: 'redridge_normal_6' },
      { name: 'Tarantula', emoji: '🕷️', imageKey: 'redridge_normal_7' },
    ],
    eliteMobs: [
      { name: 'Bellygrub', emoji: '🐷', imageKey: 'redridge_elite_bellygrub' },
      { name: 'Rohh the Silent', emoji: '🗡️', imageKey: 'redridge_elite_rohh' },
      { name: 'Seeker Aqualon', emoji: '💧', imageKey: 'redridge_elite_aqualon' },
    ],
  },
  {
    id: 'duskwood',
    name: 'Duskwood',
    minLevel: 25,
    maxLevel: 30,
    normalMobs: [
      { name: 'Rotting Dead', emoji: '🧟', imageKey: 'duskwood_normal_1' },
      { name: 'Skeletal Warrior', emoji: '💀', imageKey: 'duskwood_normal_2' },
      { name: 'Skeletal Mage', emoji: '🧙', imageKey: 'duskwood_normal_3' },
      { name: 'Nightbane Worgen', emoji: '🐺', imageKey: 'duskwood_normal_4' },
      { name: 'Plague Spreader', emoji: '🧟', imageKey: 'duskwood_normal_5' },
      { name: 'Black Widow', emoji: '🕷️', imageKey: 'duskwood_normal_6' },
    ],
    eliteMobs: [
      { name: 'Stitches', emoji: '🧟', imageKey: 'duskwood_elite_stitches' },
      { name: "Mor'Ladim", emoji: '⚔️', imageKey: 'duskwood_elite_morladim' },
      { name: 'Eliza', emoji: '⚰️', imageKey: 'duskwood_elite_eliza' },
    ],
  },
  {
    id: 'stv_north',
    name: 'Stranglethorn Vale (North)',
    minLevel: 30,
    maxLevel: 35,
    normalMobs: [
      { name: 'Stranglethorn Tiger', emoji: '🐯', imageKey: 'stv_north_normal_1' },
      { name: 'Young Panther', emoji: '🐆', imageKey: 'stv_north_normal_2' },
      { name: 'Kurzen Jungle Fighter', emoji: '🪖', imageKey: 'stv_north_normal_3' },
      { name: 'Kurzen Medicine Man', emoji: '🧙', imageKey: 'stv_north_normal_4' },
      { name: 'Lashtail Raptor', emoji: '🦎', imageKey: 'stv_north_normal_5' },
      { name: 'Snapjaw Crocolisk', emoji: '🐊', imageKey: 'stv_north_normal_6' },
    ],
    eliteMobs: [
      { name: "Sin'Dall", emoji: '🦁', imageKey: 'stv_north_elite_sindall' },
      { name: 'King Bangalash', emoji: '👑', imageKey: 'stv_north_elite_bangalash' },
      { name: 'Tethis', emoji: '🐯', imageKey: 'stv_north_elite_tethis' },
    ],
  },
  {
    id: 'stv_south',
    name: 'Stranglethorn Vale (South)',
    minLevel: 35,
    maxLevel: 45,
    normalMobs: [
      { name: 'Bloodsail Swashbuckler', emoji: '🏴\u200d☠️', imageKey: 'stv_south_normal_1' },
      { name: 'Bloodsail Raider', emoji: '🏴\u200d☠️', imageKey: 'stv_south_normal_2' },
      { name: 'Venture Co. Mercenary', emoji: '💼', imageKey: 'stv_south_normal_3' },
      { name: 'Jungle Stalker', emoji: '🦖', imageKey: 'stv_south_normal_4' },
      { name: 'Elder Saltwater Crocolisk', emoji: '🐊', imageKey: 'stv_south_normal_5' },
      { name: 'Shadowmaw Panther', emoji: '🐆', imageKey: 'stv_south_normal_6' },
    ],
    eliteMobs: [
      { name: 'King Mukla', emoji: '🦍', imageKey: 'stv_south_elite_mukla' },
      { name: 'Najak Hexxen', emoji: '🧙\u200d♂️', imageKey: 'stv_south_elite_najak' },
      { name: 'Rippa', emoji: '🦖', imageKey: 'stv_south_elite_rippa' },
    ],
  },
  {
    id: 'tanaris',
    name: 'Tanaris',
    minLevel: 45,
    maxLevel: 50,
    normalMobs: [
      { name: 'Sandfury Scout', emoji: '🗿', imageKey: 'tanaris_normal_1' },
      { name: 'Sandfury Shadowhunter', emoji: '🏹', imageKey: 'tanaris_normal_2' },
      { name: 'Wastewander Rogue', emoji: '🧌', imageKey: 'tanaris_normal_3' },
      { name: 'Wastewander Assassin', emoji: '🗡️', imageKey: 'tanaris_normal_4' },
      { name: 'Dunemaul Ogre', emoji: '💪', imageKey: 'tanaris_normal_5' },
      { name: 'Scorpid Dunestalker', emoji: '🦂', imageKey: 'tanaris_normal_6' },
    ],
    eliteMobs: [
      { name: "Gahz'rilla", emoji: '🐊', imageKey: 'tanaris_elite_gahzrilla' },
      { name: 'Ukorz Sandscalp', emoji: '👑', imageKey: 'tanaris_elite_ukorz' },
      { name: 'Chief Engineer Bilgewhizzle', emoji: '⚙️', imageKey: 'tanaris_elite_bilge' },
    ],
  },
  {
    id: 'ungoro',
    name: "Un'Goro Crater",
    minLevel: 50,
    maxLevel: 55,
    normalMobs: [
      { name: 'Devilsaur', emoji: '🦖', imageKey: 'ungoro_normal_1' },
      { name: 'Tyrant Devilsaur', emoji: '🦖', imageKey: 'ungoro_normal_2' },
      { name: 'Ravasaur', emoji: '🦎', imageKey: 'ungoro_normal_3' },
      { name: 'Pterrordax', emoji: '🦅', imageKey: 'ungoro_normal_4' },
      { name: 'Tar Beast', emoji: '🟤', imageKey: 'ungoro_normal_5' },
      { name: "Un'Goro Gorilla", emoji: '🦍', imageKey: 'ungoro_normal_6' },
    ],
    eliteMobs: [
      { name: 'King Mosh', emoji: '👑', imageKey: 'ungoro_elite_mosh' },
      { name: 'Devilsaur Queen', emoji: '👑', imageKey: 'ungoro_elite_queen' },
      { name: "U'cha", emoji: '🐵', imageKey: 'ungoro_elite_ucha' },
    ],
  },
  {
    id: 'epl',
    name: 'Eastern Plaguelands',
    minLevel: 55,
    maxLevel: 60,
    normalMobs: [
      { name: 'Plaguehound', emoji: '🐕', imageKey: 'epl_normal_1' },
      { name: 'Carrion Grub', emoji: '🪱', imageKey: 'epl_normal_2' },
      { name: 'Crusader Spectre', emoji: '👻', imageKey: 'epl_normal_3' },
      { name: 'Scarlet Paladin', emoji: '⚔️', imageKey: 'epl_normal_4' },
      { name: 'Gibbering Ghoul', emoji: '🧟', imageKey: 'epl_normal_5' },
      { name: 'Diseased Flayer', emoji: '🧟', imageKey: 'epl_normal_6' },
    ],
    eliteMobs: [
      { name: 'Lord Aurius Rivendare', emoji: '💀', imageKey: 'epl_elite_rivendare' },
      { name: 'Baron Bloodbane', emoji: '🩸', imageKey: 'epl_elite_bloodbane' },
      { name: "Hed'mush the Rotting", emoji: '🧟', imageKey: 'epl_elite_hedmush' },
      { name: "Zul'Brin Warpbranch", emoji: '🧙\u200d♂️', imageKey: 'epl_elite_zulbrin' },
    ],
  },
];

const DAILY_QUEST_POOL: QuestTemplate[] = [
  { title: 'First Patrol', description: 'Answer 20 cards.', type: 'reviews_total', target: 20, rewardSilver: 8, rewardXP: 80 },
  { title: 'Long Session', description: 'Answer 35 cards.', type: 'reviews_total', target: 35, rewardSilver: 12, rewardXP: 120 },
  { title: 'Clean Hits', description: 'Get 12 Good/Easy answers.', type: 'good_easy_total', target: 12, rewardSilver: 10, rewardXP: 100 },
  { title: 'Steady Run', description: 'Complete 18 answers without Again.', type: 'no_again_total', target: 18, rewardSilver: 10, rewardXP: 100 },
  { title: 'Forest Hunter', description: 'Defeat 4 enemies.', type: 'kill_total', target: 4, rewardSilver: 6, rewardXP: 70 },
  { title: 'Bounty Hunter', description: 'Defeat 6 enemies.', type: 'kill_total', target: 6, rewardSilver: 9, rewardXP: 90 },
  { title: 'Hard Lesson', description: 'Complete 8 Hard answers.', type: 'hard_total', target: 8, rewardSilver: 8, rewardXP: 80 },
  { title: 'Critical Chain', description: 'Land 2 critical hits.', type: 'critical_hits_total', target: 2, rewardSilver: 7, rewardXP: 90 },
  { title: 'Silver Purse', description: 'Collect 8 silver.', type: 'silver_total', target: 8, rewardSilver: 4, rewardXP: 60 },
  { title: 'Gold Seeker', description: 'Loot 1 gold.', type: 'gold_total', target: 1, rewardSilver: 5, rewardGold: 1, rewardXP: 80 },
  { title: 'Thirst for Knowledge', description: 'Use 1 XP scroll.', type: 'use_xp_scroll_total', target: 1, rewardSilver: 5, rewardXP: 70 },
  { title: 'Battle Hunger', description: 'Use 1 damage scroll.', type: 'use_dmg_scroll_total', target: 1, rewardSilver: 5, rewardXP: 70 },
  { title: 'Camp Expenses', description: 'Spend 8 silver in the shop.', type: 'spend_silver_total', target: 8, rewardSilver: 5, rewardXP: 60 },
];

const WEEKLY_QUEST_POOL: QuestTemplate[] = [
  { title: 'Hero of the Week', description: 'Answer 120 cards.', type: 'reviews_total', target: 120, rewardSilver: 30, rewardGold: 2, rewardXP: 280 },
  { title: 'Marathon', description: 'Answer 180 cards.', type: 'reviews_total', target: 180, rewardSilver: 34, rewardGold: 3, rewardXP: 320 },
  { title: 'Consistency', description: 'Get 90 Good/Easy answers.', type: 'good_easy_total', target: 90, rewardSilver: 28, rewardGold: 2, rewardXP: 260 },
  { title: 'No Missteps', description: 'Complete 70 answers without Again.', type: 'no_again_total', target: 70, rewardSilver: 28, rewardGold: 2, rewardXP: 260 },
  { title: 'Elite Hunter', description: 'Defeat 4 elite enemies.', type: 'elite_total', target: 4, rewardSilver: 20, rewardGold: 3, rewardXP: 300 },
  { title: 'Monster Hunter', description: 'Defeat 24 enemies.', type: 'kill_total', target: 24, rewardSilver: 25, rewardGold: 2, rewardXP: 250 },
  { title: 'Shop Veteran', description: 'Spend 30 silver in the shop.', type: 'spend_silver_total', target: 30, rewardSilver: 30, rewardGold: 2, rewardXP: 290 },
  { title: 'Arcane Stockpile', description: 'Use 2 XP scrolls.', type: 'use_xp_scroll_total', target: 2, rewardSilver: 20, rewardGold: 2, rewardXP: 240 },
  { title: 'Berserker Week', description: 'Use 2 damage scrolls.', type: 'use_dmg_scroll_total', target: 2, rewardSilver: 20, rewardGold: 2, rewardXP: 240 },
  { title: 'Gold Reserve', description: 'Loot 5 gold.', type: 'gold_total', target: 5, rewardSilver: 15, rewardGold: 3, rewardXP: 270 },
  { title: 'Hard Training', description: 'Complete 30 Hard answers.', type: 'hard_total', target: 30, rewardSilver: 24, rewardGold: 1, rewardXP: 230 },
  { title: 'Critical Style', description: 'Land 8 critical hits.', type: 'critical_hits_total', target: 8, rewardSilver: 26, rewardGold: 2, rewardXP: 260 },
];

function getZoneForLevel(level: number): ZoneConfig {
  const c = Math.max(1, Math.min(60, level));
  return ZONES.find((z) => c >= z.minLevel && c <= z.maxLevel) ?? ZONES[ZONES.length - 1];
}

function xpForLevel(level: number): number {
  const n = Math.max(1, Math.min(60, level));
  return Math.floor(100 * n * (1 + 0.1 * n));
}

function computeZone(level: number): ZoneConfig {
  return getZoneForLevel(level);
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

function generateEnemy(playerLevel: number, elite: boolean, zone?: ZoneConfig): EnemyState {
  const z = zone ?? computeZone(playerLevel);
  const pool = elite && z.eliteMobs.length > 0 ? z.eliteMobs : z.normalMobs;
  const base = pool[Math.floor(Math.random() * pool.length)];
  const lvl = Math.max(1, playerLevel);
  const maxHP = elite
    ? 15 + Math.floor(lvl * 1.5 + Math.random() * 10)
    : 5 + Math.floor(lvl * 0.7 + Math.random() * 6);
  const dmgMin = elite ? 5 : 2;
  const dmgMax = elite ? Math.min(12, 4 + Math.floor(lvl * 0.15)) : Math.min(6, 2 + Math.floor(lvl * 0.08));
  const damage = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin + 1));
  return {
    id: `${z.id}_${elite ? 'elite' : 'mob'}_${Date.now()}`,
    name: elite ? `${base.name} (Elite)` : base.name,
    emoji: base.emoji,
    maxHP,
    currentHP: maxHP,
    elite,
    zoneId: z.id,
    zoneName: z.name,
    imageKey: base.imageKey,
    damage,
  };
}

function pickQuest(pool: QuestTemplate[], history: string[], scope: 'daily' | 'weekly'): QuestState {
  const recent = new Set(history.slice(-QUEST_HISTORY_LIMIT));
  const candidates = pool.filter((q) => !recent.has(q.title));
  const template = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `${scope}_${template.title.replace(/\s+/g, '_')}_${Date.now()}`,
    title: template.title,
    description: template.description,
    type: template.type,
    target: template.target,
    progress: 0,
    completed: false,
    rewardSilver: template.rewardSilver,
    rewardGold: template.rewardGold,
    rewardXP: template.rewardXP,
    scope,
    createdAt: getTodayISO(),
  };
}

function pushQuestHistory(history: string[], title: string): string[] {
  return [...history, title].slice(-QUEST_HISTORY_LIMIT * 2);
}

function getDefaultQuestLog(): QuestLogState {
  const today = getTodayISO();
  const weekKey = getWeekKey();
  const daily = pickQuest(DAILY_QUEST_POOL, [], 'daily');
  const weekly = pickQuest(WEEKLY_QUEST_POOL, [], 'weekly');
  return {
    dailyDate: today,
    weeklyKey: weekKey,
    dailies: [daily],
    weeklies: [weekly],
    lastDailyTitles: [daily.title],
    lastWeeklyTitles: [weekly.title],
  };
}

function normalizeQuestList(quests: QuestState[] | undefined, scope: 'daily' | 'weekly'): QuestState[] {
  if (!quests || quests.length === 0) return [];
  const first = quests[0];
  return [{ ...first, scope }];
}

function ensureQuestLog(raw: Partial<QuestLogState> | undefined): QuestLogState {
  const today = getTodayISO();
  const weekKey = getWeekKey();
  let result: QuestLogState = raw
    ? {
        dailyDate: raw.dailyDate ?? today,
        weeklyKey: raw.weeklyKey ?? weekKey,
        dailies: normalizeQuestList(raw.dailies, 'daily'),
        weeklies: normalizeQuestList(raw.weeklies, 'weekly'),
        lastDailyTitles: raw.lastDailyTitles ?? [],
        lastWeeklyTitles: raw.lastWeeklyTitles ?? [],
      }
    : getDefaultQuestLog();

  if (result.dailies.length === 0) {
    const quest = pickQuest(DAILY_QUEST_POOL, result.lastDailyTitles, 'daily');
    result.dailies = [quest];
    result.lastDailyTitles = pushQuestHistory(result.lastDailyTitles, quest.title);
  }

  if (result.weeklies.length === 0) {
    const quest = pickQuest(WEEKLY_QUEST_POOL, result.lastWeeklyTitles, 'weekly');
    result.weeklies = [quest];
    result.lastWeeklyTitles = pushQuestHistory(result.lastWeeklyTitles, quest.title);
  }

  if (result.dailyDate !== today) {
    const quest = pickQuest(DAILY_QUEST_POOL, result.lastDailyTitles, 'daily');
    result.dailyDate = today;
    result.dailies = [quest];
    result.lastDailyTitles = pushQuestHistory(result.lastDailyTitles, quest.title);
  }

  if (result.weeklyKey !== weekKey) {
    const quest = pickQuest(WEEKLY_QUEST_POOL, result.lastWeeklyTitles, 'weekly');
    result.weeklyKey = weekKey;
    result.weeklies = [quest];
    result.lastWeeklyTitles = pushQuestHistory(result.lastWeeklyTitles, quest.title);
  }

  return result;
}

function applyQuestProgress(quests: QuestState[], type: QuestType, amount: number) {
  for (const quest of quests) {
    if (quest.completed) continue;
    if (quest.type !== type) continue;
    quest.progress = Math.min(quest.target, quest.progress + amount);
    if (quest.progress >= quest.target) {
      quest.completed = true;
    }
  }
}

async function settleCompletedQuests(
  plugin: ReactRNPlugin,
  char: CharacterState,
  questLog: QuestLogState
) {
  const allQuests = [...questLog.dailies, ...questLog.weeklies];
  const rawClaimed = (await plugin.storage.getSynced('claimedQuestRewards')) as Record<string, boolean> | undefined;
  const claimed = rawClaimed ?? {};
  let changed = false;

  for (const quest of allQuests) {
    if (!quest.completed || claimed[quest.id]) continue;

    char.silver += quest.rewardSilver ?? 0;
    char.gold += quest.rewardGold ?? 0;
    char.totalXP += quest.rewardXP ?? 0;
    if (char.level < 60) {
      char.currentXP += quest.rewardXP ?? 0;
    }

    claimed[quest.id] = true;
    changed = true;
    await plugin.app.toast(`✅ Quest completed: ${quest.title}`);

    if (quest.scope === 'daily') {
      const nextQuest = pickQuest(DAILY_QUEST_POOL, questLog.lastDailyTitles, 'daily');
      questLog.dailies = [nextQuest];
      questLog.lastDailyTitles = pushQuestHistory(questLog.lastDailyTitles, nextQuest.title);
      await plugin.app.toast(`🗺️ New daily quest: ${nextQuest.title}`);
    }
  }

  if (changed) {
    await plugin.storage.setSynced('claimedQuestRewards', claimed);
  }
}

const defaultCharacter: CharacterState = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  cardsAnswered: 0,
  monstersDefeated: 0,
  elitesDefeated: 0,
  silver: 0,
  gold: 0,
  streakDays: 0,
  lastActiveDate: '',
  restedXPUsed: 0,
  activeScrollCards: 0,
  activeDamageCards: 0,
  goodStreak: 0,
};

async function onActivate(plugin: ReactRNPlugin) {
  const storedChar = (await plugin.storage.getSynced('character')) as any;
  if (!storedChar) {
    await plugin.storage.setSynced('character', { ...defaultCharacter });
    await plugin.storage.setSynced('activeEnemy', null);
  }

  const questsRaw = (await plugin.storage.getSynced('questLog')) as Partial<QuestLogState> | undefined;
  await plugin.storage.setSynced('questLog', ensureQuestLog(questsRaw));

  await plugin.app.registerWidget('character_panel', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: `${plugin.rootURL ?? ''}ui/sidebar_icon.png`,
    widgetTabTitle: 'World of Remcraft',
  });

  await plugin.app.registerWidget('battle_overlay', 'FlashcardUnder' as WidgetLocation, {
    dimensions: { height: 'auto', width: '100%' },
  });

  await plugin.event.addListener(
    AppEvents.QueueCompleteCard,
    undefined,
    async (event: any) => {
      const stored = (await plugin.storage.getSynced('character')) as Partial<CharacterState> | undefined;
      const char: CharacterState = { ...defaultCharacter, ...(stored ?? {}) };

      const zone = computeZone(char.level);
      let enemy =
        ((await plugin.storage.getSynced('activeEnemy')) as EnemyState | undefined) ??
        generateEnemy(char.level, false, zone);

      const questLog = ensureQuestLog(
        (await plugin.storage.getSynced('questLog')) as Partial<QuestLogState> | undefined
      );

      const score = event?.score as QueueInteractionScore | undefined;
      const isAgain = score === QueueInteractionScore.AGAIN;
      const isHard = score === QueueInteractionScore.HARD;
      const isEasy = score === QueueInteractionScore.EASY;
      const isGood = score === QueueInteractionScore.GOOD || score === undefined;
      const isGoodOrEasy = isGood || isEasy;

      const today = getTodayISO();
      if (char.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yISO = yesterday.toISOString().split('T')[0];
        if (char.lastActiveDate === yISO) {
          char.streakDays += 1;
        } else if (char.lastActiveDate !== today) {
          char.streakDays = 1;
        }
        char.lastActiveDate = today;
        char.restedXPUsed = 0;
        if (char.streakDays > 1) {
          await plugin.app.toast(`🔥 Streak: ${char.streakDays} days in a row!`);
        }
      }

      const baseXP = 50;
      let restedMult = 1;
      if (char.restedXPUsed < RESTED_XP_CARDS) {
        restedMult = RESTED_XP_MULTIPLIER;
        char.restedXPUsed += 1;
      }

      let scrollMult = 1;
      if (char.activeScrollCards > 0) {
        scrollMult = 2;
        char.activeScrollCards -= 1;
        applyQuestProgress(questLog.dailies, 'use_xp_scroll_total', 1);
        applyQuestProgress(questLog.weeklies, 'use_xp_scroll_total', 1);
      }

      let xpGain = 0;
      if (isAgain) {
        xpGain = 0;
        char.goodStreak = 0;
      } else if (isHard) {
        const mult = restedMult * scrollMult;
        xpGain = Math.round(baseXP * mult * 0.4);
        char.goodStreak = 0;
        applyQuestProgress(questLog.dailies, 'hard_total', 1);
        applyQuestProgress(questLog.weeklies, 'hard_total', 1);
      } else if (isGoodOrEasy) {
        const mult = restedMult * scrollMult;
        xpGain = Math.round(baseXP * mult);
        char.goodStreak += 1;
        applyQuestProgress(questLog.dailies, 'good_easy_total', 1);
        applyQuestProgress(questLog.weeklies, 'good_easy_total', 1);
      }

      if (!isAgain) {
        applyQuestProgress(questLog.dailies, 'no_again_total', 1);
        applyQuestProgress(questLog.weeklies, 'no_again_total', 1);
      }

      if (char.level < 60) char.currentXP += xpGain;
      char.totalXP += xpGain;
      char.cardsAnswered += 1;
      applyQuestProgress(questLog.dailies, 'reviews_total', 1);
      applyQuestProgress(questLog.weeklies, 'reviews_total', 1);

      let playerDmg = 1;
      if (char.activeDamageCards > 0) {
        playerDmg *= 2;
        char.activeDamageCards -= 1;
        applyQuestProgress(questLog.dailies, 'use_dmg_scroll_total', 1);
        applyQuestProgress(questLog.weeklies, 'use_dmg_scroll_total', 1);
      }

      if (char.goodStreak >= 5 && isGoodOrEasy) {
        playerDmg *= 2;
        char.goodStreak = 0;
        applyQuestProgress(questLog.dailies, 'critical_hits_total', 1);
        applyQuestProgress(questLog.weeklies, 'critical_hits_total', 1);
        await plugin.app.toast('💥 Critical hit! Double damage!');
      }

      enemy.currentHP -= playerDmg;

      if (enemy.currentHP <= 0) {
        char.monstersDefeated += 1;
        applyQuestProgress(questLog.dailies, 'kill_total', 1);
        applyQuestProgress(questLog.weeklies, 'kill_total', 1);

        let goldGain = 0;
        let silverGain = 0;

        if (enemy.elite) {
          char.elitesDefeated += 1;
          goldGain = 1 + Math.floor(Math.random() * 3);
          char.gold += goldGain;
          applyQuestProgress(questLog.dailies, 'elite_total', 1);
          applyQuestProgress(questLog.weeklies, 'elite_total', 1);
          applyQuestProgress(questLog.dailies, 'gold_total', goldGain);
          applyQuestProgress(questLog.weeklies, 'gold_total', goldGain);
        } else {
          silverGain = 1 + Math.floor(Math.random() * 2);
          char.silver += silverGain;
          applyQuestProgress(questLog.dailies, 'silver_total', silverGain);
          applyQuestProgress(questLog.weeklies, 'silver_total', silverGain);
        }

        await plugin.app.toast(
          enemy.elite ? `🏆 ${enemy.name} defeated!` : `💥 ${enemy.name} defeated!`
        );

        const spawnElite = char.monstersDefeated > 0 && char.monstersDefeated % ELITE_EVERY === 0;
        enemy = generateEnemy(char.level, spawnElite, computeZone(char.level));
      }

      applyQuestProgress(questLog.dailies, 'streak_days', char.streakDays);
      applyQuestProgress(questLog.weeklies, 'streak_days', char.streakDays);

      await settleCompletedQuests(plugin, char, questLog);

      while (char.level < 60 && char.currentXP >= xpForLevel(char.level)) {
        char.currentXP -= xpForLevel(char.level);
        char.level += 1;
        await plugin.app.toast(
          `⚔️ LEVEL UP! Level ${char.level} – ${computeZone(char.level).name}!`
        );
      }

      await plugin.storage.setSynced('character', char);
      await plugin.storage.setSynced('activeEnemy', enemy);
      await plugin.storage.setSynced('questLog', questLog);
    }
  );
}

async function onDeactivate(_plugin: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
