import { describe, it, expect } from 'vitest';
import { parseDecimal, parseDecimalOr } from '../lib/parse';

describe('parseDecimal', () => {
  it('accepte le point et la virgule décimale', () => {
    expect(parseDecimal('1234.56')).toBe(1234.56);
    expect(parseDecimal('1234,56')).toBe(1234.56);
  });
  it('ignore les espaces séparateurs de milliers', () => {
    expect(parseDecimal('1 234,56')).toBe(1234.56);
    expect(parseDecimal('1 234')).toBe(1234);
  });
  it('gère les nombres négatifs', () => {
    expect(parseDecimal('-50,5')).toBe(-50.5);
  });
  it('renvoie null pour une saisie vide ou invalide', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('12,3,4')).toBeNull();
    expect(parseDecimal('--5')).toBeNull();
  });
  it('accepte les valeurs décimales sans partie entière', () => {
    expect(parseDecimal('0,5')).toBe(0.5);
    expect(parseDecimal('.5')).toBe(0.5);
  });
});

describe('parseDecimalOr', () => {
  it('renvoie le fallback si invalide', () => {
    expect(parseDecimalOr('', 0)).toBe(0);
    expect(parseDecimalOr('abc', 7)).toBe(7);
    expect(parseDecimalOr('42', 0)).toBe(42);
  });
});
