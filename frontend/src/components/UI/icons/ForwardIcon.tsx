import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Forward Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function ForwardIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} strokeWidth={1.25}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
      />
    </Icon>
  );
}
