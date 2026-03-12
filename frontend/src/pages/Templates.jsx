import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileUp, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Folder, Eye, Settings, Copy, Edit2, Trash2, UploadCloud, File, CheckCircle, Plus, GripVertical, Save } from 'lucide-react';
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
    const [activeEditIndex, setActiveEditIndex] = useState(null);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates`);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates/upload`, {
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

            // Default to Yes/No for dropdowns to save user effort
            if (key === 'type' && value === 'select' && (!next[index].options || next[index].options.length === 0)) {
                next[index].options = ['Yes', 'No'];
            }

            // Auto-update ID if label changes and it's basically the default or similar
            if (key === 'label' && next[index].id.startsWith('custom_field_')) {
                let baseId = value.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 60);
                if (baseId) {
                    let finalId = baseId;
                    let counter = 1;
                    // Ensure ID is unique across all fields
                    while (next.some((f, i) => i !== index && f.id === finalId)) {
                        finalId = `${baseId}_${counter}`;
                        counter++;
                    }
                    next[index].id = finalId;
                }
            }
            return next;
        });
    };

    const handleRemoveField = (index) => {
        setFields(prev => prev.filter((_, i) => i !== index));
    };

    const handleSyncIds = () => {
        showConfirm(
            'Sync Field IDs',
            'This will update all field IDs to match their current labels. This is useful for cleaning up messed-up templates, but will break any existing reports using this template. Proceed?',
            () => {
                setFields(prev => {
                    const next = [...prev];
                    const seenIds = new Set();
                    return next.map(f => {
                        let baseId = f.label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 60) || 'field';
                        let finalId = baseId;
                        let counter = 1;
                        while (seenIds.has(finalId)) {
                            finalId = `${baseId}_${counter}`;
                            counter++;
                        }
                        seenIds.add(finalId);
                        return { ...f, id: finalId };
                    });
                });
                showAlert('success', 'IDs Synced', 'All field IDs have been updated to match their labels.');
            },
            'Sync Now'
        );
    };

    const [hideConditionalInEditor, setHideConditionalInEditor] = useState(false);

    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !fields) {
            setError('Please provide a template name.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const url = editingTemplateId
                ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates/${editingTemplateId}`
                : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates`;

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
                showAlert('success', 'Success', 'Template saved successfully!');
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

            <div className={`grid grid-cols-1 ${(!editingTemplateId && !fields) ? 'lg:grid-cols-2' : ''} gap-8`}>
                {/* Upload Section */}
                {!editingTemplateId && !fields && (
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
                                    <div className="space-y-5 mb-8 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                </div>
                                                <p className="text-sm text-gray-700 font-medium">
                                                    Found <span className="text-primary-600 font-bold text-base px-1">{fields.length}</span> potential fields
                                                </p>
                                            </div>

                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Entity Type</label>
                                                    <div className="relative">
                                                        <select
                                                            value={entityType}
                                                            onChange={(e) => {
                                                                setEntityType(e.target.value);
                                                            }}
                                                            className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-3.5 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                                        >
                                                            <option value="bank">Bank Valuations</option>
                                                            <option value="vehicle">Vehicle Valuations</option>
                                                            <option value="individual">Individual Properties</option>
                                                            <option value="company">Company Assets</option>
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Template Name</label>
                                                    <input
                                                        type="text"
                                                        value={templateName}
                                                        onChange={(e) => {
                                                            setTemplateName(e.target.value);
                                                        }}
                                                        placeholder="e.g., Bank Vehicle Valuation"
                                                        className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-3.5 outline-none transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                                <button
                                                    onClick={handleSaveTemplate}
                                                    disabled={saving || !templateName.trim()}
                                                    className={`w-full sm:w-auto text-sm px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${(saving || !templateName.trim() ? 'bg-primary-50 text-primary-300 border border-primary-100 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 border border-transparent')
                                                        }`}
                                                >
                                                    {saving && <RefreshCw className="w-5 h-5 animate-spin" />}
                                                    <Save className="w-5 h-5" />
                                                    Save Template
                                                </button>

                                                {(editingTemplateId || fields) && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSyncIds}
                                                            className="text-xs px-3 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                                            title="Fix labels and IDs mismatch"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            Sync IDs
                                                        </button>
                                                        <button
                                                            onClick={() => setHideConditionalInEditor(!hideConditionalInEditor)}
                                                            className={`text-xs px-3 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 border ${hideConditionalInEditor ? 'bg-primary-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                                        >
                                                            {hideConditionalInEditor ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            {hideConditionalInEditor ? "Show All" : "Focus Mode"}
                                                        </button>
                                                        <button
                                                            onClick={handleClear}
                                                            className="text-xs px-3 py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent hover:border-gray-300"
                                                        >
                                                            {editingTemplateId ? "Cancel" : "Cancel"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {fields.map((field, index) => {
                                            const isConditional = !!(field.conditions?.length > 0 || field.dependsOn);
                                            if (hideConditionalInEditor && isConditional) return null;

                                            return (
                                            <div
                                                key={index}
                                                draggable
                                                onDragStart={(e) => dragItem.current = index}
                                                onDragEnter={(e) => dragOverItem.current = index}
                                                onDragEnd={handleSort}
                                                onDragOver={(e) => e.preventDefault()}
                                                className={`group bg-white border ${activeEditIndex === index ? 'border-primary-400 shadow-md ring-4 ring-primary-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'} rounded-2xl p-4 transition-all duration-200 ${isConditional ? 'ml-8 border-l-4 border-l-primary-300' : ''}`}
                                            >
                                                {activeEditIndex === index ? (
                                                    <>
                                                        <div className="flex items-start sm:items-center gap-2 sm:gap-4">
                                                            <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 mt-6 sm:mt-0 transition-colors">
                                                                <GripVertical className="w-5 h-5" />
                                                            </div>

                                                            <div className="flex-1 flex flex-col sm:flex-row gap-4">
                                                                <div className="flex-1 relative">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Field Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                                                                        className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-3 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div className="w-full sm:w-48 relative">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Input Type</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={field.type || 'text'}
                                                                            onChange={(e) => handleUpdateField(index, 'type', e.target.value.toLowerCase())}
                                                                            className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-3 outline-none transition-all cursor-pointer appearance-none"
                                                                        >
                                                                            <option value="text">Text / Short</option>
                                                                            <option value="textarea">Text / Long</option>
                                                                            <option value="number">Number</option>
                                                                            <option value="date">Date picker</option>
                                                                            <option value="select">Dropdown</option>
                                                                            <option value="radio">Radio Buttons</option>
                                                                            <option value="heading">Section Heading</option>
                                                                            <option value="subheading">Sub Heading</option>
                                                                            <option value="button">Button Action</option>
                                                                        </select>
                                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="pl-11 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="relative">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Field ID (Unique Key)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.id}
                                                                        onChange={(e) => handleUpdateField(index, 'id', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                                                        className="w-full bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-mono rounded-lg p-2 outline-none focus:border-primary-400 transition-all"
                                                                    />
                                                                </div>
                                                                <div className="relative">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Placeholder / Hint</label>
                                                                    <input
                                                                        type="text"
                                                                        value={field.placeholder || ''}
                                                                        onChange={(e) => handleUpdateField(index, 'placeholder', e.target.value)}
                                                                        className="w-full bg-white border border-gray-200 text-gray-800 text-[11px] font-medium rounded-lg p-2 outline-none focus:border-primary-400 transition-all"
                                                                        placeholder="e.g. Select an option..."
                                                                    />
                                                                </div>
                                                            </div>

                                                            <button onClick={() => setActiveEditIndex(null)} className="p-2 sm:mt-5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" title="Done Editing">
                                                                <CheckCircle2 className="w-6 h-6" />
                                                            </button>
                                                        </div>
                                                        {(field.type === 'text' || field.type === 'textarea' || !field.type) && (
                                                            <div className="mt-4 pl-11 flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`isList_${index}`}
                                                                    checked={field.isList || false}
                                                                    onChange={(e) => handleUpdateField(index, 'isList', e.target.checked)}
                                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 shadow-sm"
                                                                />
                                                                <label htmlFor={`isList_${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                                                    Allow multiple points (Bulleted List)
                                                                </label>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveEditIndex(index)}>
                                                        <div className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 transition-colors" onClick={(e) => e.stopPropagation()}>
                                                            <GripVertical className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <h3 className="text-sm font-semibold text-gray-900 truncate">{field.label || 'Unnamed Field'}</h3>
                                                            <p className="text-xs text-gray-500 mt-0.5 capitalize">
                                                                {field.type === 'textarea' ? 'Text / Long' : field.type === 'text' ? 'Text / Short' : field.type || 'Text / Short'}
                                                                {field.isList ? ' (Bulleted)' : ''}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveEditIndex(index); }}
                                                            className="p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                            title="Edit Field"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveField(index); }}
                                                            className="p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Remove Field"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {activeEditIndex === index && field.type === 'select' && (
                                                    <div className="w-full space-y-3 mt-4 pl-8 sm:pl-11">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Choices</h4>
                                                                <p className="text-[9px] text-gray-400 pl-1 italic">Button names shown to user</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const currentOptions = Array.isArray(field.options) ? field.options : [];
                                                                    handleUpdateField(index, 'options', [...currentOptions, '']);
                                                                }}
                                                                className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" /> Add Choice
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {(Array.isArray(field.options) ? field.options : []).map((opt, optIdx) => (
                                                                <div key={optIdx} className="group/opt flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 hover:border-primary-100 transition-all">
                                                                     {field.type === 'radio' && (
                                                                         <div className="w-4 h-4 rounded-full border-2 border-gray-300 ml-2 shrink-0"></div>
                                                                     )}
                                                                     <input
                                                                        type="text"
                                                                        value={opt}
                                                                        onChange={(e) => {
                                                                            const newOpts = [...field.options];
                                                                            newOpts[optIdx] = e.target.value;
                                                                            handleUpdateField(index, 'options', newOpts);
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                const currentOptions = Array.isArray(field.options) ? field.options : [];
                                                                                handleUpdateField(index, 'options', [...currentOptions, '']);
                                                                            }
                                                                        }}
                                                                        className="flex-1 bg-white border-none text-gray-800 text-xs font-semibold rounded-lg p-2 focus:ring-2 focus:ring-primary-500/20 outline-none"
                                                                        placeholder="e.g., Good"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const newOpts = field.options.filter((_, i) => i !== optIdx);
                                                                            handleUpdateField(index, 'options', newOpts);
                                                                        }}
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/opt:opacity-100"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {(Array.isArray(field.options) ? field.options : []).length === 0 && (
                                                                <p className="text-[10px] text-gray-400 italic col-span-2 py-2 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                                    No choices added. Click "Add Choice" to start.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {activeEditIndex === index && field.type !== 'button' && (
                                                    <div className="mt-6 border-t border-gray-100 pt-4 pl-11">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Conditional Visibility</h4>
                                                            <div className="relative group/add">
                                                                 <select
                                                                    value=""
                                                                    onChange={(e) => {
                                                                        const fieldId = e.target.value;
                                                                        if (!fieldId) return;
                                                                        const currentConditions = field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : []);
                                                                        handleUpdateField(index, 'conditions', [...currentConditions, { fieldId, value: '' }]);
                                                                        handleUpdateField(index, 'dependsOn', undefined);
                                                                        handleUpdateField(index, 'dependsOnValue', undefined);
                                                                    }}
                                                                    className="text-[10px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors outline-none cursor-pointer appearance-none pr-8"
                                                                >
                                                                    <option value="">+ Make this field depend on...</option>
                                                                    {(() => {
                                                                        const seenIds = new Set();
                                                                        let currentHeading = "";
                                                                        return fields.filter((f, i) => {
                                                                            if (f.type === 'heading' || f.type === 'subheading') {
                                                                                currentHeading = f.label;
                                                                                return false;
                                                                            }
                                                                            if (i === index) return false;
                                                                            if (seenIds.has(f.id)) return false;
                                                                            if (f.type === 'button') return false;
                                                                            seenIds.add(f.id);
                                                                            f._context = currentHeading; // Temporary context for mapping
                                                                            return true;
                                                                        }).map(f => (
                                                                            <option key={f.id} value={f.id}>
                                                                                {f._context ? `${f._context} > ` : ''}{f.label || f.id}
                                                                            </option>
                                                                        ));
                                                                    })()}
                                                                </select>
                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                    <Plus className="w-3 h-3 text-primary-600" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {(field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : [])).map((cond, condIdx) => {
                                                                const parentField = fields.find(f => f.id === cond.fieldId);
                                                                const parentOptions = parentField ?
                                                                    (Array.isArray(parentField.options) ? parentField.options :
                                                                        (typeof parentField.options === 'string' ? parentField.options.split(',').map(o => o.trim()) : []))
                                                                    : [];
                                                                const hasOptions = parentField && (parentField.type === 'select' || parentField.type === 'radio') && parentOptions.length > 0;

                                                                return (
                                                                    <div key={condIdx} className="flex gap-2 items-end group/cond">
                                                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 group-hover/cond:border-primary-200 transition-colors">
                                                                            <div className="relative">
                                                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Show this field if:</label>
                                                                                <div className="relative">
                                                                                     <select
                                                                                        value={cond.fieldId}
                                                                                        onChange={(e) => {
                                                                                            const newConds = [...(field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : []))];
                                                                                            newConds[condIdx] = { ...newConds[condIdx], fieldId: e.target.value, value: '' }; // Reset value when field changes
                                                                                            handleUpdateField(index, 'conditions', newConds);
                                                                                        }}
                                                                                        className="w-full bg-white border border-gray-200 text-gray-800 text-xs font-medium rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-2 outline-none transition-all appearance-none cursor-pointer"
                                                                                    >
                                                                                        <option value="">Select Field...</option>
                                                                                        {(() => {
                                                                                            const seenIds = new Set();
                                                                                            let currentHeading = "";
                                                                                            return fields.filter((f, i) => {
                                                                                                if (f.type === 'heading' || f.type === 'subheading') {
                                                                                                    currentHeading = f.label;
                                                                                                    return false;
                                                                                                }
                                                                                                if (i === index) return false;
                                                                                                if (seenIds.has(f.id)) return false;
                                                                                                if (f.type === 'button') return false;
                                                                                                seenIds.add(f.id);
                                                                                                f._context = currentHeading;
                                                                                                return true;
                                                                                            }).map(f => (
                                                                                                <option key={f.id} value={f.id}>
                                                                                                    {f._context ? `${f._context} > ` : ''}{f.label || f.id}
                                                                                                </option>
                                                                                            ));
                                                                                        })()}
                                                                                    </select>
                                                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="relative">
                                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Show if Value is</label>
                                                                                {hasOptions ? (
                                                                                    <div className="relative">
                                                                                        <select
                                                                                            value={cond.value}
                                                                                            onChange={(e) => {
                                                                                                const newConds = [...(field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : []))];
                                                                                                newConds[condIdx] = { ...newConds[condIdx], value: e.target.value };
                                                                                                handleUpdateField(index, 'conditions', newConds);
                                                                                            }}
                                                                                            className="w-full bg-white border border-gray-200 text-gray-800 text-xs font-medium rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-2 outline-none transition-all appearance-none cursor-pointer"
                                                                                        >
                                                                                            <option value="">Select Value...</option>
                                                                                            {parentOptions.filter(o => o && o.trim()).map(opt => (
                                                                                                <option key={opt} value={opt}>{opt}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <input
                                                                                        type="text"
                                                                                        value={cond.value}
                                                                                        onChange={(e) => {
                                                                                            const newConds = [...(field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : []))];
                                                                                            newConds[condIdx] = { ...newConds[condIdx], value: e.target.value };
                                                                                            handleUpdateField(index, 'conditions', newConds);
                                                                                        }}
                                                                                        placeholder="e.g., Yes"
                                                                                        className="w-full bg-white border border-gray-200 text-gray-800 text-xs font-medium rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-2 outline-none transition-all"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newConds = (field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : [])).filter((_, i) => i !== condIdx);
                                                                                handleUpdateField(index, 'conditions', newConds);
                                                                            }}
                                                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-lg hover:border-red-100 hover:bg-red-50 mb-1"
                                                                            title="Delete Condition"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-2 italic">* Field will show only if ALL conditions are met (AND logic).</p>
                                                    </div>
                                                )}

                                                {activeEditIndex === index && field.type === 'button' && (
                                                    <div className="w-full space-y-1 mt-4 pl-8 sm:pl-11 relative">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Button Action</label>
                                                        <div className="relative">
                                                            <select
                                                                value={field.buttonType || 'button'}
                                                                onChange={(e) => handleUpdateField(index, 'buttonType', e.target.value)}
                                                                className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 block p-3 outline-none transition-all cursor-pointer appearance-none"
                                                            >
                                                                <option value="button">Normal Button</option>
                                                                <option value="submit">Submit Form</option>
                                                                <option value="reset">Reset Form</option>
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        );
                                        })}

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
                                                        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates/${template.id}`, { method: 'DELETE' });
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
