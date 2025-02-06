export type TimeZone = {
  id: string
  label: string
  timeOffset: number
}

export const allTimeZones = [
  { id: 'Pacific/Niue', label: 'Pacific/Niue [-11h]', timeOffset: -11 * 60 },
  { id: 'Pacific/Honolulu', label: 'Honolulu (HST) [-10h]', timeOffset: -10 * 60 },
  { id: 'Pacific/Marquesas', label: 'Marquesas [-9:30h]', timeOffset: -9.5 * 60 },
  { id: 'America/Anchorage', label: 'Anchorage (AKST) [-9h]', timeOffset: -9 * 60 },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PT, US & Canada) [-8h]', timeOffset: -8 * 60 },
  { id: 'America/Denver', label: 'Denver (MT, US & Canada) [-7h]', timeOffset: -7 * 60 },
  { id: 'America/Phoenix', label: 'Phoenix (MT) [-7h]', timeOffset: -7 * 60 },
  { id: 'America/Chicago', label: 'Chicago (CT, US & Canada) [-6h]', timeOffset: -6 * 60 },
  { id: 'America/New_York', label: 'New York (ET, US & Canada) [-5h]', timeOffset: -5 * 60 },
  { id: 'America/Indianapolis', label: 'Indianapolis (ET) [-5h]', timeOffset: -5 * 60 },
  { id: 'America/Halifax', label: 'Halifax (AT, Canada) [-4h]', timeOffset: -4 * 60 },
  { id: 'America/St_Johns', label: 'St. Johns (NT) [-3:30h]', timeOffset: -3.5 * 60 },
  { id: 'America/Sao_Paulo', label: 'São Paulo (BRT) [-3h]', timeOffset: -3 * 60 },
  { id: 'America/Noronha', label: 'Fernando de Noronha [-2h]', timeOffset: -2 * 60 },
  { id: 'Atlantic/Azores', label: 'Azores [-1h]', timeOffset: -1 * 60 },
  { id: 'Europe/London', label: 'London (GMT) [+0h]', timeOffset: 0 },
  { id: 'Europe/Paris', label: 'Paris (CET) [+1h]', timeOffset: 1 * 60 },
  { id: 'Africa/Cairo', label: 'Cairo (EET) [+2h]', timeOffset: 2 * 60 },
  { id: 'Europe/Helsinki', label: 'Helsinki (EET) [+2h]', timeOffset: 2 * 60 },
  { id: 'Asia/Jerusalem', label: 'Jerusalem (IST) [+2h]', timeOffset: 2 * 60 },
  { id: 'Europe/Moscow', label: 'Moscow (MSK) [+3h]', timeOffset: 3 * 60 },
  { id: 'Asia/Tehran', label: 'Tehran (IRST) [+3:30h]', timeOffset: 3.5 * 60 },
  { id: 'Asia/Dubai', label: 'Dubai (GST) [+4h]', timeOffset: 4 * 60 },
  { id: 'Asia/Qatar', label: 'Qatar (AST) [+4h]', timeOffset: 4 * 60 },
  { id: 'Asia/Kabul', label: 'Kabul [+4:30h]', timeOffset: 4.5 * 60 },
  { id: 'Asia/Karachi', label: 'Karachi (PKT) [+5h]', timeOffset: 5 * 60 },
  { id: 'Asia/Kolkata', label: 'New Delhi (IST) [+5:30h]', timeOffset: 5.5 * 60 },
  { id: 'Asia/Kathmandu', label: 'Kathmandu [+5:45h]', timeOffset: 5.75 * 60 },
  { id: 'Asia/Dhaka', label: 'Dhaka (BTT) [+6h]', timeOffset: 6 * 60 },
  { id: 'Asia/Yangon', label: 'Yangon [+6:30h]', timeOffset: 6.5 * 60 },
  { id: 'Asia/Bangkok', label: 'Bangkok (ICT) [+7h]', timeOffset: 7 * 60 },
  { id: 'Asia/Singapore', label: 'Singapore (SGT) [+8h]', timeOffset: 8 * 60 },
  { id: 'Asia/Manila', label: 'Manila (PHT) [+8h]', timeOffset: 8 * 60 },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST) [+9h]', timeOffset: 9 * 60 },
  { id: 'Australia/Adelaide', label: 'Adelaide (ACST) [+9:30h]', timeOffset: 9.5 * 60 },
  { id: 'Australia/Sydney', label: 'Sydney (AEST) [+10h]', timeOffset: 10 * 60 },
  { id: 'Australia/Lord_Howe', label: 'Lord Howe [+10:30h]', timeOffset: 10.5 * 60 },
  { id: 'Pacific/Noumea', label: 'Noumea (NCT) [+11h]', timeOffset: 11 * 60 },
  { id: 'Pacific/Norfolk', label: 'Norfolk [+11:30h]', timeOffset: 11.5 * 60 },
  { id: 'Pacific/Auckland', label: 'Auckland (NZST) [+12h]', timeOffset: 12 * 60 },
  { id: 'Pacific/Chatham', label: 'Chatham [+12:45h]', timeOffset: 12.75 * 60 },
  { id: 'Pacific/Apia', label: 'Apia (SST) [+13h]', timeOffset: 13 * 60 },
  { id: 'Pacific/Kiritimati', label: 'Kiritimati [+14h]', timeOffset: 14 * 60 },
] as const satisfies TimeZone[]

type TimeZoneRecord =
  { [T in typeof allTimeZones[number]['id']]: typeof allTimeZones[number] }

export const timeZoneRecord: TimeZoneRecord = allTimeZones.reduce((acc, timeZone) => {
  acc[timeZone.id] = timeZone
  return acc
}, {} as TimeZoneRecord)

export function getLocalTimeZone(): TimeZone {
  const id = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timeOffset = (new Date().getTimezoneOffset()) * -1
  return {
    id,
    label: `${id} [${timeOffset >= 0 ? '+' : ''}${Math.round(100 * timeOffset / 60) / 100}h]`,
    timeOffset,
  }
}
