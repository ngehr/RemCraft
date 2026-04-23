import {
  declareIndexPlugin,
  ReactRNPlugin,
  WidgetLocation,
  AppEvents,
} from '@remnote/plugin-sdk';

// XP-Tabelle: XP für Level N = 100 * N * N
function xpForLevel(level: number): number {
  return 100 * level * level;
}

async function onActivate(plugin: ReactRNPlugin) {

  // === Widgets registrieren ===

  // 1) Charakter-Panel in der rechten Sidebar
  await plugin.app.registerWidget(
    'character_panel',
    WidgetLocation.RightSidebar,
    { dimensions: { height: 280, width: '100%' } }
  );

  // 2) Battle-Overlay im Flashcard-Queue
  await plugin.app.registerWidget(
    'battle_overlay',
    WidgetLocation.Flashcard,
    { dimensions: { height: 120, width: '100%' } }
  );

  // === Event: Karte beantwortet ===
  // QueueCompleteCard feuert nach jeder abgeschlossenen Karte[cite:50]
  await plugin.event.addListener(
    AppEvents.QueueCompleteCard,
    undefined,
    async () => {
      // Charakter-Daten laden
      const char = await plugin.storage.getSynced('character') || {
        level: 1, currentXP: 0, totalXP: 0, cardsAnswered: 0
      };
      const enemy = await plugin.storage.getSynced('activeEnemy') || generateEnemy(1);

      // XP vergeben (+10 pro Karte – Phase 2: score-abhängig machen)
      const xpGain = 10;
      char.currentXP += xpGain;
      char.totalXP += xpGain;
      char.cardsAnswered += 1;

      // Level-Up-Check
      const xpNeeded = xpForLevel(char.level);
      if (char.currentXP >= xpNeeded) {
        char.currentXP -= xpNeeded;
        char.level += 1;
        await plugin.app.toast(`⚔️ LEVEL UP! Du bist jetzt Level ${char.level}!`);
      }

      // Gegner-Schaden
      enemy.currentHP -= 1;

      if (enemy.currentHP <= 0) {
        await plugin.app.toast(`🏆 ${enemy.name} besiegt! Neuer Gegner erscheint...`);
        const newEnemy = generateEnemy(char.level);
        await plugin.storage.setSynced('activeEnemy', newEnemy);
      } else {
        await plugin.storage.setSynced('activeEnemy', enemy);
      }

      await plugin.storage.setSynced('character', char);
    }
  );
}

// Gegner-Generator: Schwierigkeit skaliert mit Spieler-Level
function generateEnemy(playerLevel: number) {
  const enemies = [
    { id: 'goblin', name: 'Anatomie-Goblin', emoji: '👺' },
    { id: 'skeleton', name: 'Prüfungs-Skelett', emoji: '💀' },
    { id: 'troll', name: 'Lernblock-Troll', emoji: '👹' },
    { id: 'dragon', name: 'Prokrastinations-Drache', emoji: '🐉' },
    { id: 'slime', name: 'Vergessens-Schleim', emoji: '🟢' },
  ];
  const base = enemies[Math.floor(Math.random() * enemies.length)];
  const hp = Math.max(5, Math.floor(playerLevel * 2 + Math.random() * 10));
  return { ...base, maxHP: hp, currentHP: hp };
}

async function onDeactivate(plugin: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);