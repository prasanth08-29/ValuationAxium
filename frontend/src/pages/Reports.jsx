import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, Building2, FileText, ChevronRight, Download, Eye, AlertCircle } from 'lucide-react';

export default function Reports() {
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/reports?page=${page}&limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setReports(data.reports || []);
                    setTotalPages(data.totalPages || 1);
                }
            } catch (err) {
                console.error("Failed to fetch reports", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [page]);

    const [exportingId, setExportingId] = useState(null);

    const exportToWord = async (report) => {
        setExportingId(report.id);
        try {
            const payload = {
                title: report.template,
                sections: report.sections,
                data: report.data
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
            const safeTitle = (report.title || 'Valuation_Report').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
            a.download = `${safeTitle}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to export document');
        } finally {
            setExportingId(null);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [entityFilter, setEntityFilter] = useState('All');
    const [templateFilter, setTemplateFilter] = useState('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Unique entities and templates for filter dropdowns
    const entities = ['All', ...new Set(reports.map(r => r.entity))];
    const templates = ['All', ...new Set(reports.map(r => r.template))];

    // Filter logic
    const filteredReports = reports.filter(report => {
        const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.id.includes(searchTerm);
        const matchesEntity = entityFilter === 'All' || report.entity === entityFilter;
        const matchesTemplate = templateFilter === 'All' || report.template === templateFilter;

        let matchesDate = true;
        if (fromDate) {
            matchesDate = matchesDate && report.date >= fromDate;
        }
        if (toDate) {
            matchesDate = matchesDate && report.date <= toDate;
        }

        return matchesSearch && matchesEntity && matchesTemplate && matchesDate;
    });

    const clearFilters = () => {
        setSearchTerm('');
        setEntityFilter('All');
        setTemplateFilter('All');
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary-500 animate-spin mb-4"></div>
                <p>Loading your valuations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Valuations</h2>
                    <p className="text-gray-500 mt-1">View and filter your generated valuation reports.</p>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title or ID..."
                        className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {/* Filters Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Filter Reports</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                        >
                            {entities.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</label>
                        <select
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                            value={templateFilter}
                            onChange={(e) => setTemplateFilter(e.target.value)}
                        >
                            {templates.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">From Date</label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To Date</label>
                        <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">
                        {filteredReports.length} {filteredReports.length === 1 ? 'Result' : 'Results'} Found
                    </h3>
                </div>

                {filteredReports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold">Report Info</th>
                                    <th className="px-6 py-4 font-semibold">Entity / Template</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary-50 text-primary-600 p-2.5 rounded-xl">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                                        {report.title}
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${(report.status || 'Completed') === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {report.status || 'Completed'}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">ID: #{report.id} • Est. Value: {report.value}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 mb-1">
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                    {report.entity}
                                                </span>
                                                <p className="text-xs text-gray-600 font-medium">{report.template}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {report.date}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="View Report"
                                                    onClick={() => navigate(`/valuation/${report.id}`)}
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Download Word Document"
                                                    onClick={() => exportToWord(report)}
                                                    disabled={exportingId === report.id}
                                                >
                                                    {exportingId === report.id ? (
                                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Download className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                                <span className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-50 text-gray-400 p-4 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">No reports found</h4>
                        <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
                        <button
                            onClick={clearFilters}
                            className="mt-6 px-4 py-2 bg-primary-50 text-primary-600 font-medium rounded-lg hover:bg-primary-100 transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
