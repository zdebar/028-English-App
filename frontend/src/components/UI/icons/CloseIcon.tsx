import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Close Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function CloseIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} size={32}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </Icon>
  );
}
