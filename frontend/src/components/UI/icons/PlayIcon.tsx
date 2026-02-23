import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Eye Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function PlayIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} strokeWidth={1.25}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
      />
    </Icon>
  );
}
