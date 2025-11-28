import Icon, { type IconProps } from "./Icon";

export default function ForwardIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.25} {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
      />
    </Icon>
  );
}
