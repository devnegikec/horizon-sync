export const UNIT_OF_MEASURE_OPTIONS = ['Piece', 'Box', 'Ream', 'Sheet', 'Kilogram', 'Liter', 'Meter', 'Set'] as const;

export type UnitOfMeasure = (typeof UNIT_OF_MEASURE_OPTIONS)[number];
