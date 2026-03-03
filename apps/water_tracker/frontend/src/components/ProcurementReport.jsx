import { useState, useEffect } from 'react';
import api from '../services/api';

function fmtDate(d) {
    if (!d) return 'NA';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtCurrency(v) {
    if (v === null || v === undefined || v === '') return 'NA';
    return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProcurementReport() {
    const [monthlyData, setMonthlyData] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const defaultEnd = today.toISOString().slice(0, 7); // YYYY-MM
    today.setMonth(today.getMonth() - 2);
    const defaultStart = today.toISOString().slice(0, 7);

    const [filters, setFilters] = useState({
        start_month: defaultStart,
        end_month: defaultEnd
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('reports/procurement/', { params: filters });
            const data = res.data;
            setMonthlyData(data.monthly_data || []);
            setGrandTotal(data.grand_total || 0);
        } catch (err) {
            console.error('Failed to fetch procurement report', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Procurement Tracker Report</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Month-wise grouped procurement summary</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">From:</label>
                        <input
                            type="month"
                            name="start_month"
                            value={filters.start_month}
                            onChange={handleFilterChange}
                            className="text-sm px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-slate-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">To:</label>
                        <input
                            type="month"
                            name="end_month"
                            value={filters.end_month}
                            onChange={handleFilterChange}
                            className="text-sm px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-slate-200"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        {loading ? 'Loading...' : 'Update Report'}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
                    >
                        Print
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-500 text-white text-[11px] uppercase tracking-wider font-semibold">
                                <th className="px-3 py-3 border border-slate-600 text-center w-12">S No</th>
                                <th className="px-3 py-3 border border-slate-600">PR No</th>
                                <th className="px-3 py-3 border border-slate-600">Block details</th>
                                <th className="px-3 py-3 border border-slate-600">Description Of Work</th>
                                <th className="px-3 py-3 border border-slate-600">Vendor</th>
                                <th className="px-3 py-3 border border-slate-600">Category</th>
                                <th className="px-3 py-3 border border-slate-600">PO Date</th>
                                <th className="px-3 py-3 border border-slate-600 text-center w-20">PO No</th>
                                <th className="px-3 py-3 border border-slate-600 text-right">PO Value</th>
                                <th className="px-3 py-3 border border-slate-600">Opex date</th>
                                <th className="px-3 py-3 border border-slate-600 text-center w-20">Opex No</th>
                                <th className="px-3 py-3 border border-slate-600 text-right">Opex Value</th>
                                <th className="px-3 py-3 border border-slate-600 text-center">Payments Status</th>
                                <th className="px-3 py-3 border border-slate-600 text-center bg-slate-600">Month</th>
                                <th className="px-3 py-3 border border-slate-600 text-right bg-slate-600">Month wise Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px]">
                            {loading ? (
                                <tr><td colSpan="15" className="px-6 py-10 text-center text-gray-500 italic">Fetching data...</td></tr>
                            ) : monthlyData.length === 0 ? (
                                <tr><td colSpan="15" className="px-6 py-10 text-center text-gray-500 italic">No entries found for the selected range.</td></tr>
                            ) : (
                                monthlyData.map((group, groupIdx) => (
                                    group.entries.map((entry, entryIdx) => {
                                        const globalSNo = monthlyData.slice(0, groupIdx).reduce((acc, g) => acc + g.entries.length, 0) + entryIdx + 1;
                                        return (
                                            <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0 font-medium">
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-center text-gray-500 bg-gray-50/50 dark:bg-slate-700/30">{globalSNo}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200">{entry.pr_no || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400">{entry.block_details || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={entry.description}>{entry.description || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold">{entry.vendor || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400">{entry.category || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400">{fmtDate(entry.po_date)}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-center text-gray-600 dark:text-slate-400">{entry.po_no || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-right text-gray-700 dark:text-slate-300">{fmtCurrency(entry.po_value)}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400">{fmtDate(entry.opex_date)}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-center font-bold text-gray-800 dark:text-slate-200 bg-yellow-50/30 dark:bg-yellow-900/10">{entry.opex_no || 'NA'}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-right font-bold text-gray-800 dark:text-slate-100 bg-yellow-50/50 dark:bg-yellow-900/10">{fmtCurrency(entry.opex_value)}</td>
                                                <td className="px-3 py-2 border border-gray-200 dark:border-slate-600 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.payment_status === 'paid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {entry.payment_status === 'paid' ? 'Paid' : 'Process'}
                                                    </span>
                                                </td>
                                                {entryIdx === 0 && (
                                                    <>
                                                        <td rowSpan={group.entries.length} className="px-3 py-2 border border-gray-300 dark:border-slate-500 text-center font-bold bg-gray-50 dark:bg-slate-700/50 text-gray-800 dark:text-slate-100">
                                                            {group.month_label}
                                                        </td>
                                                        <td rowSpan={group.entries.length} className="px-3 py-2 border border-gray-300 dark:border-slate-500 text-right font-black bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white">
                                                            {fmtCurrency(group.month_total)}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-700 text-white font-bold">
                                <td colSpan="11" className="px-4 py-3 text-right uppercase tracking-wider">Grand Total</td>
                                <td className="px-3 py-3 text-right">{fmtCurrency(grandTotal)}</td>
                                <td colSpan="2" className="bg-slate-800 border-l border-slate-600"></td>
                                <td className="px-3 py-3 text-right bg-slate-900">{fmtCurrency(grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
