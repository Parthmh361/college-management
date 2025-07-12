'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Users,
  BookOpen,
  Clock,
  GraduationCap,
  BarChart3,
  Settings,
  MessageSquare,
  QrCode,
  Home,
  Calendar,
} from 'lucide-react';

const adminLinks = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { label: 'Users Management', href: '/admin/users-management', icon: Users },
  { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { label: 'Timetable', href: '/admin/timetable', icon: Clock },
  { label: 'Academic Management', href: '/admin/management', icon: GraduationCap },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
];

export default function Sidebar({ user, className }: { user: any; className?: string }) {
  const router = useRouter();

  // You can add role-based links here if needed
  const links = adminLinks;

  return (
    <aside
      className={cn(
        'bg-white border-r shadow-sm min-h-screen w-64 fixed z-40 left-0 top-0 flex flex-col transition-transform duration-200',
        'transform translate-x-0 md:relative md:translate-x-0',
        className
      )}
    >
      <div className="flex items-center h-16 px-6 border-b">
        <span className="font-bold text-lg">College Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {links.map((item) => (
            <li key={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}