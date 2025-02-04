const allTimeZones = [
  { value: 'Pacific/Niue', label: '(UTC-11:00) Niue', timeOffset: -11 * 60 },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii', timeOffset: -10 * 60 },
  { value: 'Pacific/Marquesas', label: '(UTC-09:30) Marquesas Islands', timeOffset: -9.5 * 60 },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska', timeOffset: -9 * 60 },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)', timeOffset: -8 * 60 },
  { value: 'America/Phoenix', label: '(UTC-07:00) Mountain Time (US & Canada)', timeOffset: -7 * 60 },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)', timeOffset: -6 * 60 },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)', timeOffset: -5 * 60 },
  { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)', timeOffset: -4 * 60 },
  { value: 'America/St_Johns', label: '(UTC-03:30) Newfoundland', timeOffset: -3.5 * 60 },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) Sao Paulo', timeOffset: -3 * 60 },
  { value: 'America/Noronha', label: '(UTC-02:00) Fernando de Noronha', timeOffset: -2 * 60 },
  { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores', timeOffset: -1 * 60 },
  { value: 'Europe/London', label: '(UTC+00:00) London, Dublin', timeOffset: 0 },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Berlin', timeOffset: 1 * 60 },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Cairo', timeOffset: 2 * 60 },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow', timeOffset: 3 * 60 },
  { value: 'Asia/Tehran', label: '(UTC+03:30) Tehran', timeOffset: 3.5 * 60 },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai', timeOffset: 4 * 60 },
  { value: 'Asia/Kabul', label: '(UTC+04:30) Kabul', timeOffset: 4.5 * 60 },
  { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi', timeOffset: 5 * 60 },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, New Delhi', timeOffset: 5.5 * 60 },
  { value: 'Asia/Kathmandu', label: '(UTC+05:45) Kathmandu', timeOffset: 5.75 * 60 },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka', timeOffset: 6 * 60 },
  { value: 'Asia/Yangon', label: '(UTC+06:30) Yangon', timeOffset: 6.5 * 60 },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok', timeOffset: 7 * 60 },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Singapore', timeOffset: 8 * 60 },
  { value: 'Australia/Eucla', label: '(UTC+08:45) Eucla', timeOffset: 8.75 * 60 },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Seoul', timeOffset: 9 * 60 },
  { value: 'Australia/Adelaide', label: '(UTC+09:30) Adelaide', timeOffset: 9.5 * 60 },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney', timeOffset: 10 * 60 },
  { value: 'Australia/Lord_Howe', label: '(UTC+10:30) Lord Howe Island', timeOffset: 10.5 * 60 },
  { value: 'Pacific/Noumea', label: '(UTC+11:00) Noumea', timeOffset: 11 * 60 },
  { value: 'Pacific/Norfolk', label: '(UTC+11:30) Norfolk Island', timeOffset: 11.5 * 60 },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland', timeOffset: 12 * 60 },
  { value: 'Pacific/Chatham', label: '(UTC+12:45) Chatham Islands', timeOffset: 12.75 * 60 },
  { value: 'Pacific/Apia', label: '(UTC+13:00) Samoa', timeOffset: 13 * 60 },
  { value: 'Pacific/Kiritimati', label: '(UTC+14:00) Kiritimati', timeOffset: 14 * 60 },
] as const

const timeOffset = (new Date().getTimezoneOffset()) * -1

const currentTimeZone = allTimeZones.find(tz => tz.timeOffset === timeOffset)
const timeZone = ref<string>(currentTimeZone?.value ?? 'Europe/London')

export default function () {
  return {
    timeZone,
    allTimeZones,
  }
}
