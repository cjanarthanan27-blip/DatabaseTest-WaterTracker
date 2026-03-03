import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const EMPTY_FORM = {
    amount: '',
    for_month: '',
};

function fmtMonth(d) {
    if (!d) return 'NA';
    const dateStr = d.length === 7 ? `${d}-01` : d;
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return 'NA';
    return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function fmtCurrency(v) {
    if (v === null || v === undefined || v === '') return 'NA';
    return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BudgetTracking() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [toast, setToast] = useState(null);
    const [sortKey, setSortKey] = useState('for_month');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedIds, setSelectedIds] = useState([]);
    const modalRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await api.get('budget/');
            // The budget API is a simple ModelViewSet with pagination potentially.
            // But usually we use StandardResultsSetPagination which returns { results: [...] }
            setEntries(res.data.results || res.data);
        } catch {
            showToast('Failed to load budget entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEntries(); }, []);

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
        setShowModal(true);
    };

    const handleOpenEdit = (entry) => {
        setEditing(entry.id);
        setFormData({
            amount: entry.amount || '',
            for_month: entry.for_month ? entry.for_month.slice(0, 7) : '',
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            amount: formData.amount,
            for_month: formData.for_month ? `${formData.for_month}-01` : null
        };

        if (!payload.for_month || !payload.amount) {
            showToast('Please fill all fields', 'error');
            return;
        }

        try {
            if (editing) {
                await api.put(`budget/${editing}/`, payload);
                showToast('Budget updated');
            } else {
                await api.post('budget/', payload);
                showToast('Budget added');
            }
            setShowModal(false);
            fetchEntries();
        } catch (err) {
            const errorMsg = err.response?.data?.non_field_errors?.[0] || 'Failed to save budget';
            showToast(errorMsg, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this budget entry?')) return;
        try {
            await api.delete(`budget/${id}/`);
            showToast('Budget deleted');
            fetchEntries();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Delete ${selectedIds.length} selected budgets?`)) return;
        try {
            await Promise.all(selectedIds.map(id => api.delete(`budget/${id}/`)));
            setSelectedIds([]);
            showToast(`Deleted ${selectedIds.length} budgets`);
            fetchEntries();
        } catch {
            showToast('Failed to delete some entries', 'error');
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    const toggleSelectAll = () => {
        if (selectedIds.length === entries.length && entries.length > 0) setSelectedIds([]);
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

    const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Tracking</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage approved budgets per month</p>
                </div>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-medium">
                            Delete ({selectedIds.length})
                        </button>
                    )}
                    <button onClick={handleOpenAdd} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium flex items-center gap-1">
                        <span className="text-lg leading-none">+</span> Add Budget
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-4 py-3 text-right">
                                <input type="checkbox" checked={entries.length > 0 && selectedIds.length === entries.length} onChange={toggleSelectAll} className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                            </th>
                            <th onClick={() => handleSort('for_month')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-slate-200">
                                Month <SortIcon k="for_month" />
                            </th>
                            <th onClick={() => handleSort('amount')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-slate-200">
                                Approved Amount <SortIcon k="amount" />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">Loading...</td></tr>
                        ) : sorted.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">No budget entries found.</td></tr>
                        ) : sorted.map(entry => (
                            <tr key={entry.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selectedIds.includes(entry.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                <td className="px-4 py-3 text-right">
                                    <input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSelect(entry.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-slate-100">{fmtMonth(entry.for_month)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-slate-300">{fmtCurrency(entry.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => handleOpenEdit(entry)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 mr-4 font-medium">Edit</button>
                                    <button onClick={() => handleDelete(entry.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 font-medium">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
                    <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Budget' : 'Add Budget'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Month *</label>
                                <input type="month" name="for_month" value={formData.for_month} onChange={handleChange} className={inputCls} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Approved Amount (₹) *</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" min="0" className={inputCls} placeholder="0.00" required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">{editing ? 'Update' : 'Add Budget'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
