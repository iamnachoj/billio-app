import { describe, expect, it } from 'vitest';

import { suggestExpenseCategory } from '../expenseCategorySuggestion';

describe('suggestExpenseCategory', () => {
  it('detects eating out from Spanish and English keywords', () => {
    expect(suggestExpenseCategory('Cena con amigos')).toBe('eating_out');
    expect(suggestExpenseCategory('Dinner at the restaurant')).toBe(
      'eating_out'
    );
  });

  it('detects drinks from partial keywords like "cerve"', () => {
    expect(suggestExpenseCategory('Unas cervecitas')).toBe('drinks');
    expect(suggestExpenseCategory('Cerve con Juan')).toBe('drinks');
    expect(suggestExpenseCategory('Beers at the pub')).toBe('drinks');
  });

  it('fuzzy-matches slang/typo variants without needing them hardcoded', () => {
    expect(suggestExpenseCategory('Grocerias de la semana')).toBe('groceries');
    expect(suggestExpenseCategory('Cena en el restaurnate')).toBe('eating_out');
  });

  it('does not fuzzy-match short unrelated words', () => {
    expect(suggestExpenseCategory('zzz qqq xxx')).toBe('miscellaneous');
  });

  it('detects other categories', () => {
    expect(suggestExpenseCategory('Mercadona compra semanal')).toBe(
      'groceries'
    );
    expect(suggestExpenseCategory('Vuelo a Roma')).toBe('travel');
    expect(suggestExpenseCategory('Factura del gimnasio')).toBe(
      'personal_care'
    );
    expect(suggestExpenseCategory('Regalo de cumpleaños')).toBe('gifts');
  });

  it('is accent-insensitive and case-insensitive', () => {
    expect(suggestExpenseCategory('FARMACIA')).toBe('health');
    expect(suggestExpenseCategory('médico de cabecera')).toBe('health');
  });

  it('falls back to miscellaneous when nothing matches', () => {
    expect(suggestExpenseCategory('')).toBe('miscellaneous');
    expect(suggestExpenseCategory('xyz random text')).toBe('miscellaneous');
  });
});
