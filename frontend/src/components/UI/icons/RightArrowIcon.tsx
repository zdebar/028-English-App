import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Right Arrow Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered RightArrowIcon element.
 */
export default function RightArrowIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} size={20} strokeWidth={1.5} fillColor="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </Icon>
  );
}
