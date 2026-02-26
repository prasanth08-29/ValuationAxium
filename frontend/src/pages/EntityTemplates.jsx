import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Calendar, AlertCircle, Trash2 } from 'lucide-react';

const ENTITY_DETAILS = {
    bank: { title: 'Bank Valuations', color: 'blue' },
    vehicle: { title: 'Vehicle Valuations', color: 'amber' },
    individual: { title: 'Individual Properties', color: 'emerald' },
    company: { title: 'Company Assets', color: 'purple' }
};

export default function EntityTemplates() {
    const { entityType } = useParams();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const entityInfo = ENTITY_DETAILS[entityType] || { title: 'Valuations', color: 'gray' };

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/templates?entity=${entityType}`);
                if (!response.ok) throw new Error('Failed to fetch templates');
                const data = await response.json();
                setTemplates(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [entityType]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/entities" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{entityInfo.title}</h1>
                        <p className="text-gray-600 text-sm mt-1">Manage and use templates for this entity.</p>
                    </div>
                </div>

                <Link
                    to="/templates"
                    className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Template
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 object-contain">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Available Templates</h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-primary-500 animate-spin mb-4"></div>
                        <p>Loading templates...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100 py-8">
                        <AlertCircle className="w-6 h-6" />
                        <p>{error}</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                        <FileText className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-gray-900 font-medium text-lg">No templates found</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm">There are currently no templates created for {entityType}. Go to the Templates tab to upload a new one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map(template => (
                            <div key={template.id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all group flex flex-col relative">
                                <Link
                                    to={`/valuation/new/${template.id}`}
                                    className="flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between mb-4 mt-2">
                                        <div className={`p-2 rounded-lg bg-${entityInfo.color}-100 text-${entityInfo.color}-600`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium mr-10 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                                            {template.fields.length} Fields
                                        </span>
                                    </div>

                                    <h3 className="text-gray-900 font-bold text-lg mb-1 leading-tight group-hover:text-primary-600 transition-colors pr-10">
                                        {template.name}
                                    </h3>

                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(template.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 flex items-center gap-1">
                                            Select
                                            <span>→</span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all z-50">
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to remove the ${template.name} template from this entity?`)) {
                                                try {
                                                    const res = await fetch(`http://localhost:5000/api/templates/${template.id}/unlink`, { method: 'PATCH' });
                                                    if (res.ok) {
                                                        setTemplates(templates.filter(t => t.id !== template.id));
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to unlink template', err);
                                                }
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm bg-white"
                                        title="Remove template from entity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
