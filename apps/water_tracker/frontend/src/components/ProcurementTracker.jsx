import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * ComboField — dropdown opens on focus showing ALL existing unique values.
 * User can pick one, or type a completely new value. No backend calls per keystroke.
 */
function ComboField({ name, value, onChange, options = [], placeholder = '', maxLength, className }) {
    // Local query is seeded from initial 'value'. Parent forces a remount via 'key'
    // whenever form is reset/opened, so no effect or ref sync needed.
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value ?? '');
    const containerRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                if (!document.contains(e.target)) return;
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query
        ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
        : options;

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        onChange({ target: { name, value: e.target.value } });
        setOpen(true);
    };

    const handleSelect = (opt) => {
        setQuery(opt);
        onChange({ target: { name, value: opt } });
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                maxLength={maxLength}
                autoComplete="off"
                className={className}
            />
            {open && options.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg text-sm">
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-gray-400 italic">No match — will save as new</li>
                    ) : filtered.map(opt => (
                        <li
                            key={opt}
                            onMouseDown={() => handleSelect(opt)}
                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 ${opt === query
                                ? 'bg-blue-50 dark:bg-blue-900/40 font-medium text-blue-700 dark:text-blue-300'
                                : 'text-gray-800 dark:text-slate-200'
                                }`}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const EMPTY_FORM = {
    pr_date: '',
    pr_no: 'NA',
    block_details: 'Campus',
    description: '',
    vendor: '',
    bill_no: 'NA',
    category: 'Water',
    po_date: '',
    po_no: 'NA',
    po_value: '',
    opex_date: '',
    opex_no: '',
    opex_value: '',
    payment_status: 'process',
    for_month: '',
};

function fmtDate(d) {
    if (!d) return 'NA';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMonth(d) {
    if (!d) return 'NA';
    // If d is YYYY-MM (length 7), append -01 for reliable parsing.
    // If d is YYYY-MM-DD (backend format), use it as is.
    const dateStr = d.length === 7 ? `${d}-01` : d;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return 'NA';
    return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function fmtCurrency(v) {
    if (v === null || v === undefined || v === '') return 'NA';
    return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const FieldRow = ({ label, children, required }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

export default function ProcurementTracker() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [toast, setToast] = useState(null);
    const [sortKey, setSortKey] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedIds, setSelectedIds] = useState([]);
    const [charCount, setCharCount] = useState(0);
    const modalRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterMonth) params.for_month = filterMonth;
            if (filterStatus) params.payment_status = filterStatus;
            const res = await api.get('procurement/', { params });
            setEntries(res.data.results || res.data);
        } catch {
            showToast('Failed to load entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await api.get('procurement/vendors/');
            setVendors(res.data);
        } catch { /* silent */ }
    };

    const fetchBlocks = async () => {
        try {
            const res = await api.get('procurement/blocks/');
            setBlocks(res.data);
        } catch { /* silent */ }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('procurement/categories/');
            setCategories(res.data);
        } catch { /* silent */ }
    };

    useEffect(() => { fetchEntries(); }, [filterMonth, filterStatus]);
    useEffect(() => { fetchVendors(); fetchBlocks(); fetchCategories(); }, []);

    // Close modal on outside click
    useEffect(() => {
        const handler = (e) => {
            if (showModal && modalRef.current && !modalRef.current.contains(e.target)) {
                if (!document.contains(e.target)) return;
                setShowModal(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showModal]);

    const handleOpenAdd = () => {
        setEditing(null);
        setFormData(EMPTY_FORM);
        setCharCount(0);
        setShowModal(true);
    };

    const handleOpenEdit = (entry) => {
        setEditing(entry.id);
        setFormData({
            pr_date: entry.pr_date || '',
            pr_no: entry.pr_no || '',
            block_details: entry.block_details || '',
            description: entry.description || '',
            vendor: entry.vendor || '',
            bill_no: entry.bill_no || '',
            category: entry.category || '',
            po_date: entry.po_date || '',
            po_no: entry.po_no || '',
            po_value: entry.po_value || '',
            opex_date: entry.opex_date || '',
            opex_no: entry.opex_no || '',
            opex_value: entry.opex_value || '',
            payment_status: entry.payment_status || 'process',
            for_month: entry.for_month ? entry.for_month.slice(0, 7) : '',
        });
        setCharCount((entry.description || '').length);
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'description') setCharCount(value.length);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const buildPayload = () => {
        const p = { ...formData };
        // Convert for_month YYYY-MM → YYYY-MM-01
        if (p.for_month) p.for_month = p.for_month + '-01';
        else p.for_month = null;
        // Nullify empty date/decimal fields
        ['pr_date', 'po_date', 'opex_date'].forEach(k => { if (!p[k]) p[k] = null; });
        ['po_value', 'opex_value'].forEach(k => { if (p[k] === '' || p[k] === undefined) p[k] = null; });
        return p;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = buildPayload();
        try {
            if (editing) {
                await api.put(`procurement/${editing}/`, payload);
                showToast('Entry updated');
            } else {
                await api.post('procurement/', payload);
                showToast('Entry added');
            }
            setShowModal(false);
            fetchEntries();
            fetchVendors();
            fetchBlocks();
            fetchCategories();
        } catch {
            showToast('Failed to save entry', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await api.delete(`procurement/${id}/`);
            showToast('Entry deleted');
            fetchEntries();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Delete ${selectedIds.length} selected entries?`)) return;
        try {
            await Promise.all(selectedIds.map(id => api.delete(`procurement/${id}/`)));
            setSelectedIds([]);
            showToast(`Deleted ${selectedIds.length} entries`);
            fetchEntries();
        } catch {
            showToast('Failed to delete some entries', 'error');
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    const toggleSelectAll = () => {
        if (selectedIds.length === entries.length) setSelectedIds([]);
        else setSelectedIds(entries.map(e => e.id));
    };

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const sorted = [...entries].sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (av === null || av === undefined) av = '';
        if (bv === null || bv === undefined) bv = '';
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ k }) => (
        <span className="ml-1 text-gray-400">
            {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
    );

    const StatusBadge = ({ status }) => (
        <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${status === 'paid'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
            {status === 'paid' ? 'Paid' : 'In Process'}
        </span>
    );


    const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="max-w-full mx-auto p-4 sm:p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
                    }`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Procurement Tracker</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                        Track PR → PO → Opex → Payment workflow
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-medium"
                        >
                            Delete ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={handleOpenAdd}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium flex items-center gap-1"
                    >
                        <span className="text-lg leading-none">+</span> Add Entry
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Month</label>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Payment Status</label>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All</option>
                        <option value="paid">Paid</option>
                        <option value="process">In Process</option>
                    </select>
                </div>
                {(filterMonth || filterStatus) && (
                    <div className="flex items-end">
                        <button
                            onClick={() => { setFilterMonth(''); setFilterStatus(''); }}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg border border-gray-200 dark:border-slate-700 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-4 py-3 text-right">
                                <input
                                    type="checkbox"
                                    checked={entries.length > 0 && selectedIds.length === entries.length}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                                />
                            </th>
                            {[
                                { key: 'pr_date', label: 'PR Date' },
                                { key: 'pr_no', label: 'PR No' },
                                { key: 'block_details', label: 'Block' },
                                { key: 'vendor', label: 'Vendor' },
                                { key: 'category', label: 'Category' },
                                { key: 'bill_no', label: 'Bill No' },
                                { key: 'po_date', label: 'PO Date' },
                                { key: 'po_no', label: 'PO No' },
                                { key: 'po_value', label: 'PO Value' },
                                { key: 'opex_date', label: 'Opex Date' },
                                { key: 'opex_no', label: 'Opex No' },
                                { key: 'opex_value', label: 'Opex Value' },
                                { key: 'payment_status', label: 'Status' },
                                { key: 'for_month', label: 'For Month' },
                            ].map(({ key, label }) => (
                                <th
                                    key={key}
                                    onClick={() => handleSort(key)}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-slate-200 whitespace-nowrap"
                                >
                                    {label}<SortIcon k={key} />
                                </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan="15" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td colSpan="15" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                                    No procurement entries found.
                                </td>
                            </tr>
                        ) : sorted.map(entry => (
                            <tr
                                key={entry.id}
                                className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selectedIds.includes(entry.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                    }`}
                            >
                                <td className="px-4 py-3 text-right">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(entry.id)}
                                        onChange={() => toggleSelect(entry.id)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-slate-300">{fmtDate(entry.pr_date)}</td>
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-slate-100">{entry.pr_no || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400 max-w-[140px] truncate" title={entry.block_details}>{entry.block_details || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{entry.vendor || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{entry.category || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{entry.bill_no || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{fmtDate(entry.po_date)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{entry.po_no || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 dark:text-slate-300">{fmtCurrency(entry.po_value)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{fmtDate(entry.opex_date)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{entry.opex_no || 'NA'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 dark:text-slate-300">{fmtCurrency(entry.opex_value)}</td>
                                <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={entry.payment_status} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-slate-400">{fmtMonth(entry.for_month)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                        onClick={() => handleOpenEdit(entry)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 mr-3 font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-800 font-medium"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Count */}
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                {sorted.length} entr{sorted.length === 1 ? 'y' : 'ies'}
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
            </p>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
                    <div
                        ref={modalRef}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editing ? 'Edit Procurement Entry' : 'Add Procurement Entry'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">


                            {/* Row 1: PR Date + PR No */}
                            <div className="grid grid-cols-2 gap-4">
                                <FieldRow label="PR Date">
                                    <input type="date" name="pr_date" value={formData.pr_date} onChange={handleChange} className={inputCls} />
                                </FieldRow>
                                <FieldRow label="PR No">
                                    <input type="text" name="pr_no" value={formData.pr_no} onChange={handleChange} className={inputCls} placeholder="PR-2025-001" />
                                </FieldRow>
                            </div>

                            {/* Block Details */}
                            <FieldRow label="Block Details">
                                <ComboField
                                    key={`block-${editing ?? 'new'}`}
                                    name="block_details"
                                    value={formData.block_details}
                                    onChange={handleChange}
                                    options={blocks}
                                    maxLength={200}
                                    placeholder="e.g. Block A, Zone 3"
                                    className={inputCls}
                                />
                            </FieldRow>

                            {/* Description */}
                            <FieldRow label="Description of Work">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    maxLength={300}
                                    rows={3}
                                    className={inputCls}
                                    placeholder="Describe the work..."
                                />
                                <p className={`text-xs mt-0.5 ${charCount > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {charCount}/300
                                </p>
                            </FieldRow>

                            {/* Row: Vendor + Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <FieldRow label="Vendor">
                                    <ComboField
                                        key={`vendor-${editing ?? 'new'}`}
                                        name="vendor"
                                        value={formData.vendor}
                                        onChange={handleChange}
                                        options={vendors}
                                        maxLength={200}
                                        placeholder="Pick or type new…"
                                        className={inputCls}
                                    />
                                </FieldRow>
                                <FieldRow label="Category">
                                    <ComboField
                                        key={`cat-${editing ?? 'new'}`}
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        options={categories}
                                        maxLength={100}
                                        placeholder="e.g. Civil, Electrical"
                                        className={inputCls}
                                    />
                                </FieldRow>
                            </div>

                            {/* Bill No */}
                            <FieldRow label="Bill No">
                                <input type="text" name="bill_no" value={formData.bill_no} onChange={handleChange} maxLength={100} className={inputCls} placeholder="Optional" />
                            </FieldRow>

                            {/* Row: PO Date + PO No + PO Value */}
                            <div className="grid grid-cols-3 gap-4">
                                <FieldRow label="PO Date">
                                    <input type="date" name="po_date" value={formData.po_date} onChange={handleChange} className={inputCls} />
                                </FieldRow>
                                <FieldRow label="PO No">
                                    <input type="text" name="po_no" value={formData.po_no} onChange={handleChange} maxLength={100} className={inputCls} placeholder="PO-2025-001" />
                                </FieldRow>
                                <FieldRow label="PO Value (₹)">
                                    <input type="number" name="po_value" value={formData.po_value} onChange={handleChange} step="0.01" min="0" className={inputCls} placeholder="0.00" />
                                </FieldRow>
                            </div>

                            {/* Row: Opex Date + Opex No */}
                            <div className="grid grid-cols-2 gap-4">
                                <FieldRow label="Opex Date">
                                    <input type="date" name="opex_date" value={formData.opex_date} onChange={handleChange} className={inputCls} />
                                </FieldRow>
                                <FieldRow label="Opex No">
                                    <input type="text" name="opex_no" value={formData.opex_no} onChange={handleChange} maxLength={100} className={inputCls} placeholder="Opex reference" />
                                </FieldRow>
                            </div>

                            {/* Row: Opex Value + Payment Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <FieldRow label="Opex Value (₹)">
                                    <input type="number" name="opex_value" value={formData.opex_value} onChange={handleChange} step="0.01" min="0" className={inputCls} placeholder="0.00" />
                                </FieldRow>
                                <FieldRow label="Payment Status">
                                    <select name="payment_status" value={formData.payment_status} onChange={handleChange} className={inputCls}>
                                        <option value="process">In Process</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </FieldRow>
                            </div>

                            {/* For Month */}
                            <FieldRow label="For Month">
                                <input type="month" name="for_month" value={formData.for_month} onChange={handleChange} className={inputCls} />
                            </FieldRow>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    {editing ? 'Update Entry' : 'Add Entry'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
