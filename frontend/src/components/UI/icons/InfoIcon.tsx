import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Info Icon component.
 *
 * @param props IconProps to customize the icon.
 * @returns The rendered icon element.
 */
export default function InfoIcon(props: Readonly<IconProps>): JSX.Element {
  return (
    <Icon {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
      />
    </Icon>
  );
}
