export interface Character {
  id: string;
  visibility: number;
  name: string;
  flux: string | null;
  dragon: string;
  title: string | null;
  theme: string | null;
  race: 'Humain' | 'Geant' | 'Eternelle' | 'Inconnu' | 'Dragon' | 'Ange';
  country: 'Augeaime' | 'Inconnu' | 'Irisia' | 'Amari' | 'Mudan' | 'Edenia' | 'Celeste' | 'Saxifra';
  image: string;
  description: string;
  category: string;
  current: number;
  players?: Array<{
    id: string;
    login: string;
  }>;
  statistics?: Array<{
    id: string;
    qdf: string;
    pv: string;
  }>;
}

export interface CreateCharacterData {
  visibility: number;
  name: string;
  flux?: string;
  dragon: string;
  title?: string;
  theme?: string;
  race: Character['race'];
  country: Character['country'];
  image: string;
  description: string;
  category: string;
  current: number;
}

export interface UpdateCharacterData extends Partial<CreateCharacterData> {}

export interface Monster {
  id: string;
  visibility: number;
  name: string;
  dragon: string;
  size: string;
  weight: string;
  dangerosity: string;
  image: string;
  effect: string;
  description: string;
  current: number;
}

export interface CreateMonsterData {
  visibility: number;
  name: string;
  dragon: string;
  size: string;
  weight: string;
  dangerosity: number;
  effect: string;
  description: string;
  current: number;
}

export interface UpdateMonsterData extends Partial<CreateMonsterData> {}

export interface Statistic {
  id: string;
  characterId: string;
  qdf: string;
  pv: string;
  endurance: string;
  strength: string;
  maitrise: string;
  defense: string;
  vitesse: string;
  accuracy: string;
  perception: string;
  furtivite: string;
  charisme: string;
  eloquence: string;
  intelligence: string;
  character?: {
    id: string;
    name: string;
  };
}

export interface CreateStatisticData {
  characterId: number;
  qdf: number;
  pv: number;
  endurance: number;
  strength: number;
  maitrise: number;
  defense: number;
  vitesse: number;
  accuracy: number;
  perception: number;
  furtivite: number;
  charisme: number;
  eloquence: number;
  intelligence: number;
}

export interface UpdateStatisticData extends Partial<CreateStatisticData> {}

// src/lib/types.ts (ajout des types Item)
export interface Item {
  id: string;
  category: 'Casque' | 'Torse' | 'Gantelets' | 'Jambieres' | 'Outil' | 'Arme' | 'Fiole' | 
            'Nourriture' | 'Munitions' | 'Important' | 'Autre' | 'Materiaux' | 'Animal' | 'Sac';
  rarity: string;
  weight: string;
  description: string;
  itemsInPlayer?: Array<{
    id: string;
    playerId: string;
  }>;
  armors?: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateItemData {
  category: Item['category'];
  rarity: number;
  weight: number;
  description: string;
}

export interface UpdateItemData extends Partial<CreateItemData> {}

// src/lib/types.ts (ajout des types ItemInPlayer)
export interface ItemInPlayer {
  id: string;
  itemId: string;
  playerId: string;
  localisation: string;
  item?: {
    id: string;
    category: string;
    rarity: string;
    weight: string;
    description: string;
  };
  player?: {
    id: string;
    login: string;
  };
  armorInPlayer?: Array<{
    id: string;
    armorId: string;
  }>;
  foodsInBags?: Array<{
    id: string;
    foodId: string;
  }>;
}

export interface CreateItemInPlayerData {
  itemId: number;
  playerId: number;
  localisation: string;
}

export interface UpdateItemInPlayerData extends Partial<CreateItemInPlayerData> {}

export interface Player {
  id: number;
  login: string;
  password: string;
  role: number;
  team: number;
  characterId?: number | null;
}


export interface Armor {
  id: string;
  name: string;
  statistics: string;
  values: string;
  itemId: string;
  item?: {
    id: string;
    category: string;
    rarity: string;
    weight: string;
    description: string;
  };
  armorInPlayer?: Array<{
    id: string;
    itemInPlayerId: string;
  }>;
}

export interface CreateArmorData {
  name: string;
  statistics: string;
  values: string;
  itemId: number;
}

export interface UpdateArmorData extends Partial<CreateArmorData> {}

// src/lib/types.ts (ajout des types ArmorInPlayer)
export interface ArmorInPlayer {
  id: string;
  itemInPlayerId: string;
  armorId: string;
  statistics: string;
  values: string;
  descriptionAdd: string;
  notes: string;
  itemInPlayer?: {
    id: string;
    playerId: string;
    localisation: string;
    player?: {
      id: string;
      login: string;
    };
  };
  armor?: {
    id: string;
    name: string;
    statistics: string;
    values: string;
  };
}

export interface CreateArmorInPlayerData {
  itemInPlayerId: number;
  armorId: number;
  statistics: string;
  values: string;
  descriptionAdd: number;
  notes: string;
}

export interface UpdateArmorInPlayerData extends Partial<CreateArmorInPlayerData> {}

// src/lib/types.ts (ajout des types Food)
export interface Food {
  id: string;
  name: string;
  weight: string;
  type: 'viandes' | 'boissons' | 'fruits' | 'rations';
  price: string;
  foodsInBags?: Array<{
    id: string;
    itemInPlayerId: string;
  }>;
}

export interface CreateFoodData {
  name: string;
  weight: number;
  type: Food['type'];
  price: number;
}

export interface UpdateFoodData extends Partial<CreateFoodData> {}

// src/lib/types.ts (ajout des types FoodInBag)
export interface FoodInBag {
  id: string;
  itemInPlayerId: string;
  foodId: string;
  itemInPlayer?: {
    id: string;
    playerId: string;
    localisation: string;
    player?: {
      id: string;
      login: string;
    };
  };
  food?: {
    id: string;
    name: string;
    weight: string;
    type: string;
    price: string;
  };
}

export interface CreateFoodInBagData {
  itemInPlayerId: number;
  foodId: number;
}

export interface UpdateFoodInBagData extends Partial<CreateFoodInBagData> {}

// src/lib/types.ts (ajout des types Badge)
export interface Badge {
  id: string;
  badges: string;
  name: string;
  description: string;
}

export interface CreateBadgeData {
  badges: string;
  name: string;
  description: string;
}

export interface UpdateBadgeData extends Partial<CreateBadgeData> {}


// src/lib/types.ts (ajout des types BadgeFusion)
export type BadgeType = 'Artrish' | 'Yinva' | 'Guizamark' | 'Shizari' | 'Pestia' | 
                        'Chronos' | 'Aqua' | 'Goliath' | 'Drii' | 'Lada' | 'Pura';

export interface BadgeFusion {
  id: string;
  badge1: BadgeType;
  badge2: BadgeType;
  playerId: string;
  player?: {
    id: string;
    login: string;
  };
}

export interface CreateBadgeFusionData {
  badge1: BadgeType;
  badge2: BadgeType;
  playerId: number;
}

export interface UpdateBadgeFusionData extends Partial<CreateBadgeFusionData> {}

// src/lib/types.ts (ajout des types Skill)
export type SkillStatistic = 'PV' | 'QDF' | 'Endurance' | 'Maitrise' | 'Force' | 'Defense' | 
                              'Vitesse' | 'Precision' | 'Perception' | 'Furtivite' | 
                              'Charisme' | 'Eloquence' | 'Intelligence';

export interface Skill {
  id: string;
  statistics: SkillStatistic;
  name: string;
  description: string;
  level: string;
}

export interface CreateSkillData {
  statistics: SkillStatistic;
  name: string;
  description: string;
  level: number;
}

export interface UpdateSkillData extends Partial<CreateSkillData> {}


// src/lib/types.ts (ajout des types Passive)
export interface Passive {
  id: string;
  characterId: string;
  statistics: string;
  maths: string;
  character?: {
    id: string;
    name: string;
    race: string;
    country: string;
  };
}

export interface CreatePassiveData {
  characterId: number;
  statistics: string;
  maths: string;
}

export interface UpdatePassiveData extends Partial<CreatePassiveData> {}