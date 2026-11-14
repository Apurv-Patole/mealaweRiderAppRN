import { useMemo } from 'react';
import { SvgXml as RawSvgXml, type XmlProps } from 'react-native-svg';

import { useScheme } from '@/theme';
import { darkenSvg } from '@/theme/svgDark';

interface ThemedSvgProps extends Omit<XmlProps, 'xml'> {
  xml: string;
  /** Draw the file exactly as exported in dark mode too (logos, brand art). */
  raw?: boolean;
  /** Map backdrops: white road strokes become a soft dark line in dark mode. */
  roads?: boolean;
}

/**
 * `SvgXml` for the Figma exports. In dark mode it swaps the light-mode colours baked into the file for their
 * dark twins (see `theme/svgDark.ts`), so icons stay readable on dark surfaces without a second set of files.
 */
export function SvgXml({ xml, raw = false, roads = false, ...props }: ThemedSvgProps) {
  const scheme = useScheme();
  const themed = useMemo(() => (scheme === 'dark' && !raw ? darkenSvg(xml, { roads }) : xml), [scheme, xml, raw, roads]);
  return <RawSvgXml xml={themed} {...props} />;
}
