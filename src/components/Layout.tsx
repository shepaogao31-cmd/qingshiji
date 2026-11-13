import { Outlet } from 'react-router-dom';
import BottomTabBar from '@/components/BottomTabBar';
import HealthDisclaimer from '@/components/HealthDisclaimer';

export const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <HealthDisclaimer />
      <BottomTabBar />
    </div>
  );
};
