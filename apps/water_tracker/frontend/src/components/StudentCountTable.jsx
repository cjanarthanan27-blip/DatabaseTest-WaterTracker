import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import Modal from './Modal';
import Toast from './Toast';

const SortIcon = ({ direction }) => {
    if (!direction) return (
        <span className="ml-1 text-gray-300 dark:text-slate-600">↕</span>
    );
    return (
        <span className="ml-1 text-blue-500">{direction === 'asc' ? '↑' : '↓'}</span>
    );
};

const StudentCountTable = () => {
    const [entries, setEntries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'effective_date', direction: 'desc' });
    const [selected, setSelected] = useState(new Set());

    const [formData, setFormData] = useState({
        category: '',
        student_count: '',
        second_count: '',
        display_count: 'first',
        effective_date: new Date().toISOString().split('T')[0],
        notes: '',
        show_on_report: true   // mirrors category.has_student_count
    });

    const fetchData = useCallback(async () => {
        try {
            const [entriesRes, categoriesRes] = await Promise.all([
                api.get('category-student-counts/'),
                api.get('consumption-categories/')
            ]);
            setEntries(entriesRes.data.results || entriesRes.data);
            setCategories(categoriesRes.data.results || categoriesRes.data);
            setLoading(false);
        } catch {
            setToast({ message: 'Failed to load data', type: 'error' });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Sorting ────────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        );
        setSelected(new Set());
    };

    // ── Filtering + Sorting ────────────────────────────────────────────────────
    const displayedEntries = useMemo(() => {
        let rows = filterCategory
            ? entries.filter(e => e.category === parseInt(filterCategory))
            : entries;

        const { key, direction } = sortConfig;
        rows = [...rows].sort((a, b) => {
            let aVal = a[key] ?? '';
            let bVal = b[key] ?? '';
            // numeric columns
            if (key === 'student_count' || key === 'second_count') {
                aVal = Number(aVal) || 0;
                bVal = Number(bVal) || 0;
            } else if (key === 'category_name') {
                aVal = (a.category_name || '').toLowerCase();
                bVal = (b.category_name || '').toLowerCase();
            } else {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        return rows;
    }, [entries, filterCategory, sortConfig]);

    // ── Selection ──────────────────────────────────────────────────────────────
    const allSelected = displayedEntries.length > 0 &&
        displayedEntries.every(e => selected.has(e.id));
    const someSelected = selected.size > 0;

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(displayedEntries.map(e => e.id)));
        }
    };

    const toggleOne = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = () => {
        setEditingEntry(null);
        setFormData({
            category: '',
            student_count: '',
            second_count: '',
            display_count: 'first',
            effective_date: new Date().toISOString().split('T')[0],
            notes: '',
            show_on_report: true
        });
        setShowModal(true);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        const cat = categories.find(c => c.id === entry.category);
        setFormData({
            category: entry.category,
            student_count: entry.student_count,
            second_count: entry.second_count ?? '',
            display_count: entry.display_count || 'first',
            effective_date: entry.effective_date,
            notes: entry.notes || '',
            show_on_report: cat ? cat.has_student_count : true
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await api.delete(`category-student-counts/${id}/`);
            setToast({ message: 'Entry deleted successfully', type: 'success' });
            setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
            fetchData();
        } catch {
            setToast({ message: 'Failed to delete entry', type: 'error' });
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selected.size} selected entr${selected.size === 1 ? 'y' : 'ies'}?`)) return;
        try {
            await Promise.all([...selected].map(id => api.delete(`category-student-counts/${id}/`)));
            setToast({ message: `${selected.size} entr${selected.size === 1 ? 'y' : 'ies'} deleted`, type: 'success' });
            setSelected(new Set());
            fetchData();
        } catch {
            setToast({ message: 'Failed to delete some entries', type: 'error' });
        }
    };

    // Toggle has_student_count on the category (Show on Report)
    const handleToggleShowOnReport = async (cat) => {
        try {
            await api.patch(`consumption-categories/${cat.id}/`, {
                has_student_count: !cat.has_student_count
            });
            setCategories(prev => prev.map(c =>
                c.id === cat.id ? { ...c, has_student_count: !c.has_student_count } : c
            ));
            setToast({ message: `"Show on Report" updated for ${cat.name}`, type: 'success' });
        } catch {
            setToast({ message: 'Failed to update setting', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { show_on_report, ...entryFields } = formData;
            const payload = {
                ...entryFields,
                second_count: formData.second_count === '' ? null : formData.second_count
            };
            if (editingEntry) {
                await api.put(`category-student-counts/${editingEntry.id}/`, payload);
            } else {
                await api.post('category-student-counts/', payload);
            }
            // PATCH category has_student_count if it changed
            const cat = categories.find(c => c.id === parseInt(formData.category));
            if (cat && cat.has_student_count !== show_on_report) {
                await api.patch(`consumption-categories/${cat.id}/`, {
                    has_student_count: show_on_report
                });
            }
            setToast({ message: editingEntry ? 'Entry updated successfully' : 'Entry added successfully', type: 'success' });
            setShowModal(false);
            fetchData();
        } catch {
            setToast({ message: 'Failed to save entry', type: 'error' });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'category') {
            // Auto-populate show_on_report from the selected category
            const cat = categories.find(c => c.id === parseInt(value));
            setFormData(prev => ({
                ...prev,
                category: value,
                show_on_report: cat ? cat.has_student_count : true
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
    };

    const getEffectiveStatus = (effectiveDate) => {
        const today = new Date().toISOString().split('T')[0];
        if (effectiveDate <= today) {
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    Active
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                Future
            </span>
        );
    };

    const thClass = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-800 whitespace-nowrap";

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                        Student Count by Category
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">
                        Track student counts per category over time. The report uses the effective count for each month.
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    + Add Entry
                </button>
            </div>

            {/* Filter + Bulk Delete toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setSelected(new Set()); }}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                {someSelected && (
                    <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                        Delete Selected ({selected.size})
                    </button>
                )}
            </div>

            {/* Info box */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-300">
                <strong>How it works:</strong> For each month the system picks the most recent entry on or before
                that month&apos;s last day. <em>1st Count</em> → normal water; <em>2nd Count</em> → drinking water
                (falls back to 1st Count if blank). <em>Show on Report</em> (per category) can hide both counts entirely.
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto border border-gray-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                            <th onClick={() => handleSort('category_name')} className={thClass}>
                                Category <SortIcon direction={sortConfig.key === 'category_name' ? sortConfig.direction : null} />
                            </th>
                            <th onClick={() => handleSort('student_count')} className={thClass}>
                                Normal Water Count <SortIcon direction={sortConfig.key === 'student_count' ? sortConfig.direction : null} />
                            </th>
                            <th onClick={() => handleSort('second_count')} className={thClass}>
                                Drinking Water Count <SortIcon direction={sortConfig.key === 'second_count' ? sortConfig.direction : null} />
                            </th>
                            <th onClick={() => handleSort('display_count')} className={thClass}>
                                Display <SortIcon direction={sortConfig.key === 'display_count' ? sortConfig.direction : null} />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase whitespace-nowrap">
                                Show on Report
                            </th>
                            <th onClick={() => handleSort('effective_date')} className={thClass}>
                                Effective Date <SortIcon direction={sortConfig.key === 'effective_date' ? sortConfig.direction : null} />
                            </th>
                            <th onClick={() => handleSort('effective_date')} className={thClass}>
                                Status <SortIcon direction={sortConfig.key === 'effective_date' ? sortConfig.direction : null} />
                            </th>
                            <th onClick={() => handleSort('entered_at')} className={thClass}>
                                Entered At <SortIcon direction={sortConfig.key === 'entered_at' ? sortConfig.direction : null} />
                            </th>
                            <th onClick={() => handleSort('notes')} className={thClass}>
                                Notes <SortIcon direction={sortConfig.key === 'notes' ? sortConfig.direction : null} />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                                Actions
                            </th>
                            {/* Checkbox column on the RIGHT */}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                    title="Select all"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {displayedEntries.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="px-6 py-4 text-center text-gray-500 dark:text-slate-500">
                                    No entries found. Add a student count entry to get started.
                                </td>
                            </tr>
                        ) : (
                            displayedEntries.map(entry => {
                                const cat = categories.find(c => c.id === entry.category);
                                return (
                                    <tr
                                        key={entry.id}
                                        className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selected.has(entry.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-slate-200">
                                            {entry.category_name}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-slate-200 font-medium">
                                            {entry.student_count.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                            {entry.second_count != null && entry.second_count !== 0
                                                ? entry.second_count.toLocaleString()
                                                : <span className="text-gray-400 dark:text-slate-600">—</span>
                                            }
                                        </td>
                                        {/* Display Count badge */}
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${entry.display_count === 'second'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {entry.display_count === 'second' ? '2nd Count' : '1st Count'}
                                            </span>
                                        </td>
                                        {/* Show on Report toggle (category-level) */}
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            {cat ? (
                                                <button
                                                    onClick={() => handleToggleShowOnReport(cat)}
                                                    title={cat.has_student_count ? 'Shown on report — click to hide' : 'Hidden from report — click to show'}
                                                    className={`w-10 h-6 rounded-full transition-colors focus:outline-none ${cat.has_student_count
                                                        ? 'bg-green-500 hover:bg-green-600'
                                                        : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400'
                                                        }`}
                                                >
                                                    <span className={`block w-4 h-4 mx-auto rounded-full bg-white shadow transform transition-transform ${cat.has_student_count ? 'translate-x-2' : '-translate-x-2'
                                                        }`} />
                                                </button>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-gray-700 dark:text-slate-400">
                                            {formatDate(entry.effective_date)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {getEffectiveStatus(entry.effective_date)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-gray-500 dark:text-slate-500 text-sm">
                                            {new Date(entry.entered_at).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-4 py-4 text-gray-700 dark:text-slate-400 max-w-xs truncate">
                                            {entry.notes || '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                        {/* Checkbox on the RIGHT */}
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(entry.id)}
                                                onChange={() => toggleOne(entry.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    title={editingEntry ? 'Edit Student Count Entry' : 'Add Student Count Entry'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Effective Date *
                            </label>
                            <input
                                type="date"
                                name="effective_date"
                                value={formData.effective_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                1st Count — Normal Water *
                            </label>
                            <input
                                type="number"
                                name="student_count"
                                value={formData.student_count}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Used as the student count for normal water consumption calculations.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                2nd Count — Drinking Water{' '}
                                <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="number"
                                name="second_count"
                                value={formData.second_count}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                                placeholder="Leave blank to use 1st Count for drinking water too"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                If set, used as the student count for drinking water calculations.
                                Falls back to 1st Count if left blank.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100"
                                placeholder="e.g. New academic year 2025-26"
                            />
                        </div>

                        {/* Show on Report checkbox — controls category.has_student_count */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md border border-gray-200 dark:border-slate-600">
                            <input
                                type="checkbox"
                                id="show_on_report"
                                name="show_on_report"
                                checked={formData.show_on_report}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 cursor-pointer"
                            />
                            <label htmlFor="show_on_report" className="text-sm font-medium text-gray-900 dark:text-slate-200 cursor-pointer select-none">
                                Show Student/Staff Count on Report
                                <span className="block text-xs text-gray-500 dark:text-slate-400 font-normal">
                                    Controls whether this category appears in the Category Monthly Breakdown report.
                                    Applies to all entries for this category.
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editingEntry ? 'Update Entry' : 'Add Entry'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default StudentCountTable;
