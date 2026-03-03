import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Toast from './Toast';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';

const MuthuNagarBuildingWise = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('reports/muthu-nagar-building-wise/', {
                params: { month, year }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
            setToast({ message: 'Failed to fetch report data', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExportExcel = () => {
        if (!data) return;

        const worksheetData = data.report_data.map((item, index) => ({
            'S.No': index + 1,
            'Building Name': item.location,
            '12 KL Loads': item.count_12kl,
            '6 KL Loads': item.count_6kl,
            'Total Quantity (Ltrs)': item.total_liters,
            'Total Amount (₹)': item.total_amount
        }));

        const summaryData = [
            ['Grand Total'],
            ['Total 12 KL Loads', data.grand_total.count_12kl],
            ['Total 6 KL Loads', data.grand_total.count_6kl],
            ['Total Quantity', `${data.grand_total.total_liters.toLocaleString()} Ltrs`],
            ['Total Amount', `₹${data.grand_total.total_amount.toLocaleString()}`]
        ];

        exportToExcel(
            worksheetData,
            `Muthu_Nagar_Building_Wise_${data.month_name}_${data.year}`,
            'Building Wise Purchase',
            `Building Wise Water Purchase from Muthu Nagar Well (${data.month_name} ${data.year})`,
            `Month: ${data.month_name} ${data.year}`,
            summaryData
        );
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            await exportReportToPDF(
                `Building Wise Water Purchase from Muthu Nagar Well (${data.month_name} ${data.year})`,
                `${data.month_name} ${data.year}`,
                null, // No charts
                'muthu-nagar-table',
                `Muthu_Nagar_Building_Wise_${data.month_name}_${data.year}`,
                'muthu-nagar-summary'
            );
        } catch (error) {
            console.error('PDF Export Error:', error);
            setToast({ message: 'Failed to export PDF', type: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                    Building Wise Water Purchase (Muthu Nagar Well)
                </h2>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Month:</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Year:</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExportExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition"
                        >
                            Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm transition"
                        >
                            {exporting ? '...' : 'PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : data && (
                <>
                    <div id="muthu-nagar-summary" className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase">Total 12 KL Loads</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.grand_total.count_12kl}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium uppercase">Total 6 KL Loads</p>
                            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{data.grand_total.count_6kl}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium uppercase">Total Quantity</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{data.grand_total.total_liters.toLocaleString()} Ltrs</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium uppercase">Total Amount</p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">₹{data.grand_total.total_amount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div id="muthu-nagar-table" className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">S.No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Building Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">12 KL Loads</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">6 KL Loads</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Quantity (Ltrs)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                {data.report_data.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">{item.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-slate-300">{item.count_12kl || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-slate-300">{item.count_6kl || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-slate-300 font-medium">{item.total_liters.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{item.total_amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-slate-900/80 font-bold border-t-2 border-gray-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100 uppercase text-center">Grand Total</td>
                                    <td className="px-6 py-4 text-right text-sm text-blue-600 dark:text-blue-400">{data.grand_total.count_12kl}</td>
                                    <td className="px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400">{data.grand_total.count_6kl}</td>
                                    <td className="px-6 py-4 text-right text-sm text-purple-600 dark:text-purple-400">{data.grand_total.total_liters.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm text-amber-600 dark:text-amber-500">₹{data.grand_total.total_amount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MuthuNagarBuildingWise;
