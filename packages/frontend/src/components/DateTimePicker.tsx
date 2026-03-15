import { DateAndTimePicker } from "react-daisyui-timetools";
import dayjs from "dayjs";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
}: DateTimePickerProps) {
  // Convert Date to string format for the library
  const stringValue = value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";

  const handleChange = (newValue: string) => {
    if (!newValue) {
      onChange(null);
      return;
    }
    // Parse the string back to Date
    const parsed = dayjs(newValue);
    if (parsed.isValid()) {
      onChange(parsed.toDate());
    } else {
      onChange(null);
    }
  };

  return (
    <DateAndTimePicker
      value={stringValue}
      onChange={handleChange}
      placeholder={placeholder}
      locale="en"
      className="w-full gap-2"
      timeProps={{
        AMPM: false,
        interval: "15",
      }}
    />
  );
}
