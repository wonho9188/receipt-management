import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/upload', label: '영수증 등록', icon: '📷' },
  { to: '/receipts', label: '영수증 목록', icon: '🧾' },
  { to: '/calendar', label: '달력', icon: '📅' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2">
              <span className="text-2xl">🧾</span>
              <h1 className="text-xl font-bold text-gray-900">영수증 관리</h1>
            </NavLink>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`
              }
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
