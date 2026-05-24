"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DatePickerMode = "birth_date" | "started_at";

type DatePickerInputProps = {
  id: string;
  name: string;
  defaultValue?: string | null;
  defaultToToday?: boolean;
  mode: DatePickerMode;
};

type PickerOption = {
  label: string;
  value: number;
};

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getLocalToday() {
  return formatDateValue(new Date());
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDisplayValue(value: string) {
  const date = parseDateValue(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function getCalendarDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayBasedOffset = firstDay === 0 ? 6 : firstDay - 1;

  return [
    ...Array.from({ length: mondayBasedOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];
}

function getYearRange() {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 100;
  const end = currentYear + 100;

  return Array.from({ length: end - start + 1 }, (_, index) => end - index);
}

function CompactPicker({
  ariaLabel,
  options,
  value,
  onChange
}: {
  ariaLabel: string;
  options: PickerOption[];
  value: number;
  onChange: (value: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (isOpen) {
      selectedRef.current?.scrollIntoView({ block: "center" });
    }
  }, [isOpen, value]);

  return (
    <div className="relative min-w-0">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-between px-3 font-normal"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
      </Button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 z-40 mt-1 max-h-[6.75rem] overflow-y-auto overscroll-contain rounded-md border bg-card p-1 shadow-lg"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                ref={isSelected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex h-9 w-full items-center rounded-sm px-2 text-left text-sm hover:bg-secondary",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function DatePickerInput({
  id,
  name,
  defaultValue,
  defaultToToday = false,
  mode
}: DatePickerInputProps) {
  const initialValue = defaultValue || (defaultToToday ? getLocalToday() : "");
  const initialDate = parseDateValue(initialValue) || new Date();
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const years = useMemo(() => getYearRange(), []);
  const yearOptions = useMemo(
    () => years.map((year) => ({ label: String(year), value: year })),
    [years]
  );
  const monthOptions = useMemo(
    () => monthNames.map((month, index) => ({ label: month, value: index })),
    []
  );
  const days = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const selectedDate = parseDateValue(value);

  function moveMonth(direction: -1 | 1) {
    const next = new Date(viewYear, viewMonth + direction, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function selectDay(day: number) {
    setValue(formatDateValue(new Date(viewYear, viewMonth, day)));
    setIsOpen(false);
  }

  function selectToday() {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setValue(formatDateValue(today));
    setIsOpen(false);
  }

  function clearValue() {
    setValue("");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-2">
        <Input
          id={id}
          value={value ? formatDisplayValue(value) : ""}
          placeholder="дд.мм.гггг"
          readOnly
          onClick={() => setIsOpen((current) => !current)}
          className="cursor-pointer bg-background"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Открыть календарь"
          onClick={() => setIsOpen((current) => !current)}
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </div>

      {isOpen ? (
        <div className="absolute z-30 mt-2 w-full min-w-72 rounded-lg border bg-card p-3 shadow-lg sm:w-80">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="grid flex-1 grid-cols-[1fr_92px] gap-2">
              <CompactPicker
                ariaLabel="Месяц"
                options={monthOptions}
                value={viewMonth}
                onChange={setViewMonth}
              />
              <CompactPicker
                ariaLabel="Год"
                options={yearOptions}
                value={viewYear}
                onChange={setViewYear}
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {weekdayNames.map((weekday) => (
              <div key={weekday} className="py-1">
                {weekday}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isSelected =
                day !== null &&
                selectedDate?.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;

              return day === null ? (
                <div key={`empty-${index}`} className="h-9" />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md text-sm transition-colors hover:bg-secondary",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectToday}>
              Сегодня
            </Button>
            {mode === "birth_date" ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearValue}>
                <X className="h-4 w-4" />
                Очистить
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
