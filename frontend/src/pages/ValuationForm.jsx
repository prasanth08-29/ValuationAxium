import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Camera, CheckCircle2, Download, AlertCircle, UploadCloud, Image as ImageIcon, X, MapPin } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAlert } from '../context/AlertContext';

function BulletInput({ value = [], onChange, label, error, register, id }) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem();
        }
    };

    const addItem = () => {
        if (inputValue.trim()) {
            onChange([...value, inputValue.trim()]);
            setInputValue("");
        }
    };

    const removeItem = (index) => {
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Type an item and press Enter...`}
                    className={`flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-primary-50 focus:ring-4 transition-all text-gray-900 bg-white`}
                />
                <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-primary-50 text-primary-600 font-bold rounded-xl hover:bg-primary-100 transition-colors"
                >
                    Add
                </button>
            </div>

            {(value && value.length > 0) ? (
                <ul className="space-y-2">
                    {value.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group hover:border-primary-200 transition-all">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                                <span className="text-sm text-gray-800 font-medium">{item}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-gray-400 italic pl-1">No points added yet.</p>
            )}
        </div>
    );
}

const captureLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            resolve(null);
            return;
        }

        if (!window.isSecureContext) {
            alert("Location capture requires a secure (HTTPS) connection. Please ensure you are using HTTPS.");
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log("Location captured:", pos.coords.latitude, pos.coords.longitude);
                resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                let msg = "Could not capture location.";
                if (err.code === 1) msg = "Location permission denied. Please enable GPS and allow browser access.";
                else if (err.code === 2) msg = "Location unavailable (GPS signal weak).";
                else if (err.code === 3) msg = "Location request timed out.";

                console.warn("Location capture failed:", err);
                alert(msg);
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    });
};

const compressImage = (base64Str, maxWidth = 1200, maxHeight = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str); // Fallback to original if compression fails
    });
};

function ImageUploadZone({ category, photos, setPhotos, label, withGeo = false }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFiles = async (e, isCamera = false) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsProcessing(true);
        let geoData = null;

        try {
            if (isCamera && withGeo) {
                geoData = await captureLocation();
            }

            const newPhotos = await Promise.all(files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64 = reader.result;
                        // Compress high-res photos to stay within payload and DB limits
                        const compressed = await compressImage(base64);
                        resolve({
                            data: compressed,
                            lat: geoData?.lat,
                            lng: geoData?.lng,
                            timestamp: new Date().toISOString()
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }));

            setPhotos(prev => ({
                ...prev,
                [category]: [...prev[category], ...newPhotos]
            }));
        } catch (err) {
            console.error("Image processing error:", err);
            alert("Failed to process images. Please try again.");
        } finally {
            setIsProcessing(false);
            e.target.value = ''; // Reset input to allow re-uploading same file if needed
        }
    };

    const removePhoto = (idx) => {
        setPhotos(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== idx)
        }));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`border-2 border-dashed border-gray-200 rounded-xl p-5 text-center transition-colors cursor-pointer group flex flex-col items-center justify-center bg-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e)} disabled={isProcessing} />
                    <UploadCloud className="w-5 h-5 text-gray-400 group-hover:text-primary-500 mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-gray-600">Gallery</p>
                </label>

                <label className={`border-2 border-dashed border-gray-200 rounded-xl p-5 text-center transition-colors cursor-pointer group flex flex-col items-center justify-center bg-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e, true)} disabled={isProcessing} />
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-green-500 mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-gray-600">Camera</p>
                </label>
            </div>

            {isProcessing && (
                <div className="flex items-center gap-2 text-primary-600 text-xs font-medium bg-primary-50 p-2 rounded-lg">
                    <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    Processing images...
                </div>
            )}

            {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {photos.map((photo, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img src={photo.data} alt="Upload" className="w-full h-full object-cover" />
                            {photo.lat != null && photo.lng != null && (
                                <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                                    <MapPin className="w-2 h-2" />
                                    {Number(photo.lat).toFixed(4)}, {Number(photo.lng).toFixed(4)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ValuationForm() {
    const { templateId, id: reportId } = useParams();
    const navigate = useNavigate();

    const [template, setTemplate] = useState(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [reportStatus, setReportStatus] = useState('Draft');
    const [photos, setPhotos] = useState({
        guideline: [],
        location: [],
        property: []
    });

    const { showAlert } = useAlert();

    const schema = useMemo(() => {
        if (!template || !template.sections) return z.object({});
        const shape = {};
        template.sections.forEach(sec => {
            sec.fields?.forEach(field => {
                if (field.type !== 'button' && field.type !== 'heading') {
                    // Make explicitly required ones string with min(1)
                    if (field.isList || field.type === 'bullets') {
                        shape[field.id] = z.array(z.string()).optional();
                    } else if (field.required || ['owner_name', 'property_address', 'date'].includes(field.id)) {
                        shape[field.id] = z.string().min(1, `${field.label || field.id} is required`);
                    } else {
                        // Allow optional values
                        shape[field.id] = z.string().optional().or(z.literal(''));
                    }
                }
            });
        });
        return z.object(shape);
    }, [template]);

    const { register, handleSubmit, getValues, reset, control, trigger, watch, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        mode: 'onTouched'
    });

    const formValues = watch();

    const steps = useMemo(() => {
        if (!template || !template.sections) return [];

        const allSteps = [];

        template.sections.forEach(section => {
            let currentFields = [];
            // Default to section title for fields before the first heading
            let currentTitle = section.title;

            section.fields.forEach(field => {
                if (field.type === 'heading') {
                    // If we find a heading and have accumulated fields, push them as a step
                    if (currentFields.length > 0) {
                        allSteps.push({
                            type: 'section',
                            content: { title: currentTitle, fields: currentFields }
                        });
                        currentFields = [];
                    }
                    // Start a new group where this heading's label is the title
                    currentTitle = field.label;
                } else {
                    currentFields.push(field);
                }
            });

            // Push any remaining fields in the section
            if (currentFields.length > 0) {
                allSteps.push({
                    type: 'section',
                    content: { title: currentTitle, fields: currentFields }
                });
            }
        });

        return [...allSteps, { type: 'photos', title: 'Inspection Media' }];
    }, [template]);

    const [expandedStep, setExpandedStep] = useState(0);

    const handleNext = async () => {
        // Find fields in current section to validate
        if (steps[expandedStep].type === 'section') {
            const currentFields = steps[expandedStep].content.fields.map(f => f.id);
            const isValid = await trigger(currentFields);
            if (!isValid) return;
        }
        setExpandedStep(prev => Math.min(prev + 1, steps.length - 1));

        // Dynamic scroll to the newly opened section header
        setTimeout(() => {
            const element = document.getElementById(`step-${expandedStep + 1}`);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const toggleStep = (idx) => {
        setExpandedStep(expandedStep === idx ? null : idx);
    };

    useEffect(() => {
        const fetchTemplateData = async () => {
            if (reportId) {
                // We are viewing/editing an existing report
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/${reportId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch report');
                    const reportData = await response.json();

                    // Set the structure of the form based on the saved report's sections
                    setTemplate({
                        title: reportData.template,
                        entity: reportData.entity,
                        sections: reportData.sections
                    });

                    if (reportData.status) {
                        setReportStatus(reportData.status);
                    }

                    // Populate the form fields with the saved data
                    reset(reportData.data);
                    if (reportData.data.photos) {
                        const savedPhotos = reportData.data.photos;
                        if (Array.isArray(savedPhotos)) {
                            // Migration: Put all existing photos into 'property' section
                            // Map any string-only photos to the new {data: string} format
                            const migrated = savedPhotos.map(p => typeof p === 'string' ? { data: p } : p);
                            setPhotos({
                                guideline: [],
                                location: [],
                                property: migrated
                            });
                        } else {
                            // Categorized object format
                            const migrated = { guideline: [], location: [], property: [] };
                            for (const cat in savedPhotos) {
                                if (Array.isArray(savedPhotos[cat])) {
                                    migrated[cat] = savedPhotos[cat].map(p => typeof p === 'string' ? { data: p } : p);
                                }
                            }
                            setPhotos(migrated);
                        }
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/templates`);
                if (!response.ok) throw new Error('Failed to fetch templates');
                const templates = await response.json();

                const found = templates.find(t => t.id === templateId);
                if (found) {
                    // Convert simple flat fields to a section structure so the existing UI renders it
                    setTemplate({
                        title: found.name,
                        entity: found.entity,
                        sections: [
                            {
                                title: 'Template Variables',
                                fields: found.fields.map(f => ({
                                    id: f.id,
                                    label: f.label,
                                    type: f.type || 'text',
                                    isList: f.isList || false,
                                    placeholder: f.placeholder || '',
                                    options: f.options || [],
                                    buttonType: f.buttonType || 'button'
                                }))
                            }
                        ]
                    });
                } else {
                    setError("Template not found");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplateData();
    }, [templateId, reportId, reset]);

    const handleSave = async (formData, statusParam = 'Completed') => {
        console.log("Submitting handleSave with data:", formData);
        setSaving(true);
        try {
            const payload = {
                title: formData['owner_name'] || formData['customer_name'] || `${template.title} Report`,
                entity: template.entity || 'Custom',
                template: template.title,
                date: formData['date'] || formData['inspection_date'] || new Date().toISOString().split('T')[0],
                value: formData['ov_total_value'] || formData['summary_market_value'] || 'TBD',
                data: { ...formData, photos: photos },
                status: statusParam,
                sections: template.sections
            };

            const token = localStorage.getItem('token');
            const url = reportId
                ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports/${reportId}`
                : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reports`;
            const method = reportId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save valuation');
            const data = await response.json();

            // If it was a new report, update the URL without refreshing to prevent duplicate creations
            if (!reportId && data.report && (data.report.id || data.report._id)) {
                const newId = data.report.id || data.report._id;
                navigate(`/valuation/${newId}`, { replace: true });
            }

            setReportStatus(statusParam);
            setSuccess(true);
            showAlert('Success', 'Valuation saved securely to your dashboard.', 'success');
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to save the valuation.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExportDocx = async () => {
        setIsExporting(true);
        try {
            const payload = {
                title: template.title,
                sections: template.sections,
                data: { ...getValues(), photos: photos }
            };
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/export/word`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Export failed');

            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const safeTitle = (template.title || 'Valuation_Report').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
            a.download = `${safeTitle}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to export document', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    if (success) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-2xl border border-green-100 mt-10">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Successfully!</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Your valuation has been saved securely to your dashboard.</p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => setSuccess(false)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 focus:ring-4 focus:ring-primary-100 shadow-sm transition-all"
                    >
                        Continue Editing
                    </button>

                    <button
                        onClick={handleExportDocx}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 shadow-sm transition-all"
                    >
                        {isExporting ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div> : <Download className="w-5 h-5" />}
                        Export as Word
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 border border-transparent text-white font-semibold rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/30 shadow-lg shadow-primary-500/30 transition-all"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary-500 animate-spin mb-4"></div>
                <p>Loading application data...</p>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <p>Error: {error || 'Template not found'}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="pb-32">
            <div className="flex flex-col md:flex-row items-start gap-4 mb-6 sticky top-0 bg-gray-50 pt-2 pb-4 z-20 border-b border-gray-200">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-colors hidden md:block">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">{template.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${reportStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {reportStatus}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {steps.length} Sections
                        </span>
                    </div>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">
                    <span>Overall Completion</span>
                    <span>{Math.round(((expandedStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div
                        className="bg-primary-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${((expandedStep + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="w-full">
                <form onSubmit={handleSubmit((data) => handleSave(data, 'Completed'), (errors) => {
                    console.error("Form Validation Failed:", errors);
                    alert("Validation Failed. Please check the highlighted fields in the sections!");
                })} className="space-y-4 relative">

                    {steps.map((step, idx) => (
                        <div key={idx} id={`step-${idx}`} className={`border overflow-hidden rounded-2xl transition-all duration-300 ${expandedStep === idx ? 'border-primary-100 bg-white shadow-xl ring-1 ring-primary-50' : 'border-gray-100 bg-white/60 hover:bg-white'}`}>
                            {/* Accordion Header */}
                            <button
                                type="button"
                                onClick={() => toggleStep(idx)}
                                className={`w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors ${expandedStep === idx ? 'bg-primary-50/30' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${expandedStep === idx ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {idx + 1}
                                    </div>
                                    <h3 className={`text-sm md:text-base font-bold transition-colors ${expandedStep === idx ? 'text-primary-700' : 'text-gray-700'}`}>
                                        {step.type === 'photos' ? 'Inspection Media & Photos' : step.content.title}
                                    </h3>
                                </div>
                                <div className={`transform transition-transform duration-300 ${expandedStep === idx ? 'rotate-180 text-primary-500' : 'text-gray-400'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </button>

                            {/* Accordion Content */}
                            {expandedStep === idx && (
                                <div className="p-4 md:p-8 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {step.type === 'section' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {step.content.fields.map(field => {
                                                // Conditional visibility check
                                                const conditions = field.conditions || (field.dependsOn ? [{ fieldId: field.dependsOn, value: field.dependsOnValue }] : []);

                                                if (conditions.length > 0) {
                                                    const allMet = conditions.every(cond => {
                                                        if (!cond.fieldId) return true;
                                                        const parentValue = formValues[cond.fieldId];
                                                        return String(parentValue || '') === String(cond.value || '');
                                                    });

                                                    if (!allMet) return null;
                                                }

                                                return (
                                                    <div key={field.id} className={(field.type === 'textarea' || field.type === 'heading' || field.type === 'subheading') ? 'md:col-span-2' : ''}>
                                                        {field.type !== 'heading' && field.type !== 'subheading' && (
                                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                                            </label>
                                                        )}

                                                        {field.type === 'subheading' && (
                                                            <h3 className="text-base font-bold text-primary-700 mt-4 mb-2 pb-1 border-b border-primary-100 uppercase tracking-tight">
                                                                {field.label}
                                                            </h3>
                                                        )}

                                                        {field.isList ? (
                                                            <div className="w-full">
                                                                <Controller
                                                                    name={field.id}
                                                                    control={control}
                                                                    defaultValue={[]}
                                                                    render={({ field: { onChange, value } }) => (
                                                                        <BulletInput
                                                                            value={value}
                                                                            onChange={onChange}
                                                                            label={field.label}
                                                                        />
                                                                    )}
                                                                />
                                                            </div>
                                                        ) : field.type === 'textarea' ? (
                                                            <textarea
                                                                className={`w-full px-4 py-3 rounded-xl border ${errors[field.id] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-50'} focus:ring-4 transition-all text-gray-900 resize-none h-32 bg-white`}
                                                                {...register(field.id)}
                                                                placeholder={`Enter ${field.label?.toLowerCase() || 'value'}`}
                                                            />
                                                        ) : field.type === 'select' ? (
                                                            <select
                                                                className={`w-full px-4 py-3 rounded-xl border ${errors[field.id] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-50'} focus:ring-4 transition-all text-gray-900 bg-white`}
                                                                {...register(field.id)}
                                                            >
                                                                <option value="">Select {field.label}</option>
                                                                {field.options?.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'radio' ? (
                                                            <div className="flex flex-wrap gap-4 mt-2 p-1">
                                                                {field.options?.map(opt => (
                                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                                                        <input
                                                                            type="radio"
                                                                            value={opt}
                                                                            {...register(field.id)}
                                                                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 transition-all"
                                                                        />
                                                                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary-800 transition-colors">{opt}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : field.type === 'heading' ? null : (
                                                            <input
                                                                type={field.type}
                                                                className={`w-full px-4 py-3 rounded-xl border ${errors[field.id] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-50'} focus:ring-4 transition-all text-gray-900 bg-white`}
                                                                {...register(field.id)}
                                                                placeholder={`Enter ${field.label?.toLowerCase() || 'value'}`}
                                                            />
                                                        )}
                                                        {errors[field.id] && (
                                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                                <AlertCircle className="w-4 h-4" />
                                                                {errors[field.id]?.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Section Navigation Button */}
                                            <div className="md:col-span-2 pt-6 border-t border-gray-50 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center gap-2"
                                                >
                                                    Next Section
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            {/* Photos Step Rendering */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs">1</span>
                                                        Guideline Value
                                                    </h4>
                                                </div>
                                                <ImageUploadZone category="guideline" photos={photos.guideline} setPhotos={setPhotos} label="Upload Guideline Value" />
                                            </div>

                                            <div className="space-y-6 border-t border-gray-100 pt-8">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs">2</span>
                                                        Location Map
                                                    </h4>
                                                </div>
                                                <ImageUploadZone category="location" photos={photos.location} setPhotos={setPhotos} label="Upload Location Map" withGeo={true} />
                                            </div>

                                            <div className="space-y-6 border-t border-gray-100 pt-8">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">3</span>
                                                        Property Images
                                                    </h4>
                                                </div>
                                                <ImageUploadZone category="property" photos={photos.property} setPhotos={setPhotos} label="Upload Property Photos" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Floating Save Bar */}
                    <div className="fixed bottom-[88px] md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-50 flex shadow-2xl rounded-2xl md:rounded-full bg-white border border-primary-100 overflow-hidden ring-4 ring-black/5 max-w-lg mx-auto md:max-w-none">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleSave(getValues(), 'Draft')}
                            className="flex-1 md:flex-none flex justify-center items-center gap-2 py-3 px-4 md:px-6 border-r border-gray-100 text-xs md:text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Save Draft
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-[2] md:min-w-[200px] flex justify-center items-center gap-2 py-3.5 px-6 md:px-10 text-sm md:text-base font-bold text-white transition-all disabled:opacity-50 bg-primary-600 hover:bg-primary-700`}
                        >
                            {saving ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <><Save className="w-4 h-4 md:w-5 md:h-5" /><span className="whitespace-nowrap">Complete Valuation</span></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
