import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

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
  required = false,
}: DateTimePickerProps) {
  return (
    <div className="relative">
      <DatePicker
        selected={value}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="yyyy-MM-dd HH:mm"
        placeholderText={placeholder}
        required={required}
        className="input input-bordered w-full pr-10"
        timeCaption="Time"
        showPopperArrow={false}
        popperPlacement="bottom-start"
        popperClassName="react-datepicker-popper-zindex"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50 pointer-events-none" />
    </div>
  );
}
