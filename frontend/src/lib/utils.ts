import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocalDate(isoString?: string): string {
  if (!isoString) return 'No date set';
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, MMM d');
  } catch (e) {
    return isoString;
  }
}

export function formatTimeOrPeriod(isoString?: string, precision?: string): string {
  if (!isoString) return '';
  try {
    if (precision === 'day') return 'All day';
    if (precision === 'approximate_period') return 'Approximate time';
    const date = parseISO(isoString);
    return format(date, 'h:mm a');
  } catch (e) {
    return '';
  }
}

export function formatFullDue(isoString?: string, precision?: string): string {
  if (!isoString) return 'Someday';
  try {
    const date = parseISO(isoString);
    const dateStr = formatLocalDate(isoString);
    if (precision === 'day') return dateStr;
    const timeStr = format(date, 'h:mm a');
    return `${dateStr} at ${timeStr}`;
  } catch (e) {
    return isoString;
  }
}

export function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'family':
      return { bg: 'bg-[#FFE2D5]/70', text: 'text-[#D96536]', border: 'border-[#FFC8B3]' };
    case 'friendship':
      return { bg: 'bg-[#F2E8FA]', text: 'text-[#8E44AD]', border: 'border-[#E0C6F5]' };
    case 'study':
      return { bg: 'bg-[#E8F4F8]', text: 'text-[#2980B9]', border: 'border-[#BDE0FE]' };
    case 'health':
      return { bg: 'bg-[#EAF7ED]', text: 'text-[#27AE60]', border: 'border-[#C8E6C9]' };
    case 'errands':
      return { bg: 'bg-[#FFF6E5]', text: 'text-[#D35400]', border: 'border-[#FFE0B2]' };
    case 'work':
      return { bg: 'bg-[#EDF2F7]', text: 'text-[#4A5568]', border: 'border-[#CBD5E0]' };
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#616161]', border: 'border-[#E0E0E0]' };
  }
}

export function getPersonAvatarColor(name: string): string {
  const colors = [
    'bg-[#FF986F] text-white',
    'bg-[#E29578] text-white',
    'bg-[#8E44AD] text-white',
    'bg-[#3498DB] text-white',
    'bg-[#27AE60] text-white',
    'bg-[#E67E22] text-white',
    'bg-[#16A085] text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
