export type TextVariant = 'display' | 'h1' | 'h2' | 'title' | 'button' | 'body' | 'label' | 'caption' | 'overline';

/** Variants a screen reader announces as headings, so riders can jump between sections. */
export const HEADING_VARIANTS: readonly TextVariant[] = ['display', 'h1', 'h2'];

/** Large system font sizes are honoured up to this, so tight rows and chips do not break. */
export const MAX_FONT_SCALE = 1.4;
