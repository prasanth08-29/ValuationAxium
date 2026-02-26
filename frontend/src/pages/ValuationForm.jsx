import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Camera, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export default function ValuationForm() {
    const { templateId } = useParams();
    const navigate = useNavigate();

    const getTemplate = () => ({
        title: templateId === 'bank' ? 'Bank Property Valuation' :
            templateId === 'individual' ? 'Individual Property Valuation' : 'Vehicle Valuation',
        sections: [
            {
                title: "General Information",
                fields: [
                    { id: 'valuation_ref_no', label: 'Valuation Ref No', type: 'text' },
                    { id: 'date', label: 'Date', type: 'date' },
                    { id: 'panel_valuer_name', label: 'Name of the panel valuer', type: 'text' },
                    { id: 'owner_name', label: 'Name of the party/owner', type: 'text', required: true },
                    { id: 'property_address', label: 'Address of the property', type: 'textarea', required: true },
                    { id: 'reported_owner_name', label: 'Name(s) of the Reported owner', type: 'text' },
                    { id: 'purpose_of_valuation', label: 'Purpose of valuation', type: 'text' },
                    { id: 'documents_produced', label: 'List of documents produced for perusal', type: 'textarea' },
                    { id: 'date_of_inspection', label: 'Date of inspection', type: 'date' },
                    { id: 'distance_from_branch', label: 'Approximate Distance from the branch', type: 'text' },
                    { id: 'location_description', label: 'Situation/location/brief description of the land', type: 'textarea' },
                    { id: 'lat_long', label: 'Lat & long', type: 'text' },
                    { id: 'google_map_link', label: 'Google Map Link', type: 'text' },
                    { id: 'boundary_as_per_document', label: 'Boundary Details as per Document', type: 'textarea' },
                    { id: 'boundary_as_per_site', label: 'Boundary Details as per Site', type: 'textarea' },
                    { id: 'probable_monthly_rent', label: 'Probable monthly rent and advance', type: 'text' },
                    { id: 'building_plan_approved', label: 'Whether the building plan has been approved?', type: 'select', options: ['Yes', 'No'] },
                    { id: 'approval_details', label: 'If yes, approval details', type: 'textarea' },
                    { id: 'non_approval_reason', label: 'If no, reason for non-approval', type: 'textarea' },
                    { id: 'general_remarks', label: 'General Remarks', type: 'textarea' },
                ]
            },
            {
                title: "Land Details",
                fields: [
                    { id: 'land_total_area', label: 'The total area (Extent of the site/Land)', type: 'text' },
                    { id: 'land_description', label: 'Description of the site/land', type: 'textarea' },
                    { id: 'locality_character', label: 'Character of locality', type: 'text' },
                    { id: 'locality_class', label: 'Class of locality', type: 'text' },
                    { id: 'classification', label: 'Classification', type: 'text' },
                    { id: 'surrounding_development', label: 'Development of surrounding areas', type: 'text' },
                    { id: 'flooding', label: 'Is the locality subjected to frequent flooding', type: 'select', options: ['Yes', 'No'] },
                    { id: 'civic_amenities_feasibility', label: 'Feasibility to civil amenities (schools, hospital, etc)', type: 'text' },
                    { id: 'land_shape', label: 'Shape of land', type: 'text' },
                    { id: 'land_use_type', label: 'Type of use to which it can be put', type: 'text' },
                    { id: 'restriction_of_usage', label: 'Any other restriction of usage', type: 'text' },
                    { id: 'nature_of_right', label: 'Nature of right, whether lease hold', type: 'text' },
                    { id: 'road_facility', label: 'Road facility', type: 'text' },
                    { id: 'is_corner_plot', label: 'Is it a corner plot', type: 'select', options: ['Yes', 'No'] },
                    { id: 'lift', label: 'Lift', type: 'select', options: ['Yes', 'No', 'N/A'] },
                    { id: 'carpark', label: 'Carpark', type: 'select', options: ['Yes', 'No', 'N/A'] },
                    { id: 'water_supply', label: 'Water supply/potentiality', type: 'text' },
                    { id: 'underground_sewerage', label: 'Underground sewerage system', type: 'select', options: ['Yes', 'No'] },
                    { id: 'social_issues', label: 'Any other sentimental social issue which may affect the value', type: 'textarea' },
                ]
            },
            {
                title: "Building Details",
                fields: [
                    { id: 'construction_type', label: 'Type of construction', type: 'text' },
                    { id: 'construction_quality', label: 'Quality of construction', type: 'text' },
                    { id: 'building_appearance', label: 'Appearance of the building', type: 'text' },
                    { id: 'number_of_floors', label: 'Number of floors', type: 'number' },
                    { id: 'building_maintenance', label: 'Maintenance of the building', type: 'text' },
                    { id: 'building_description', label: 'Description of the building', type: 'textarea' },
                    { id: 'area_details', label: 'Area Details', type: 'textarea' },
                    { id: 'foundation', label: 'Foundation', type: 'text' },
                    { id: 'superstructure', label: 'Superstructure', type: 'text' },
                    { id: 'roof', label: 'Roof', type: 'text' },
                    { id: 'doors', label: 'Doors', type: 'text' },
                    { id: 'windows', label: 'Windows', type: 'text' },
                    { id: 'building_age', label: 'Age of the building', type: 'text' },
                    { id: 'estimated_further_life', label: 'Estimated further life of the building', type: 'text' },
                    { id: 'depreciation', label: 'Depreciation', type: 'text' },
                    { id: 'replacement_rate', label: 'Replacement Rate of Building', type: 'text' },
                ]
            },
            {
                title: "C. Valuation Details",
                fields: [
                    { id: 'extent_of_land_deed', label: 'Extent of Land as per deed', type: 'text' },
                    { id: 'extent_of_land_patta', label: 'Extent of Land as per Patta', type: 'text' },
                    { id: 'extent_of_land_valuation', label: 'Extent of Land for Valuation', type: 'text' },
                    { id: 'extent_of_building_valuation', label: 'Extent of Building for Valuation', type: 'text' },
                    { id: 'guideline_value_sqft', label: 'Guideline Value of Property per Sq Ft', type: 'number' },
                    { id: 'prevailing_unit_market_rate', label: 'Prevailing unit market rate of land', type: 'number' },
                    { id: 'adopted_rate_of_valuation', label: 'Adopted rate of valuation', type: 'number' },
                    { id: 'building_valuation', label: 'Building Valuation', type: 'number' },
                    { id: 'valuation_remarks', label: 'Remarks about the property', type: 'textarea' },
                    { id: 'building_condition_notes', label: 'Building Condition Notes', type: 'textarea', placeholder: 'e.g., poorly maintained condition, used as godown...' },
                    { id: 'salvage_value', label: 'Salvage Value of Building (Rs)', type: 'number' }
                ]
            },
            {
                title: "Overall Valuation Table",
                fields: [
                    { id: 'ov_land_extent', label: 'Land Extent (Sq Ft)', type: 'number' },
                    { id: 'ov_building_extent', label: 'Building Extent (Sq Ft)', type: 'number' },
                    { id: 'ov_glv_sqft', label: 'Guide Line Value (Rs per SqFt)', type: 'number' },
                    { id: 'ov_glv_land', label: 'Guide Line Value of Land (Rs)', type: 'number' },
                    { id: 'ov_glv_building', label: 'Guideline Value of Building (Rs)', type: 'number' },
                    { id: 'ov_glv_property', label: 'Guide Line Value of Property (Rs)', type: 'number' },
                    { id: 'ov_adopted_market_value', label: 'Adopted Market Value of Land (Rs per SqFt)', type: 'number' },
                    { id: 'ov_value_land', label: 'Value of Land (Rs)', type: 'number' },
                    { id: 'ov_value_building', label: 'Value of Building (Rs)', type: 'number' },
                    { id: 'ov_total_value', label: 'Total Value of Property (Rs)', type: 'number' },
                ]
            },
            {
                title: "Valuation Summary & Valuer's Opinion",
                fields: [
                    { id: 'summary_market_value', label: 'Total Property Market Value (Rs)', type: 'number' },
                    { id: 'summary_glv', label: 'Total Property GLV (Rs)', type: 'number' },
                    { id: 'opinion_fair_market_value', label: 'Fair Market Value of the property (Rs)', type: 'number' },
                    { id: 'opinion_realizable_sale_value', label: 'Realizable Sale Value (Rs)', type: 'number' },
                    { id: 'opinion_distress_sale_value', label: 'Distress Sale Value (Rs)', type: 'number' },
                    { id: 'opinion_total_guideline_value', label: 'Total Guideline Value of the property (Rs)', type: 'number' }
                ]
            },
            {
                title: "D & E. Declarations and Other Remarks",
                fields: [
                    { id: 'other_remarks', label: 'Any Other Remarks', type: 'textarea' }
                ]
            }
        ]
    });

    const [template, setTemplate] = useState(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const schema = useMemo(() => {
        if (!template || !template.sections) return z.object({});
        const shape = {};
        template.sections.forEach(sec => {
            sec.fields?.forEach(field => {
                if (field.type !== 'button') {
                    // Make explicitly required ones string with min(1)
                    if (field.required || ['owner_name', 'property_address', 'date'].includes(field.id)) {
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

    const { register, handleSubmit, getValues, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        mode: 'onTouched'
    });

    useEffect(() => {
        const fetchTemplateData = async () => {
            if (templateId === 'bank' || templateId === 'individual' || templateId === 'vehicle') {
                // Fallback to legacy mock logic for hardcoded tests, though ideally these aren't triggered
                setTemplate(getTemplate());
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/templates');
                if (!response.ok) throw new Error('Failed to fetch templates');
                const templates = await response.json();

                const found = templates.find(t => t.id === templateId);
                if (found) {
                    // Convert simple flat fields to a section structure so the existing UI renders it
                    setTemplate({
                        title: found.name,
                        sections: [
                            {
                                title: 'Template Variables',
                                fields: found.fields.map(f => ({
                                    id: f.id,
                                    label: f.label,
                                    type: f.type || 'text',
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
    }, [templateId]);

    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const payload = {
                title: formData['owner_name'] || formData['customer_name'] || `${template.title} Report`,
                entity: templateId === 'bank' ? 'Bank' : templateId === 'vehicle' ? 'Vehicle' : templateId === 'individual' ? 'Individual' : 'Custom',
                template: template.title,
                date: formData['date'] || formData['inspection_date'] || new Date().toISOString().split('T')[0],
                value: formData['ov_total_value'] || formData['summary_market_value'] || 'TBD',
                data: formData,
                sections: template.sections
            };

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save valuation');

            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Failed to save the valuation.');
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
                data: getValues()
            };
            const response = await fetch('http://localhost:5000/api/export/word', {
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
            alert('Failed to export document');
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
        <div className="pb-24 md:pb-0">
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gray-50 pt-2 pb-4 z-10 border-b border-gray-200 md:border-none md:static">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">{template.title}</h2>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block">Draft</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(handleSave)} className="space-y-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">

                {/* Dynamic Fields rendering by sections */}
                <div className="space-y-10">
                    {template.sections ? template.sections.map((section, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-xl p-4 md:p-6 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">{section.title}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {section.fields.map(field => (
                                    <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>

                                        {field.type === 'textarea' ? (
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
                                        ) : field.type === 'button' ? (
                                            <button
                                                type={field.buttonType || 'button'}
                                                className="w-full px-4 py-3 rounded-xl border border-transparent shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all font-bold"
                                                onClick={(e) => {
                                                    if (field.buttonType !== 'submit' && field.buttonType !== 'reset') {
                                                        e.preventDefault();
                                                        alert(`${field.label} clicked`);
                                                    }
                                                }}
                                            >
                                                {field.label}
                                            </button>
                                        ) : (
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
                                ))}
                            </div>
                        </div>
                    )) : null}
                </div>

                {/* Media / Photos Section (Mockup) */}
                <div className="border-t border-gray-100 pt-6 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Inspection Media</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-primary-400 transition-colors cursor-pointer group">
                        <div className="bg-primary-50 p-4 rounded-full inline-block group-hover:scale-110 transition-transform mb-3">
                            <Camera className="w-8 h-8 text-primary-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Tap to cross-launch camera or upload photos</p>
                        <p className="text-xs text-gray-500 mt-1">Supports highly optimized offline caching</p>
                    </div>
                </div>

                {/* Floating / Sticky Save Button for mobile */}
                <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 md:static md:bg-transparent md:border-none md:p-0 z-40">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto md:min-w-[200px] flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Submit Valuation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
