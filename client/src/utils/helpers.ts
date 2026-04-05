import { API_BASE } from '../config';

export function getAvatarUrl(item: { avatarUrl?: string; name: string }): string {
  if (item.avatarUrl) {
    if (item.avatarUrl.startsWith('/uploads/')) {
      return `${API_BASE}${item.avatarUrl}`;
    }
    return item.avatarUrl;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`;
}

export const STATUS_COLORS: Record<string, string> = {
  new: 'blue',
  under_review: 'orange',
  interview: 'purple',
  accepted: 'green',
  declined: 'red',
  waitlisted: 'gold',
  arbitration: 'volcano',
};
