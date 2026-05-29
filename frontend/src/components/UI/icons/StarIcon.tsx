import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

export const STAR_ICON_PATH =
  'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z';

/**
 * Star Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function StarIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon size={22} fillColor="currentColor" strokeWidth={0} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d={STAR_ICON_PATH} />
    </Icon>
  );
}
