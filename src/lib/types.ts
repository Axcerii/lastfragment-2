export interface Character {
  id: number;
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
    id: number;
    login: string;
  }>;
  statistics?: Statistic | null;
  passives?: Array<Passive>;
  characterSkills?: Array<CharacterSkill>;
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
  id: number;
  visibility: number;
  name: string;
  dragon: string;
  size: string;
  weight: string;
  dangerosity: number;
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
  image?: string;
  effect: string;
  description: string;
  current: number;
}

export interface UpdateMonsterData extends Partial<CreateMonsterData> {}

export interface Statistic {
  id: number;
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
  character?: {
    id: number;
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

export type ItemCategory =
  | 'Casque'
  | 'Torse'
  | 'Gantelets'
  | 'Jambieres'
  | 'Outil'
  | 'Arme'
  | 'Fiole'
  | 'Nourriture'
  | 'Munitions'
  | 'Important'
  | 'Autre'
  | 'Materiaux'
  | 'Animal'
  | 'Sac';

export interface Item {
  id: number;
  name: string;
  category: ItemCategory;
  rarity: number;
  weight: number;
  description: string;
  itemsInPlayer?: Array<{
    id: number;
    playerId: number;
  }>;
  armors?: Array<{
    id: number;
    name: string;
  }>;
}

export interface CreateItemData {
  name: string;
  category: ItemCategory;
  rarity: number;
  weight: number;
  description: string;
}

export interface UpdateItemData extends Partial<CreateItemData> {}

export interface ItemInPlayer {
  id: number;
  itemId: number;
  playerId: number;
  quantity: number;
  localisation: string;
  item?: {
    id: number;
    name: string;
    category: string;
    rarity: number;
    weight: number;
    description: string;
  };
  player?: {
    id: number;
    login: string;
  };
  armorInPlayer?: Array<{
    id: number;
    armorId: number;
  }>;
  foodsInBags?: Array<{
    id: number;
    foodId: number;
  }>;
}

export interface CreateItemInPlayerData {
  itemId: number;
  playerId: number;
  quantity?: number;
  localisation: string;
}

export interface UpdateItemInPlayerData extends Partial<CreateItemInPlayerData> {}

export interface Player {
  id: number;
  login: string;
  password?: string;
  role: number;
  team: number;
  characterId?: number | null;
  character?: Character | null;
}

export interface Armor {
  id: number;
  name: string;
  statistics: string;
  values: string;
  itemId: number;
  item?: {
    id: number;
    name: string;
    category: string;
    rarity: number;
    weight: number;
    description: string;
  };
  armorInPlayer?: Array<{
    id: number;
    itemInPlayerId: number;
  }>;
}

export interface CreateArmorData {
  name: string;
  statistics: string;
  values: string;
  itemId: number;
}

export interface UpdateArmorData extends Partial<CreateArmorData> {}

export interface ArmorInPlayer {
  id: number;
  itemInPlayerId: number;
  armorId: number;
  statistics: string;
  values: string;
  descriptionAdd: string;
  notes: string;
  itemInPlayer?: {
    id: number;
    playerId: number;
    localisation: string;
    player?: {
      id: number;
      login: string;
    };
  };
  armor?: {
    id: number;
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
  descriptionAdd: string;
  notes: string;
}

export interface UpdateArmorInPlayerData extends Partial<CreateArmorInPlayerData> {}

export interface Food {
  id: number;
  name: string;
  weight: number;
  type: 'viandes' | 'boissons' | 'fruits' | 'rations';
  price: number;
  foodsInBags?: Array<{
    id: number;
    itemInPlayerId: number;
  }>;
}

export interface CreateFoodData {
  name: string;
  weight: number;
  type: Food['type'];
  price: number;
}

export interface UpdateFoodData extends Partial<CreateFoodData> {}

export interface FoodInBag {
  id: number;
  itemInPlayerId: number;
  foodId: number;
  quantity: number;
  itemInPlayer?: {
    id: number;
    playerId: number;
    localisation: string;
    player?: {
      id: number;
      login: string;
    };
  };
  food?: {
    id: number;
    name: string;
    weight: number;
    type: string;
    price: number;
  };
}

export interface CreateFoodInBagData {
  itemInPlayerId: number;
  foodId: number;
  quantity?: number;
}

export interface UpdateFoodInBagData extends Partial<CreateFoodInBagData> {}

export interface Badge {
  id: number;
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

export type BadgeType =
  | 'Artrish'
  | 'Yinva'
  | 'Guizamark'
  | 'Shizari'
  | 'Pestia'
  | 'Chronos'
  | 'Aqua'
  | 'Goliath'
  | 'Drii'
  | 'Lada'
  | 'Pura';

export interface BadgeFusion {
  id: number;
  badge1: BadgeType;
  badge2: BadgeType;
  playerId: number;
  player?: {
    id: number;
    login: string;
  };
}

export interface CreateBadgeFusionData {
  badge1: BadgeType;
  badge2: BadgeType;
  playerId: number;
}

export interface UpdateBadgeFusionData extends Partial<CreateBadgeFusionData> {}

export type SkillStatistic =
  | 'PV'
  | 'QDF'
  | 'Endurance'
  | 'Maitrise'
  | 'Force'
  | 'Defense'
  | 'Vitesse'
  | 'Precision'
  | 'Perception'
  | 'Furtivite'
  | 'Charisme'
  | 'Eloquence'
  | 'Intelligence';

export interface Skill {
  id: number;
  statistics: SkillStatistic;
  name: string;
  description: string;
  level: number;
}

export interface CreateSkillData {
  statistics: SkillStatistic;
  name: string;
  description: string;
  level: number;
}

export interface UpdateSkillData extends Partial<CreateSkillData> {}

export interface CharacterSkill {
  id: number;
  characterId: number;
  skillId: number;
  level: number;
  character?: {
    id: number;
    name: string;
  };
  skill?: Skill;
}

export interface CreateCharacterSkillData {
  characterId: number;
  skillId: number;
  level?: number;
}

export interface Passive {
  id: number;
  characterId: number;
  statistics: string;
  maths: string;
  character?: {
    id: number;
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