import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Cancel Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function CancelIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon size={32} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </Icon>
  );
}
