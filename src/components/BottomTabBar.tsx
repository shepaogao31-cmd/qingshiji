import { NavLink } from 'react-router-dom';
import { Home, Utensils, Activity, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: Home, end: true },
  { path: '/diet', label: '饮食', icon: Utensils, end: false },
  { path: '/exercise', label: '运动', icon: Activity, end: false },
  { path: '/training', label: '计划', icon: Dumbbell, end: false },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card shadow-[0_-1px_2px_0_rgba(0_0_0_0.03)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[12px] transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              <span className="text-[12px]">{item.label}</span>
              {item.end && (
                <span
                  className={cn(
                    'absolute bottom-0 h-0.5 w-6 rounded-full bg-primary transition-opacity',
                    'opacity-0',
                  )}
                />
              )}
            </NavLink>
          );
        })}
      </div>
      {/* iPhone 底部安全区 */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
