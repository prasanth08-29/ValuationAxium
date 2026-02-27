import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileUp, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Folder, Eye, Settings, Copy, Edit2, Trash2, UploadCloud, File, CheckCircle, Plus, GripVertical } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function Templates() {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fields, setFields] = useState(null);
    const location = useLocation();
    const [templateName, setTemplateName] = useState('');
    const [entityType, setEntityType] = useState(location.state?.entityType || 'bank');
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const { showAlert, showConfirm } = useAlert();
    const fileInputRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleSort = () => {
        let _fields = [...fields];
        const draggedItemContent = _fields.splice(dragItem.current, 1)[0];
        _fields.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setFields(_fields);
    };

    const fetchTemplates = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    React.useEffect(() => {
        fetchTemplates();
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.docx')) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError('Only Microsoft Word (.docx) files are supported.');
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setFields(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/api/templates/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to parse document');
            }

            const data = await response.json();
            if (data.success) {
                setFields(data.fields);
            } else {
                throw new Error(data.error || 'Parsing failed');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while uploading.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditTemplate = (template) => {
        setFields([...template.fields]);
        setTemplateName(template.name);
        setEntityType(template.entity);
        setEditingTemplateId(template.id);
        setFile(null); // Clear file upload state since we are editing an existing
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up to the editor
    };

    const handleClear = () => {
        setFile(null);
        setFields(null);
        setError(null);
        setSaveSuccess(false);
        setEditingTemplateId(null);
        setTemplateName('');
    };

    const handleAddField = () => {
        setFields(prev => [...prev, {
            id: `custom_field_${Date.now()}`,
            label: 'New Custom Field',
            type: 'text',
            placeholder: 'Enter detail...'
        }]);
    };

    const handleUpdateField = (index, key, value) => {
        setFields(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [key]: value };

            // Auto-update ID if label changes and it's basically the default or similar
            if (key === 'label' && next[index].id.startsWith('custom_field_')) {
                next[index].id = value.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 60) || next[index].id;
            }
            return next;
        });
    };

    const handleRemoveField = (index) => {
        setFields(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !fields) {
            setError('Please provide a template name.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const url = editingTemplateId
                ? `http://localhost:5000/api/templates/${editingTemplateId}`
                : 'http://localhost:5000/api/templates';

            const method = editingTemplateId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: templateName,
                    entity: entityType,
                    fields: fields
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save template');
            }

            const data = await response.json();
            if (data.success) {
                setSaveSuccess(true);
                fetchTemplates(); // Refresh the list
                setEditingTemplateId(null); // Clear editing state after success
            } else {
                throw new Error(data.error || 'Saving failed');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
            <p className="text-gray-600">Upload a Word document (.docx) to automatically extract and generate form fields.</p>

            <div className={`grid grid-cols-1 ${!editingTemplateId ? 'lg:grid-cols-2' : ''} gap-8`}>
                {/* Upload Section */}
                {!editingTemplateId && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Template</h2>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-primary-500 bg-primary-50' :
                                file ? 'border-green-300 bg-green-50' :
                                    'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                            onClick={() => !file && fileInputRef.current?.click()}
                        >
                            {file ? (
                                <div className="text-center">
                                    <File className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    <div className="mt-4 flex gap-3 justify-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center cursor-pointer">
                                    <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-900">Click or drag file to this area to upload</p>
                                    <p className="text-xs text-gray-500 mt-1">Support for .docx files</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".docx"
                                onChange={handleFileSelect}
                            />
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-start gap-2 text-sm border border-red-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading || fields !== null}
                            className={`mt-4 w-full py-2.5 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-colors ${!file || fields !== null ? 'bg-gray-300 cursor-not-allowed' :
                                'bg-primary-600 hover:bg-primary-700 shadow-sm'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Analyzing Document...
                                </>
                            ) : fields ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Processed Successfully
                                </>
                            ) : (
                                'Generate Form'
                            )}
                        </button>
                    </div>
                )}

                {/* Preview Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Form Preview</h2>

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary-500 animate-spin mb-4"></div>
                            <p>Extracting fields from document...</p>
                        </div>
                    ) : fields ? (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {fields.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="space-y-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600 font-medium">
                                                Found <span className="text-primary-600 font-bold">{fields.length}</span> potential fields.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Entity Type</label>
                                                    <select
                                                        value={entityType}
                                                        onChange={(e) => {
                                                            setEntityType(e.target.value);
                                                            setSaveSuccess(false);
                                                        }}
                                                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors"
                                                        disabled={saveSuccess}
                                                    >
                                                        <option value="bank">Bank</option>
                                                        <option value="vehicle">Vehicle</option>
                                                        <option value="individual">Individual</option>
                                                        <option value="company">Company</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Template Name</label>
                                                    <input
                                                        type="text"
                                                        value={templateName}
                                                        onChange={(e) => {
                                                            setTemplateName(e.target.value);
                                                            setSaveSuccess(false);
                                                        }}
                                                        placeholder="E.g., Bank Vehicle Valuation"
                                                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none transition-colors"
                                                        disabled={saveSuccess}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={handleSaveTemplate}
                                                    disabled={saving || saveSuccess || !templateName.trim()}
                                                    className={`flex-1 text-sm px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${saveSuccess ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        (saving || !templateName.trim() ? 'bg-primary-100 text-primary-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm')
                                                        }`}
                                                >
                                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : null}
                                                    {saveSuccess ? 'Saved Successfully!' : 'Save Template'}
                                                </button>

                                                {editingTemplateId && (
                                                    <button
                                                        onClick={handleClear}
                                                        className="text-sm px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    >
                                                        Cancel Editing
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div
                                                key={index}
                                                draggable
                                                onDragStart={(e) => dragItem.current = index}
                                                onDragEnter={(e) => dragOverItem.current = index}
                                                onDragEnd={handleSort}
                                                onDragOver={(e) => e.preventDefault()}
                                                className="space-y-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 transition-colors group relative shadow-sm cursor-move"
                                            >
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                                    <button onClick={() => handleRemoveField(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Remove Field">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-xs font-semibold text-gray-700 uppercase">Field Label</label>
                                                        <input
                                                            type="text"
                                                            value={field.label}
                                                            onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
                                                        />
                                                    </div>
                                                    <div className="w-1/3 space-y-1">
                                                        <label className="text-xs font-semibold text-gray-700 uppercase">Input Type</label>
                                                        <select
                                                            value={field.type || 'text'}
                                                            onChange={(e) => handleUpdateField(index, 'type', e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
                                                        >
                                                            <option value="text">Text / Short</option>
                                                            <option value="textarea">Textarea / Long</option>
                                                            <option value="number">Number</option>
                                                            <option value="date">Date</option>
                                                            <option value="select">Dropdown</option>
                                                            <option value="button">Button</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {field.type === 'select' && (
                                                    <div className="w-full space-y-1 mt-2">
                                                        <label className="text-xs font-semibold text-gray-700 uppercase">Options (Comma separated)</label>
                                                        <input
                                                            type="text"
                                                            value={field.options ? field.options.join(', ') : ''}
                                                            onChange={(e) => handleUpdateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                            placeholder="Option 1, Option 2, Option 3"
                                                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
                                                        />
                                                    </div>
                                                )}

                                                {field.type === 'button' && (
                                                    <div className="w-full space-y-1 mt-2">
                                                        <label className="text-xs font-semibold text-gray-700 uppercase">Button Action</label>
                                                        <select
                                                            value={field.buttonType || 'button'}
                                                            onChange={(e) => handleUpdateField(index, 'buttonType', e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
                                                        >
                                                            <option value="button">Normal Button</option>
                                                            <option value="submit">Submit Form</option>
                                                            <option value="reset">Reset Form</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            onClick={handleAddField}
                                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 flex items-center justify-center gap-2 transition-all font-medium text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Custom Field
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center py-12">
                                    <AlertCircle className="w-12 h-12 text-yellow-400 mb-3" />
                                    <p className="font-medium text-gray-900">No detectable fields found.</p>
                                    <p className="text-sm mt-1 max-w-xs">We couldn't automatically detect fields like "Name: _____" or "Address:" in this document.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <File className="w-12 h-12 mb-3 opacity-20" />
                            <p>Upload a document to see the generated form here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Saved Templates Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Templates</h2>

                {loadingTemplates ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-primary-500 animate-spin"></div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
                        No templates have been added yet. Give it a shot above!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template) => (
                            <div key={template.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col group relative">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleEditTemplate(template);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                        title="Edit template"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            showConfirm(
                                                'Remove Template',
                                                'Are you sure you want to remove this template?',
                                                async () => {
                                                    try {
                                                        const res = await fetch(`http://localhost:5000/api/templates/${template.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            setTemplates(templates.filter(t => t.id !== template.id));
                                                            showAlert('Success', 'Template removed successfully', 'success');
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to delete template', err);
                                                        showAlert('Error', 'Failed to remove template', 'error');
                                                    }
                                                },
                                                'Remove'
                                            );
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Remove template"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-md font-medium capitalize border border-primary-100">
                                            {template.entity}
                                        </span>
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium mr-8">
                                        {template.fields.length} Fields
                                    </span>
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg mb-1">{template.name}</h3>
                                <div className="text-xs text-gray-500 mt-auto pt-4 flex items-center gap-1.5">
                                    <File className="w-3.5 h-3.5" />
                                    Added on {new Date(template.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )
                }
            </div >

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </div >
    );
}
