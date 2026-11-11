import {
  Utensils, Wine, Coffee, Croissant, ShoppingBag, Store, Landmark, Camera, Ticket, Home, Plane, GraduationCap,
} from 'lucide-react';
import type { Category } from '../types';

export const CAT: Record<Category, { label: string; color: string; emoji: string; Icon: typeof Utensils }> = {
  food: { label: 'Food', color: '#b5452f', emoji: '🍽️', Icon: Utensils },
  drinks: { label: 'Drinks', color: '#7b2d5b', emoji: '🍸', Icon: Wine },
  coffee: { label: 'Coffee', color: '#7a5230', emoji: '☕', Icon: Coffee },
  bakery: { label: 'Bakery', color: '#c27c2c', emoji: '🥐', Icon: Croissant },
  shopping: { label: 'Shopping', color: '#2a6f6b', emoji: '🛍️', Icon: ShoppingBag },
  boutique: { label: 'Boutique', color: '#2f7d6d', emoji: '👜', Icon: Store },
  sight: { label: 'Sightseeing', color: '#1d4e89', emoji: '🏛️', Icon: Landmark },
  photo: { label: 'Photo spot', color: '#5a4fa3', emoji: '📸', Icon: Camera },
  fun: { label: 'Fun', color: '#c0392b', emoji: '🎟️', Icon: Ticket },
  lodging: { label: 'Home base', color: '#14213d', emoji: '🏠', Icon: Home },
  transport: { label: 'Travel', color: '#475569', emoji: '✈️', Icon: Plane },
  event: { label: 'Event', color: '#8a1c1c', emoji: '🎓', Icon: GraduationCap },
};

export const priceStr = (p?: number) => (p ? '$'.repeat(p) : '');
