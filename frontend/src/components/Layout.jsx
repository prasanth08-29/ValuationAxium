import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Settings, LogOut, User, FilePlus, Layers } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Parse user safely
    let user = { name: 'Valuer' };
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch { }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authStateChange'));
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const navItemsDesktop = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/reports', label: 'My Valuations', icon: FileText },
        { path: '/entities', label: 'Entities', icon: Layers },
        { path: '/templates', label: 'Templates', icon: FilePlus },
    ];

    const navItemsMobile = [
        { path: '/dashboard', label: 'Home', icon: Home },
        { path: '/reports', label: 'History', icon: FileText },
        { path: '/entities', label: 'Entities', icon: Layers },
        { path: '/templates', label: 'Temp..', icon: FilePlus },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            {/* Sidebar for Desktop / Top Nav for Mobile */}
            <nav className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex flex-col">
                <div className="p-4 flex items-center justify-between md:justify-center border-b border-gray-200">
                    <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">AV</span>
                        </div>
                        AxiumValuation
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto hidden md:block py-4">
                    <ul className="space-y-1 px-3">
                        {navItemsDesktop.map((item) => (
                            <li key={item.path}>
                                <Link 
                                    to={item.path} 
                                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                        isActive(item.path) 
                                            ? 'text-gray-900 bg-gray-100' 
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-gray-500' : 'text-gray-400'}`} />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-4 border-t border-gray-200 hidden md:block">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="flex-1 truncate">{user.name}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Bar (Basic implementation) text-gray */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50">
                {navItemsMobile.map((item) => (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`flex flex-col items-center ${
                            isActive(item.path) ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </Link>
                ))}
                <button onClick={handleLogout} className="flex flex-col items-center text-gray-500 hover:text-red-500">
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}

