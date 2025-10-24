import Label from "./label";

interface SettingPropertyProps {
  label: string;
  value: string | null | undefined;
  className?: string;
}

export default function SettingProperty({
  label,
  value,
  className = "",
}: SettingPropertyProps) {
  return (
    <div className={`row flex items-center ${className}`}>
      <Label text={label} /> <p>{value}</p>
    </div>
  );
}
