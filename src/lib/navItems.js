import { LayoutDashboard, Building2, Users, BarChart3, BookOpen } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'סקירה כללית', icon: LayoutDashboard },
  { to: '/institutions', label: 'מוסדות', icon: Building2 },
  { to: '/users', label: 'משתמשים', icon: Users },
  { to: '/statistics', label: 'סטטיסטיקות', icon: BarChart3 },
  { to: '/content', label: 'תוכן', icon: BookOpen },
];
