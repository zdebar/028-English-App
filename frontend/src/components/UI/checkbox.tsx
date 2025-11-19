import { useState } from "react";

export default function Checkbox({
  checked = false,
  className = "",
  onChange,
}: {
  checked?: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsChecked(checked);
    onChange(checked);
  };

  return (
    <label
      className={`note reverse-order absolute z-20 flex items-center gap-2 ${className}`}
      style={{
        bottom: "5px",
        left: "5px",
      }}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="cursor-pointer"
        style={{
          width: "16px",
          height: "16px",
        }}
      />
      Skrýt
    </label>
  );
}
