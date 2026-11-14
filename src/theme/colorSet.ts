/** A palette with the same keys as `T` whose values are plain colour strings (used for the dark twin of a light palette). */
export type ColorSet<T> = { readonly [K in keyof T]: string };
