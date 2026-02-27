import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Calendar, AlertCircle, Trash2, Copy, X } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const ENTITY_DETAILS = {
    bank: { title: 'Bank Valuations', color: 'blue' },
    vehicle: { title: 'Vehicle Valuations', color: 'amber' },
    individual: { title: 'Individual Properties', color: 'emerald' },
    company: { title: 'Company Assets', color: 'purple' }
};

export default function EntityTemplates() {
    const { entityType } = useParams();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [allTemplates, setAllTemplates] = useState([]);
    const [importingError, setImportingError] = useState('');
    const { showAlert, showConfirm } = useAlert();

    const entityInfo = ENTITY_DETAILS[entityType] || { title: 'Valuations', color: 'gray' };

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates?entity=${entityType}`);
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
        fetchAllTemplates();
    }, [entityType]);

    const fetchAllTemplates = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates`);
            if (response.ok) {
                const data = await response.json();
                setAllTemplates(data);
            }
        } catch (err) {
            console.error('Failed to fetch all templates', err);
        }
    };

    const importTemplate = async (templateId) => {
        const sourceTemplate = allTemplates.find(t => t.id === templateId);
        if (!sourceTemplate) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates/${templateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: sourceTemplate.name,
                    entity: entityType,
                    fields: sourceTemplate.fields
                })
            });
            if (response.ok) {
                const data = await response.json();
                const updatedTemplate = data.template || data;
                setTemplates([...templates, updatedTemplate]);
                setAllTemplates(allTemplates.filter(t => t.id !== templateId));
                setShowImportModal(false);
            } else {
                setImportingError('Failed to import template.');
            }
        } catch (err) {
            setImportingError('Error connecting to server.');
        }
    };

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

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                        <Copy className="w-4 h-4 text-gray-400" />
                        Import Template
                    </button>
                    <Link
                        to="/templates"
                        state={{ entityType }}
                        className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </Link>
                </div>
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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            showConfirm(
                                                'Delete Template',
                                                `Are you sure you want to permanently delete the ${template.name} template?`,
                                                async () => {
                                                    try {
                                                        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates/${template.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            setTemplates(templates.filter(t => t.id !== template.id));
                                                            showAlert('Success', 'Template deleted successfully', 'success');
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to delete template', err);
                                                        showAlert('Error', 'Failed to delete template', 'error');
                                                    }
                                                },
                                                'Delete'
                                            );
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm bg-white"
                                        title="Delete template permanently"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Import Template</h2>
                            <button onClick={() => setShowImportModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {importingError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-start gap-2 text-sm border border-red-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{importingError}</p>
                            </div>
                        )}

                        <p className="text-gray-600 mb-4 text-sm">Select a template from main templates to copy into this entity:</p>

                        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allTemplates.filter(t => t.entity !== entityType).length === 0 ? (
                                <p className="text-gray-500 text-center col-span-2 py-8">No templates available to import from other entities.</p>
                            ) : (
                                allTemplates.filter(t => t.entity !== entityType).map(t => (
                                    <div key={t.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors flex flex-col cursor-pointer bg-gray-50 hover:bg-primary-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 bg-primary-100 px-2 py-0.5 rounded-md">{t.entity}</span>
                                            <span className="text-xs text-gray-500">{t.fields?.length || 0} fields</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-4 truncate">{t.name}</h3>
                                        <button
                                            onClick={() => importTemplate(t.id)}
                                            className="mt-auto w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:border-primary-500 hover:text-primary-600 transition-colors"
                                        >
                                            Import to {entityInfo.title}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
