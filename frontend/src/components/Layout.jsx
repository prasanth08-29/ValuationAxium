import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, FileText, Settings, LogOut, User, FilePlus, Layers } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();

    // Parse user safely
    let user = { name: 'Valuer' };
    try {
        const stored = localStorage.getItem('user');
        if (stored) user = JSON.parse(stored);
    } catch { }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

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
                        <li>
                            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors">
                                <Home className="w-5 h-5 text-gray-500" />
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link to="/reports" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                                <FileText className="w-5 h-5 text-gray-400" />
                                My Valuations
                            </Link>
                        </li>
                        <li>
                            <Link to="/entities" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                                <Layers className="w-5 h-5 text-gray-400" />
                                Entities
                            </Link>
                        </li>
                        <li>
                            <Link to="/templates" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                                <FilePlus className="w-5 h-5 text-gray-400" />
                                Templates
                            </Link>
                        </li>
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
            <main className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Bar (Basic implementation) text-gray */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50">
                <Link to="/dashboard" className="flex flex-col items-center text-primary-600">
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Home</span>
                </Link>
                <Link to="/reports" className="flex flex-col items-center text-gray-500 hover:text-gray-900">
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">History</span>
                </Link>
                <Link to="/entities" className="flex flex-col items-center text-gray-500 hover:text-gray-900">
                    <Layers className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Entities</span>
                </Link>
                <Link to="/templates" className="flex flex-col items-center text-gray-500 hover:text-gray-900">
                    <FilePlus className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Temp..</span>
                </Link>
                <button onClick={handleLogout} className="flex flex-col items-center text-gray-500 hover:text-red-500">
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px] mt-1 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
