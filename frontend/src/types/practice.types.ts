export type ReviewKind = 'grammar' | 'vocabulary';
export type ReviewDirection = 'cz_to_en' | 'en_to_cz';
export type ReviewDueCounts = Readonly<Record<ReviewKind, Readonly<Record<ReviewDirection, number>>>>;
