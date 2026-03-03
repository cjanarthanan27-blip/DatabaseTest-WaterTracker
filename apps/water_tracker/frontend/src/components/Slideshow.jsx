import { useState, useEffect, useCallback, Fragment } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportReportToPPTX } from '../utils/pptxExport';
import { formatDateRange } from '../utils/pdfExport';
import Toast from './Toast';
import logo from '../assets/logo.png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Text } from 'recharts';

const CustomXAxisTick = ({ x, y, payload }) => (
    <Text x={x} y={y} width={100} textAnchor="middle" verticalAnchor="start" fontSize={11} fontWeight={700} className="fill-slate-500">{payload.value}</Text>
);

const Slideshow = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [toast, setToast] = useState(null);
    const [exporting, setExporting] = useState(false);

    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const reportType = searchParams.get('report');

    const fetchData = useCallback(async () => {
        if (!reportType) return;
        try {
            setLoading(true);
            const response = await api.get('reports/category-monthly-breakdown', { params: { start_date: startDate, end_date: endDate } });
            setData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading slideshow data:', error);
            setToast({ message: 'Failed to load data', type: 'error' });
            setLoading(false);
        }
    }, [reportType, startDate, endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getSlides = () => {
        if (!data || data.length === 0) return [];
        const slides = [];

        // 1. Institutional breakdown-tables (With student count)
        slides.push({ id: 'cate-student-breakdown', title: 'Institutional Student Consumption Metrics', type: 'breakdown-tables', filter: true });

        // 2. Direct breakdown-tables (Without student count)
        slides.push({ id: 'cate-direct-breakdown', title: 'Direct Category Consumption Details', type: 'breakdown-tables', filter: false });

        // 3. Water KL Chart + breakdown table
        slides.push({ id: 'cate-water-kl-chart', title: 'Water Consumption Analysis (KL)', type: 'chart', chartType: 'water-kl' });

        // 4. Water Amount Chart + breakdown table
        slides.push({ id: 'cate-water-amount-chart', title: 'Water Expenditure Analysis (₹)', type: 'chart', chartType: 'water-cost' });

        // 5. Budget Chart + breakdown table
        if (data.some(m => m.budget_spend)) {
            slides.push({ id: 'cate-budget-summary', title: 'Budget vs Actual Performance', type: 'budget' });
        }

        // 6-9. Departmental Metrics (Chart + Table)
        if (data.some(m => m.institute_summary)) slides.push({ id: 'cate-institute-summary', title: 'Department Metrics: Institute', type: 'consumption', subType: 'institute' });
        if (data.some(m => m.schools_summary)) slides.push({ id: 'cate-schools-summary', title: 'Department Metrics: Schools', type: 'consumption', subType: 'schools' });
        if (data.some(m => m.hostels_summary)) slides.push({ id: 'cate-hostels-summary', title: 'Department Metrics: Hostels', type: 'consumption', subType: 'hostels' });
        if (data.some(m => m.kitchen_summary)) slides.push({ id: 'cate-kitchen-summary', title: 'Department Metrics: Kitchen', type: 'consumption', subType: 'kitchen' });

        return slides;
    };

    const slides = getSlides();

    useEffect(() => {
        let interval;
        if (isPlaying && slides.length > 0) interval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 8000);
        return () => clearInterval(interval);
    }, [isPlaying, slides.length]);

    const handleExportPPT = async () => {
        if (exporting) return;
        try {
            setExporting(true);
            const dateRangeText = formatDateRange(startDate, endDate);
            await exportReportToPPTX('WATER TRACKING REPORT', dateRangeText, slides.map(s => s.id), 'water_report', logo);
            setToast({ message: 'Professional PPT generated successfully', type: 'success' });
        } catch {
            setToast({ message: 'PPT export failed', type: 'error' });
        } finally { setExporting(false); }
    };



    const handleNext = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const handlePrev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const colors = ['#0ea5e9', '#ec4899', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];


    const renderTablesSlide = (filter) => {
        const cats = filter ? data[0].categories.filter(c => c.has_student_count !== false) : data[0].categories.filter(c => c.has_student_count === false);

        return (
            <div className="flex flex-col gap-6 animate-fadeIn h-full">
                <div className="rounded-[2.5rem] border-4 border-slate-100/50 overflow-hidden shadow-2xl bg-white flex-1 flex flex-col">
                    <table className="min-w-full text-xs text-center flex-1">
                        <thead className="bg-slate-900 text-white font-bold uppercase tracking-widest divide-x divide-slate-700">
                            <tr className="divide-x divide-slate-700">
                                <th className="p-4 text-left bg-slate-950" rowSpan="2">Category Name</th>
                                <th className="p-4 text-left bg-slate-950" rowSpan="2">Metric</th>
                                {data.map(m => <th key={m.month_key} colSpan="2" className="p-4 border-b border-slate-800 text-center bg-blue-900/60 shadow-inner">
                                    <span className="text-white drop-shadow-md">{m.month_name}</span>
                                </th>)}
                            </tr>
                            <tr className="divide-x divide-slate-700">
                                {data.map(m => (
                                    <Fragment key={m.month_key}>
                                        <th className="p-2 text-[10px] text-center bg-blue-700 text-white border-blue-600/50">Normal</th>
                                        <th className="p-2 text-[10px] text-center bg-emerald-700 text-white border-emerald-600/50">Drinking</th>
                                    </Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cats.map((cat, catIdx) => (
                                <Fragment key={cat.name}>
                                    {(filter ? ['QTY (KL)', 'COST (₹)', 'L/S/D', 'C/S/D'] : ['QTY (KL)', 'COST (₹)']).map((met, idx) => (
                                        <tr key={met} className={`${catIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors group divide-x divide-slate-100`}>
                                            {idx === 0 && (
                                                <td rowSpan={filter ? 4 : 2} className="p-4 font-black text-blue-950 bg-blue-50/40 border-r-2 border-blue-100">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-blue-900 font-black uppercase tracking-widest opacity-70">Category</span>
                                                        <span className="text-sm tracking-tight border-t border-blue-200/50 pt-1">{cat.name}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="p-4 font-black text-slate-950 group-hover:text-blue-900 transition-colors whitespace-nowrap bg-slate-50/30 uppercase tracking-widest text-[10px] shadow-sm">
                                                {met}
                                            </td>
                                            {data.map(m => {
                                                const c = m.categories.find(x => x.name === cat.name);
                                                let n = 0, d = 0;
                                                if (met.includes('QTY')) { n = c?.normal_qty_kl || 0; d = c?.drinking_qty_kl || 0; }
                                                else if (met.includes('COST')) { n = c?.normal_cost || 0; d = c?.drinking_cost || 0; }
                                                else if (met.includes('L/S/D')) { n = c?.lsd || 0; d = c?.drinking_lsd || 0; }
                                                else { n = c?.csd || 0; d = c?.drinking_csd || 0; }
                                                return (
                                                    <Fragment key={m.month_key}>
                                                        <td className="p-3 text-right font-black text-black text-sm tabular-nums">
                                                            {n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                        </td>
                                                        <td className="p-3 text-right font-black text-blue-900 group-hover:text-blue-950 text-sm tabular-nums transition-colors bg-blue-50/20 border-l-2 border-blue-50/50">
                                                            {d.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                        </td>
                                                    </Fragment>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderChart = (isCost) => {
        const cData = [
            { name: 'Normal Purchase', ...data.reduce((a, m) => ({ ...a, [m.month_name]: isCost ? m.summary_chart.normal_purchase_amt : m.summary_chart.normal_purchase_kl }), {}) },
            { name: 'Normal Yield', ...data.reduce((a, m) => ({ ...a, [m.month_name]: isCost ? m.summary_chart.normal_yield_amt : m.summary_chart.normal_yield_kl }), {}) },
            { name: 'Normal Consumed', ...data.reduce((a, m) => ({ ...a, [m.month_name]: isCost ? m.summary_chart.normal_consumed_amt : m.summary_chart.normal_consumed_kl }), {}) },
            { name: 'Drinking Purchase', ...data.reduce((a, m) => ({ ...a, [m.month_name]: isCost ? m.summary_chart.drinking_purchase_amt : m.summary_chart.drinking_purchase_kl }), {}) },
            { name: 'Drinking Consumed', ...data.reduce((a, m) => ({ ...a, [m.month_name]: isCost ? m.summary_chart.drinking_consumed_amt : m.summary_chart.drinking_consumed_kl }), {}) },
        ];
        return (
            <div className="flex flex-col gap-10 animate-fadeIn h-full">
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" interval={0} height={80} tick={<CustomXAxisTick />} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '12px' }} formatter={(v) => isCost ? `₹${v.toLocaleString()}` : `${v.toLocaleString()} KL`} />
                            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                            {data.map((m, i) => <Bar key={m.month_key} dataKey={m.month_name} fill={colors[i % colors.length]} radius={[6, 6, 0, 0]} barSize={40} />)}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {renderTotalsTable(isCost)}
            </div>
        );
    };

    const renderConsumptionSlide = (subType) => {
        const k = `${subType}_summary`;
        const cData = [
            { name: `Total Ltrs`, ...data.reduce((a, m) => ({ ...a, [m.month_name]: m[k]?.consumption_ltrs || 0 }), {}) },
            { name: `Total Cost`, ...data.reduce((a, m) => ({ ...a, [m.month_name]: m[k]?.consumption_cost || 0 }), {}) },
            { name: `Students`, ...data.reduce((a, m) => ({ ...a, [m.month_name]: m[k]?.student_count || 0 }), {}) },
            { name: `L/S/D`, ...data.reduce((a, m) => ({ ...a, [m.month_name]: m[k]?.ltrs_per_student || 0 }), {}) },
            { name: `Cost/S/D`, ...data.reduce((a, m) => ({ ...a, [m.month_name]: m[k]?.cost_per_student || 0 }), {}) },
        ];
        return (
            <div className="space-y-16 animate-fadeIn">
                <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={cData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" interval={0} height={120} tick={<CustomXAxisTick />} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} axisLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Legend verticalAlign="bottom" />
                        {data.map((m, i) => <Bar key={m.month_key} dataKey={m.month_name} fill={colors[i % colors.length]} radius={[8, 8, 0, 0]} />)}
                    </BarChart>
                </ResponsiveContainer>
                <div className="rounded-2xl border-2 border-slate-100 overflow-hidden shadow-2xl bg-white">
                    <table className="min-w-full text-xs text-center">
                        <thead className="bg-slate-900 text-white font-bold uppercase tracking-widest divide-x divide-slate-700">
                            <tr><th className="p-4 text-left bg-slate-950">Reporting Period</th><th className="p-4 bg-slate-900">Cons. Volume (L)</th><th className="p-4 bg-slate-900">Expenditure (₹)</th><th className="p-4 bg-slate-900">Student Population</th><th className="p-4 bg-blue-700 border-b-2 border-blue-500">Litres/Std/Day</th><th className="p-4 bg-emerald-700 border-b-2 border-emerald-500">Cost/Std/Day</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((m, i) => (
                                <tr key={m.month_key} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 transition-all divide-x divide-slate-50`}>
                                    <td className="p-4 font-black text-blue-950 text-left bg-slate-50/30">{m.month_name}</td>
                                    <td className="p-4 font-black text-black tabular-nums">{m[k]?.consumption_ltrs.toLocaleString()}</td>
                                    <td className="p-4 font-black text-black tabular-nums">{m[k]?.consumption_cost.toLocaleString()}</td>
                                    <td className="p-4 font-black text-black tabular-nums">{m[k]?.student_count.toLocaleString()}</td>
                                    <td className="p-4 font-black text-blue-950 bg-blue-100/40 tabular-nums border-x border-blue-100/50">{m[k]?.ltrs_per_student.toLocaleString()}</td>
                                    <td className="p-4 font-black text-emerald-950 bg-emerald-100/40 tabular-nums border-l border-emerald-100/50">{m[k]?.cost_per_student.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTotalsTable = (isCost) => (
        <div className="rounded-2xl border-2 border-slate-100 overflow-hidden shadow-2xl bg-white">
            <table className="min-w-full text-[10px]">
                <thead className="bg-slate-900 text-white uppercase font-black tracking-widest divide-x divide-slate-800">
                    <tr className="bg-gradient-to-r from-slate-950 to-slate-900">
                        <th className="p-2 text-left border-b-2 border-blue-500 bg-slate-950">Period</th>
                        <th className="p-2 text-right border-b-2 border-slate-700 bg-slate-900">Pur. Normal</th>
                        <th className="p-2 text-right border-b-2 border-slate-700 bg-slate-900">Yield Normal</th>
                        <th className="p-2 text-right border-b-2 border-slate-700 bg-slate-900">Cons. Normal</th>
                        <th className="p-2 text-right border-b-2 border-blue-400 bg-blue-700">Pur. Drinking</th>
                        <th className="p-2 text-right border-b-2 border-blue-400 bg-blue-700">Cons. Drinking</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((m, i) => (
                        <tr key={m.month_key} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50 transition-all divide-x divide-slate-50`}>
                            <td className="p-2 font-black text-black bg-slate-50/30">{m.month_name}</td>
                            <td className="p-2 text-right font-black text-black tabular-nums">{isCost ? `₹${m.summary_chart.normal_purchase_amt.toLocaleString()}` : m.summary_chart.normal_purchase_kl.toLocaleString()}</td>
                            <td className="p-2 text-right font-black text-black tabular-nums">{isCost ? `₹${m.summary_chart.normal_yield_amt.toLocaleString()}` : m.summary_chart.normal_yield_kl.toLocaleString()}</td>
                            <td className="p-2 text-right font-black text-black tabular-nums">{isCost ? `₹${m.summary_chart.normal_consumed_amt.toLocaleString()}` : m.summary_chart.normal_consumed_kl.toLocaleString()}</td>
                            <td className="p-2 text-right font-black text-blue-950 bg-blue-100/40 tabular-nums border-l border-blue-100/50">{isCost ? `₹${m.summary_chart.drinking_purchase_amt.toLocaleString()}` : m.summary_chart.drinking_purchase_kl.toLocaleString()}</td>
                            <td className="p-2 text-right font-black text-blue-950 bg-blue-100/40 tabular-nums border-l border-blue-100/50">{isCost ? `₹${m.summary_chart.drinking_consumed_amt.toLocaleString()}` : m.summary_chart.drinking_consumed_kl.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black divide-x divide-emerald-500">
                    <tr>
                        <td className="p-2">TOTAL</td>
                        <td className="p-2 text-right tabular-nums">{isCost ? `₹${data.reduce((s, m) => s + m.summary_chart.normal_purchase_amt, 0).toLocaleString()}` : data.reduce((s, m) => s + m.summary_chart.normal_purchase_kl, 0).toLocaleString()}</td>
                        <td className="p-2 text-right tabular-nums">{isCost ? `₹${data.reduce((s, m) => s + m.summary_chart.normal_yield_amt, 0).toLocaleString()}` : data.reduce((s, m) => s + m.summary_chart.normal_yield_kl, 0).toLocaleString()}</td>
                        <td className="p-2 text-right tabular-nums">{isCost ? `₹${data.reduce((s, m) => s + m.summary_chart.normal_consumed_amt, 0).toLocaleString()}` : data.reduce((s, m) => s + m.summary_chart.normal_consumed_kl, 0).toLocaleString()}</td>
                        <td className="p-2 text-right tabular-nums">{isCost ? `₹${data.reduce((s, m) => s + m.summary_chart.drinking_purchase_amt, 0).toLocaleString()}` : data.reduce((s, m) => s + m.summary_chart.drinking_purchase_kl, 0).toLocaleString()}</td>
                        <td className="p-2 text-right tabular-nums">{isCost ? `₹${data.reduce((s, m) => s + m.summary_chart.drinking_consumed_amt, 0).toLocaleString()}` : data.reduce((s, m) => s + m.summary_chart.drinking_consumed_kl, 0).toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );

    const renderSlide = (s) => {
        if (!s) return null;
        switch (s.type) {
            case 'breakdown-tables': return renderTablesSlide(s.filter);
            case 'chart': return renderChart(s.chartType === 'water-cost');
            case 'budget': return (
                <div className="flex flex-col gap-10 animate-fadeIn h-full">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Approved Budget', ...data.reduce((a, m) => ({ ...a, [m.month_name]: m.budget_spend?.approved_budget || 0 }), {}) }, { name: 'Actual Spend', ...data.reduce((a, m) => ({ ...a, [m.month_name]: m.budget_spend?.cumulative_spend || 0 }), {}) }]} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" interval={0} height={80} tick={<CustomXAxisTick />} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '12px' }} formatter={(v) => `₹${v.toLocaleString()}`} />
                                <Legend verticalAlign="bottom" />
                                {data.map((m, i) => <Bar key={m.month_key} dataKey={m.month_name} fill={colors[i % colors.length]} radius={[6, 6, 0, 0]} />)}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="rounded-2xl border-2 border-slate-100 overflow-hidden shadow-2xl bg-white">
                        <table className="min-w-full text-[10px]">
                            <thead className="bg-slate-900 text-white uppercase font-black tracking-widest divide-x divide-slate-800">
                                <tr className="bg-gradient-to-r from-slate-950 to-slate-900">
                                    <th className="p-2 text-left border-b-2 border-blue-500 bg-slate-950">Metric</th>
                                    {data.map(m => <th key={m.month_key} className="p-2 text-right">{m.month_name}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-white hover:bg-blue-50/50 transition-all divide-x divide-slate-50">
                                    <td className="p-2 font-black text-black bg-slate-50/30 border-r border-slate-100">Approved Budget</td>
                                    {data.map(m => <td key={m.month_key} className="p-2 text-right font-black text-black tabular-nums whitespace-nowrap">₹{m.budget_spend?.approved_budget.toLocaleString()}</td>)}
                                </tr>
                                <tr className="bg-slate-50/50 hover:bg-blue-50/50 transition-all divide-x divide-slate-50">
                                    <td className="p-2 font-black text-black bg-slate-50/30 border-r border-slate-100">Actual Spend</td>
                                    {data.map(m => <td key={m.month_key} className="p-2 text-right font-black text-black tabular-nums whitespace-nowrap">₹{m.budget_spend?.cumulative_spend.toLocaleString()}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            );
            case 'consumption': return renderConsumptionSlide(s.subType);
            default: return null;
        }
    };

    if (loading) return <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-6"><div className="w-16 h-16 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div><p className="text-2xl font-black tracking-widest animate-pulse uppercase">Building Presentation...</p></div>;

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col overflow-hidden select-none font-sans">
            {/* Top Navigation / Player Header */}
            <div className="h-16 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between px-10 shadow-2xl relative z-20">
                <div className="flex items-center gap-6">
                    <div className="bg-blue-600 text-white font-black px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        Slide {currentSlide + 1} / {slides.length}
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-1.5 rounded-lg shadow-md">
                            <img src={logo} alt="Logo" className="h-6 w-auto object-contain" />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Analysis</h2>
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <h2 className="text-[9px] font-black text-blue-500/30 uppercase tracking-[0.8em] mb-1 select-none">Live Presentation</h2>
                    <div className="h-0.5 w-12 bg-blue-600 self-center mx-auto rounded-full"></div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right mr-2">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest block leading-none mb-0.5">Period</span>
                        <span className="text-[11px] font-black text-white uppercase tracking-tighter leading-none">{formatDateRange(startDate, endDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/reports?tab=${reportType}`)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-5 py-2 rounded-xl text-[10px] font-black transition-all">EXIT</button>
                    </div>
                </div>
            </div>

            {/* Main Presentation Area */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-y-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#0f172a]">
                {/* PPT Capture Area (Ghost rendered for export) */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }}>
                    {slides.map((s, idx) => (
                        <div key={s.id} id={s.id} className="bg-white p-12 mb-20 relative overflow-hidden" style={{ width: '1200px', minHeight: '800px' }}>
                            {/* Branded Slide Look for Capture */}

                            {/* Header Sync with UI */}
                            <div className="mb-12 flex items-center justify-between border-b-2 border-slate-50 pb-8">
                                <div className="flex items-center gap-8">
                                    <div className="bg-slate-950 p-3 rounded-2xl flex items-center justify-center">
                                        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
                                    </div>
                                    <div className="h-12 w-0.5 bg-slate-100 rounded-full"></div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tighter mb-1">{s.title}</h1>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Continuous Monitoring • Strategic Insight</p>
                                    </div>
                                </div>
                                <div className="text-6xl font-black text-slate-50">{String(idx + 1).padStart(2, '0')}</div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1">
                                {renderSlide(s)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Visible Slide Container */}
                <div className="max-w-[1600px] w-full mx-auto animate-fadeIn relative z-10 px-4">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-100 flex flex-col min-h-[820px] relative overflow-y-auto max-h-[92vh] custom-scrollbar">

                        {/* Slide Internal Header */}
                        <div className="mb-12 flex items-center justify-between border-b-2 border-slate-50 pb-8">
                            <div className="flex items-center gap-8">
                                <div className="bg-slate-950 p-3 rounded-2xl shadow-xl ring-4 ring-slate-50 flex items-center justify-center">
                                    <img src={logo} alt="Company Logo" className="h-10 w-auto object-contain" />
                                </div>
                                <div className="h-12 w-0.5 bg-slate-100 rounded-full"></div>
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                                        {slides[currentSlide]?.title}
                                    </h1>
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Continuous Monitoring • Strategic Insight</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-6xl font-black text-slate-50 tabular-nums select-none leading-none tracking-tighter">
                                    {String(currentSlide + 1).padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1">{renderSlide(slides[currentSlide])}</div>
                    </div>
                </div>
            </div>

            {/* Controls / Footer */}
            <div className="h-16 bg-[#1e293b] border-t border-slate-800 flex items-center justify-between px-16 relative z-20">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-blue-500/60 uppercase tracking-[0.4em] mb-0.5">Project</span>
                        <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] tracking-widest">
                            <span className="text-white">RATHINAM</span> GROUP
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <button onClick={handlePrev} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-90 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="bg-blue-600 text-white rounded-2xl p-4 hover:scale-105 active:scale-95 transition-all shadow-lg hover:bg-blue-500 group flex items-center justify-center">
                        {isPlaying ?
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg> :
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168l4 2a1 1 0 010 1.764l-4 2A1 1 0 018 12V8a1 1 0 011.555-.832z" clipRule="evenodd"></path></svg>
                        }
                    </button>
                    <button onClick={handleNext} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-90 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                    </button>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Progress</span>
                    <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner flex">
                        <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-1000 ease-out" style={{ width: `${((currentSlide + 1) / (slides.length || 1)) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <style dangerouslySetInnerHTML={{ __html: `.animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); } @keyframes fadeIn { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }` }} />
        </div>
    );
};

export default Slideshow;
