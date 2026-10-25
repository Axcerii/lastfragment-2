import { describe, expect, it } from 'vitest';
import {
	attackModifiers,
	describeWeaponBonus,
	handsTaken,
	parseWeaponBonuses,
	serializeWeaponBonuses,
	weaponBonusValue
} from './weapons';

describe('armes', () => {
	it('lit les bonus connus et ignore les autres', () => {
		const bonuses = parseWeaponBonuses('ignore-defense:5, inconnu:3,');
		expect(bonuses).toEqual([{ code: 'ignore-defense:5', kind: 'ignore-defense', value: 5 }]);
		expect(describeWeaponBonus(bonuses[0])).toBe('Ignore 5 points de défense de la cible');
		expect(attackModifiers(bonuses).ignoreDefense).toBe(5);
		expect(parseWeaponBonuses(null)).toEqual([]);
	});

	it('prend la valeur X choisie par le MJ', () => {
		const bonuses = parseWeaponBonuses('ignore-defense:12');
		expect(attackModifiers(bonuses).ignoreDefense).toBe(12);
		expect(describeWeaponBonus(bonuses[0])).toBe('Ignore 12 points de défense de la cible');
		expect(describeWeaponBonus(parseWeaponBonuses('ignore-defense:1')[0])).toBe(
			'Ignore 1 point de défense de la cible'
		);
		expect(parseWeaponBonuses('ignore-defense:0')).toEqual([]);
	});

	it('enregistre une valeur par bonus, et rien pour 0', () => {
		expect(serializeWeaponBonuses({ 'ignore-defense': 8 })).toBe('ignore-defense:8');
		expect(serializeWeaponBonuses({ 'ignore-defense': 0 })).toBeNull();
		expect(weaponBonusValue('ignore-defense:8', 'ignore-defense')).toBe(8);
		expect(weaponBonusValue(null, 'ignore-defense')).toBe(0);
	});

	it('une arme à deux mains occupe les deux emplacements', () => {
		expect(handsTaken('deux')).toEqual(['gauche', 'droite', 'deux']);
		expect(handsTaken('gauche')).toEqual(['gauche', 'deux']);
	});
});
