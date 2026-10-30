"use client"

import * as React from "react"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  Calendar as CalendarPrimitive,
  CalendarCell as CalendarCellPrimitive,
  CalendarGrid as CalendarGridPrimitive,
  CalendarGridBody as CalendarGridBodyPrimitive,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarHeaderCell as CalendarHeaderCellPrimitive,
  DateRangePicker as DateRangePickerPrimitive,
  DatePicker as DatePickerPrimitive,
  Dialog as DialogPrimitive,
  Group as GroupPrimitive,
  Heading as HeadingPrimitive,
  Popover as PopoverPrimitive,
  RangeCalendar as RangeCalendarPrimitive,
  type RangeValue,
} from "react-aria-components"
import {
  parseDate,
  type CalendarDate,
  type DateValue,
} from "@internationalized/date"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"

// Pemilih tanggal gaya shadcn di atas react-aria-components (satu keluarga
// dengan ui/select): tombol pemicu + popover kalender. Kontrak nilai memakai
// string ISO "YYYY-MM-DD" agar terpasang langsung ke state formulir yang
// berbasis string — komponen ini yang menangani konversi CalendarDate.

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

function isoValid(iso: string | null | undefined): iso is string {
  return typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)
}

function tanggalKeIso(nilai: DateValue | null): string | null {
  return nilai ? nilai.toString() : null
}

function tampilTanggal(iso: string): string {
  return FORMAT_TANGGAL.format(new Date(`${iso}T00:00:00Z`))
}

const KELAS_PEMICU = cn(
  "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-transparent bg-input/50 px-3 py-1 text-left text-sm whitespace-nowrap transition-[color,box-shadow,background-color] outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
  "pressed:bg-input/70",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
)

function PemicuTanggal({
  teks,
  placeholder,
}: {
  teks: string | null
  placeholder: string
}) {
  return (
    // Nama aksesibel tombol diambil dari teks isinya (nilai atau placeholder).
    <ButtonPrimitive className={KELAS_PEMICU}>
      <span className={cn("flex-1 truncate", !teks && "text-muted-foreground")}>
        {teks || placeholder}
      </span>
      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground" />
    </ButtonPrimitive>
  )
}

function PopoverKalender({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive>) {
  return (
    <PopoverPrimitive
      className={cn(
        "z-50 rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95",
        className,
      )}
      {...props}
    />
  )
}

function KepalaKalender() {
  return (
    <header className="flex items-center gap-1 px-1 pb-2">
      <ButtonPrimitive
        slot="previous"
        className="grid size-8 place-items-center rounded-lg outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
      </ButtonPrimitive>
      <HeadingPrimitive className="flex-1 text-center text-sm font-semibold" />
      <ButtonPrimitive
        slot="next"
        className="grid size-8 place-items-center rounded-lg outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
      </ButtonPrimitive>
    </header>
  )
}

const KELAS_SEL = cn(
  "flex size-9 items-center justify-center rounded-lg text-sm tabular-nums outline-none transition-colors",
  "hover:bg-accent data-disabled:pointer-events-none data-disabled:opacity-40",
  "data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-40",
  "data-selected:bg-primary data-selected:text-primary-foreground",
  "[&[data-selected][data-selection-state=middle]]:rounded-none [&[data-selected][data-selection-state=middle]]:bg-accent [&[data-selected][data-selection-state=middle]]:text-foreground",
  "[&[data-selected][data-selection-state=start]]:rounded-r-none",
  "[&[data-selected][data-selection-state=end]]:rounded-l-none",
)

function BadanKalender() {
  return (
    <>
      <KepalaKalender />
      <CalendarGridPrimitive className="border-collapse">
        <CalendarGridHeaderPrimitive>
          {(hari) => (
            <CalendarHeaderCellPrimitive className="w-9 pb-1 text-center text-xs font-medium text-muted-foreground">
              {hari}
            </CalendarHeaderCellPrimitive>
          )}
        </CalendarGridHeaderPrimitive>
        <CalendarGridBodyPrimitive>
          {(tanggal) => (
            <CalendarCellPrimitive date={tanggal} className={KELAS_SEL} />
          )}
        </CalendarGridBodyPrimitive>
      </CalendarGridPrimitive>
    </>
  )
}

/** Pemilih satu tanggal. Nilai: string ISO "YYYY-MM-DD" atau null. */
export function TanggalPicker({
  value,
  onChange,
  ariaLabel,
  placeholder = "Pilih tanggal",
  isInvalid,
  className,
}: {
  value: string | null
  onChange: (iso: string | null) => void
  ariaLabel: string
  placeholder?: string
  isInvalid?: boolean
  className?: string
}) {
  const nilai: CalendarDate | null = isoValid(value) ? parseDate(value) : null
  return (
    <DatePickerPrimitive
      aria-label={ariaLabel}
      value={nilai}
      onChange={(v) => onChange(tanggalKeIso(v))}
      isInvalid={isInvalid}
      className={cn("w-full", className)}
    >
      <GroupPrimitive className="w-full">
        <PemicuTanggal
          teks={nilai ? tampilTanggal(nilai.toString()) : null}
          placeholder={placeholder}
        />
      </GroupPrimitive>
      <PopoverKalender>
        <DialogPrimitive className="w-72 p-3 outline-none">
          <CalendarPrimitive>{<BadanKalender />}</CalendarPrimitive>
        </DialogPrimitive>
      </PopoverKalender>
    </DatePickerPrimitive>
  )
}

export type NilaiRentang = { mulai: string | null; selesai: string | null }

/** Pemilih rentang tanggal (mulai–selesai). Nilai: pasangan ISO atau null. */
export function RentangTanggalPicker({
  value,
  onChange,
  ariaLabel,
  placeholder = "Pilih rentang tanggal",
  isInvalid,
  className,
}: {
  value: NilaiRentang
  onChange: (nilai: NilaiRentang) => void
  ariaLabel: string
  placeholder?: string
  isInvalid?: boolean
  className?: string
}) {
  const { mulai, selesai } = value
  const nilai: RangeValue<CalendarDate> | null =
    isoValid(mulai) && isoValid(selesai)
      ? { start: parseDate(mulai), end: parseDate(selesai) }
      : null
  const teks =
    nilai !== null
      ? `${tampilTanggal(nilai.start.toString())} – ${tampilTanggal(nilai.end.toString())}`
      : null

  return (
    <DateRangePickerPrimitive
      aria-label={ariaLabel}
      value={nilai}
      onChange={(v: RangeValue<DateValue> | null) =>
        onChange(
          v
            ? { mulai: v.start.toString(), selesai: v.end.toString() }
            : { mulai: null, selesai: null },
        )
      }
      isInvalid={isInvalid}
      className={cn("w-full", className)}
    >
      <GroupPrimitive className="w-full">
        <PemicuTanggal teks={teks} placeholder={placeholder} />
      </GroupPrimitive>
      <PopoverKalender>
        <DialogPrimitive className="w-[19rem] p-3 outline-none">
          <RangeCalendarPrimitive>{<BadanKalender />}</RangeCalendarPrimitive>
        </DialogPrimitive>
      </PopoverKalender>
    </DateRangePickerPrimitive>
  )
}
