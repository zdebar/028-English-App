import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Minus Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function MinusIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} size={20} strokeWidth={1} fillColor="currentColor">
      <path
        fillRule="evenodd"
        d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </Icon>
  );
}
