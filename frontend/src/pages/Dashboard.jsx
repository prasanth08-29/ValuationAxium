import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Home as HomeIcon, Car, FilePlus2, ChevronRight, Clock, FileText } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();

    const templates = [
        { id: 'bank', title: 'Bank Property', description: 'Standard format for bank loans', icon: Building2, color: 'bg-blue-100 text-blue-600' },
        { id: 'individual', title: 'Individual Property', description: 'For private individuals', icon: HomeIcon, color: 'bg-green-100 text-green-600' },
        { id: 'vehicle', title: 'Vehicle Valuation', description: 'Cars, trucks & commercial', icon: Car, color: 'bg-purple-100 text-purple-600' },
    ];

    const [recentValuations, setRecentValuations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentActivity = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/reports', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    const reportList = data.reports || [];
                    const sorted = reportList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setRecentValuations(sorted.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch recent activity:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentActivity();
    }, []);

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
                    <p className="text-gray-500 mt-1">Start a new valuation or resume drafts.</p>
                </div>
            </header>

            {/* Templates Section */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Start New Valuation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templates.map((tpl) => (
                        <button
                            key={tpl.id}
                            onClick={() => navigate(`/valuation/new/${tpl.id}`)}
                            className="text-left bg-white p-5 rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-xl ${tpl.color}`}>
                                    <tpl.icon className="w-6 h-6" />
                                </div>
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-primary-50 transition-colors">
                                    <FilePlus2 className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                                </div>
                            </div>
                            <h4 className="mt-4 text-lg font-bold text-gray-900">{tpl.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{tpl.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</h3>
                    <button
                        onClick={() => navigate('/reports')}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                    >
                        View All
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[100px] relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                        </div>
                    ) : recentValuations.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p>No recent valuation activity.</p>
                            <button
                                onClick={() => navigate('/templates')}
                                className="text-sm text-primary-600 font-medium hover:underline mt-2"
                            >
                                Create your first valuation
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {recentValuations.map((val) => (
                                <li key={val.id}>
                                    <button
                                        onClick={() => navigate('/reports')}
                                        className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="bg-gray-100 p-2 rounded-lg mt-0.5">
                                                <Clock className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium">{val.title}</p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${val.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {val.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <span className="text-sm text-gray-500 hidden sm:block">
                                                {new Date(val.createdAt).toLocaleDateString()}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
