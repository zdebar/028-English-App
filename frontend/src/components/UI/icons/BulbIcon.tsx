import Icon, { type IconProps } from './Icon';
import type { JSX } from 'react';

/**
 * Bulb Icon component.
 *
 * @param props - IconProps to customize the icon.
 * @returns - The rendered icon element.
 */
export default function BulbIcon(props: IconProps): JSX.Element {
  return (
    <Icon {...props} size={22} strokeWidth={1.25}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
      />
    </Icon>
  );
}
