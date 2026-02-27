import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Home as HomeIcon, Car, Briefcase, FilePlus2, ChevronRight, Clock, FileText } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    const templates = [
        { id: 'bank', title: 'Bank Property', description: 'Standard format for bank loans', icon: Building2, color: 'bg-blue-100 text-blue-600' },
        { id: 'individual', title: 'Individual Property', description: 'For private individuals', icon: HomeIcon, color: 'bg-green-100 text-green-600' },
        { id: 'vehicle', title: 'Vehicle Valuation', description: 'Cars, trucks & commercial', icon: Car, color: 'bg-amber-100 text-amber-600' },
        { id: 'company', title: 'Company Assets', description: 'Corporate valuations for auditing, acquisitions and financial reporting.', icon: Briefcase, color: 'bg-purple-100 text-purple-600' },
    ];

    const [recentValuations, setRecentValuations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [selectedEntityId, setSelectedEntityId] = useState('');

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

    const handleTemplateClick = async (entityId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/templates?entity=${entityId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.length > 1) {
                    setAvailableTemplates(data);
                    setSelectedEntityId(entityId);
                    setShowTemplateModal(true);
                } else if (data.length === 1) {
                    navigate(`/valuation/new/${data[0].id || data[0]._id}`);
                } else {
                    // Fallback to default
                    showAlert('No Templates Found', 'No templates have been configured for this entity category yet. Please create one in the Entities or Templates tab.', 'error');
                }
            } else {
                showAlert('No Templates Found', 'No templates have been configured for this entity category yet. Please create one in the Entities or Templates tab.', 'error');
            }
        } catch (error) {
            showAlert('Error', 'Failed to load templates.', 'error');
        }
    };

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {templates.map((tpl) => (
                        <button
                            key={tpl.id}
                            onClick={() => handleTemplateClick(tpl.id)}
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

            {/* Template Selection Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Select a Template</h3>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                            <p className="text-sm text-gray-500 mb-4">You have multiple templates for this category. Please select which one to base your valuation on:</p>
                            {availableTemplates.map(t => (
                                <button
                                    key={t.id || t._id}
                                    onClick={() => navigate(`/valuation/new/${t.id || t._id}`)}
                                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center gap-3 group"
                                >
                                    <div className="bg-primary-100 text-primary-600 p-2 rounded-lg group-hover:bg-primary-200">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{t.name}</h4>
                                        <p className="text-xs text-gray-500">{t.fields?.length || 0} fields configured</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
