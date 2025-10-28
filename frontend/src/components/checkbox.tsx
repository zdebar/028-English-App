import { useState } from "react";

export default function Checkbox({
  checked = false,
  onChange,
  className = "",
}: {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsChecked(checked);
    onChange(checked); // Vrací aktuální stav přes callback
  };

  return (
    <label
      className={`text-notice reverse-order absolute z-20 flex items-center gap-2 ${className}`}
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
