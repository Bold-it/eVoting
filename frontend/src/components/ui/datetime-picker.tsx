import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";

interface DateTimePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export function DateTimePicker({ value, onChange, placeholder }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse the current string value to a Date object for the Calendar
  const parsedDate = value ? new Date(value) : undefined;
  
  // State for the time inputs
  const [timeStr, setTimeStr] = React.useState<string>(() => {
    if (!value) return "12:00";
    const d = new Date(value);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    // Combine selected date with current timeStr
    const [hours, minutes] = timeStr.split(":");
    selectedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    onChange(selectedDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeStr(newTime);
    if (parsedDate) {
      const [hours, minutes] = newTime.split(":");
      const newDate = new Date(parsedDate);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      onChange(newDate.toISOString());
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 " +
            (!value ? "text-muted-foreground" : "")
          }
        >
          {value ? format(parsedDate!, "PP p") : <span>{placeholder || "Pick a date"}</span>}
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t border-border p-3">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Time
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Done (Continue)
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
