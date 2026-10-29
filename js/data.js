/* ============================================================
   DATA – úrovně, nepřátelé, zbraně a loot
   ============================================================ */
(function () {
  "use strict";

  const LEVELS = [
    {
      id: "trida1",
      grade: "1. třída",
      label: "Prvňáček",
      age: "6–7 let",
      icon: "🌱",
      color: "#34d399",
      glow: "rgba(52,211,153,.18)",
      mathTier: 1,
      topics: ["Sčítání do 10", "Odčítání do 10", "Doplňování čísel"],
      choices: 3,
      mathTime: 34,
      chests: 4,
      enemies: 4,
      enemySpeed: 0.78,
      enemyDamage: 0.7,
      enemyMix: ["slime", "slime", "slime", "bat"],
      maxHp: 120,
      difficulty: 1,
      blurb: "Malá čísla, pomalí nepřátelé a dost času na každý příklad."
    },
    {
      id: "trida2",
      grade: "2. třída",
      label: "Druháček",
      age: "7–8 let",
      icon: "🍀",
      color: "#38e8ff",
      glow: "rgba(56,232,255,.18)",
      mathTier: 2,
      topics: ["Sčítání a odčítání do 100", "Malá násobilka", "Dělení beze zbytku"],
      choices: 4,
      mathTime: 30,
      chests: 4,
      enemies: 5,
      enemySpeed: 0.86,
      enemyDamage: 0.8,
      enemyMix: ["slime", "slime", "bat", "bat", "slime"],
      maxHp: 115,
      difficulty: 2,
      blurb: "Do stovky, první násobilka a o něco rychlejší příšerky."
    },
    {
      id: "trida34",
      grade: "3.–4. třída",
      label: "Třeťák a čtvrťák",
      age: "8–10 let",
      icon: "⚔️",
      color: "#a78bfa",
      glow: "rgba(167,139,250,.2)",
      mathTier: 3,
      topics: ["Násobilka do 10", "Dělení", "Větší čísla", "Zlomky z celku"],
      choices: 4,
      mathTime: 27,
      chests: 5,
      enemies: 5,
      enemySpeed: 0.95,
      enemyDamage: 0.9,
      enemyMix: ["slime", "bat", "bat", "ghost", "ghost"],
      maxHp: 110,
      difficulty: 3,
      blurb: "Násobilka, dělení a zlomky. Nepřátelé už umí pořádně potrápit."
    },
    {
      id: "trida56",
      grade: "5.–6. třída",
      label: "Páťák a šesťák",
      age: "10–12 let",
      icon: "🔮",
      color: "#f472b6",
      glow: "rgba(244,114,182,.18)",
      mathTier: 4,
      topics: ["Desetinná čísla", "Zlomky", "Procenta", "Závorky"],
      choices: 4,
      mathTime: 25,
      chests: 5,
      enemies: 6,
      enemySpeed: 1.02,
      enemyDamage: 1,
      enemyMix: ["bat", "bat", "ghost", "ghost", "slime", "shade"],
      maxHp: 105,
      difficulty: 4,
      blurb: "Desetinná čísla, procenta a záludné příklady se závorkami."
    },
    {
      id: "trida789",
      grade: "7.–9. třída",
      label: "Sedmák až deváťák",
      age: "12–15 let",
      icon: "🔥",
      color: "#fb923c",
      glow: "rgba(251,146,60,.2)",
      mathTier: 5,
      topics: ["Záporná čísla", "Mocniny a odmocniny", "Rovnice", "Procenta"],
      choices: 4,
      mathTime: 23,
      chests: 6,
      enemies: 7,
      enemySpeed: 1.1,
      enemyDamage: 1.12,
      enemyMix: ["ghost", "ghost", "shade", "shade", "bat", "bat", "bat"],
      maxHp: 100,
      difficulty: 5,
      blurb: "Rovnice, mocniny a rychlé stíny. Tohle už chce nervy."
    },
    {
      id: "stredni",
      grade: "Střední škola",
      label: "Matematik",
      age: "15+",
      icon: "👑",
      color: "#fbbf24",
      glow: "rgba(251,191,36,.22)",
      mathTier: 6,
      topics: ["Lineární rovnice", "Kvadratické rovnice", "Soustavy rovnic", "Mocniny a procenta"],
      choices: 4,
      mathTime: 21,
      chests: 6,
      enemies: 8,
      enemySpeed: 1.18,
      enemyDamage: 1.25,
      enemyMix: ["shade", "shade", "ghost", "ghost", "bat", "bat", "bat", "ghost"],
      maxHp: 100,
      difficulty: 6,
      blurb: "Nejtěžší příklady, nejrychlejší nepřátelé a minimum času."
    }
  ];

  const ENEMY_TYPES = {
    slime: {
      id: "slime", name: "Sliz", hp: 26, speed: 52, radius: 11,
      damage: 8, score: 15, color: "#4ade80", glow: "rgba(74,222,128,.4)",
      aggro: 4.5, behavior: "wander"
    },
    bat: {
      id: "bat", name: "Netopýr", hp: 22, speed: 88, radius: 9,
      damage: 9, score: 20, color: "#c084fc", glow: "rgba(192,132,252,.42)",
      aggro: 7, behavior: "erratic"
    },
    ghost: {
      id: "ghost", name: "Přízrak", hp: 44, speed: 66, radius: 12,
      damage: 13, score: 30, color: "#38e8ff", glow: "rgba(56,232,255,.42)",
      aggro: 9.5, behavior: "chase"
    },
    shade: {
      id: "shade", name: "Stín", hp: 68, speed: 58, radius: 13,
      damage: 16, score: 50, color: "#fb7185", glow: "rgba(251,113,133,.42)",
      aggro: 99, behavior: "hunt"
    }
  };

  const STARTING_WEAPON = {
    id: "spark", name: "Jiskra", icon: "✨", color: "#67e8f9", glow: "rgba(103,232,249,.55)",
    damage: 14, cooldown: 0.36, speed: 560, count: 1, spread: 0, radius: 5
  };

  const WEAPONS = {
    flame: {
      id: "flame", name: "Ohnivá koule", icon: "🔥", color: "#fb923c", glow: "rgba(251,146,60,.6)",
      damage: 27, cooldown: 0.54, speed: 470, count: 1, spread: 0, radius: 8
    },
    frost: {
      id: "frost", name: "Mrazivý šíp", icon: "❄️", color: "#7dd3fc", glow: "rgba(125,211,252,.6)",
      damage: 15, cooldown: 0.23, speed: 680, count: 1, spread: 0, radius: 4, slow: 1.8
    },
    star: {
      id: "star", name: "Trojhvězda", icon: "🌟", color: "#fde047", glow: "rgba(253,224,71,.6)",
      damage: 13, cooldown: 0.5, speed: 540, count: 3, spread: 0.17, radius: 4
    },
    storm: {
      id: "storm", name: "Bouřková hůl", icon: "⚡", color: "#c4b5fd", glow: "rgba(196,181,253,.62)",
      damage: 32, cooldown: 0.6, speed: 620, count: 1, spread: 0, radius: 6,
      explode: { radius: 42, damage: 15 }
    },
    void: {
      id: "void", name: "Duchamír", icon: "🌌", color: "#e879f9", glow: "rgba(232,121,249,.6)",
      damage: 19, cooldown: 0.29, speed: 590, count: 2, spread: 0.07, radius: 4
    }
  };

  const LOOT_META = {
    heal: { kind: "heal", name: "Léčivý lektvar", icon: "❤️", color: "#fb7185", label: "+30 HP" },
    maxhp: { kind: "maxhp", name: "Srdce obra", icon: "💖", color: "#f472b6", label: "+20 max. HP" },
    shield: { kind: "shield", name: "Ochranný štít", icon: "🛡️", color: "#38e8ff", label: "+1 štít" },
    magnet: { kind: "magnet", name: "Magnet na poklady", icon: "🧲", color: "#c084fc", label: "Větší dosah sběru" },
    gem: { kind: "gem", name: "Zlatý drahokam", icon: "💎", color: "#fbbf24", label: "+75 bodů" },
    key: { kind: "key", name: "Klíč od východu", icon: "🗝️", color: "#fde047", label: "Odemkne východ" }
  };

  const SAVE_KEY = "ciselneBludiste.v1";

  window.GameData = {
    LEVELS,
    ENEMY_TYPES,
    STARTING_WEAPON,
    WEAPONS,
    LOOT_META,
    SAVE_KEY,
    PLAYER_SPEED: 154,
    PLAYER_RADIUS: 10.5,
    TILE: 32,
    VIEW_COLS: 35,
    VIEW_ROWS: 23
  };
})();
