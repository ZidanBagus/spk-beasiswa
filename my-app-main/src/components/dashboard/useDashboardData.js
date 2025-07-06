import { useState, useCallback, useMemo } from 'react';
import applicantService from '../../services/applicantService';
import reportService from '../../services/reportService';
import { chartConfig, createDefaultChartData } from './chartConfig';

const useDashboardData = () => {
    const [stats, setStats] = useState({
        summary: { Terima: 0, Tidak: 0, total: 0 },
        applicants: { totalApplicants: 0, applicantsToday: 0 },
        charts: {
            ipk: createDefaultChartData(chartConfig.ipk.labels, chartConfig.ipk.colors),
            penghasilan: createDefaultChartData(chartConfig.penghasilan.labels, chartConfig.penghasilan.colors),
            organisasi: createDefaultChartData(chartConfig.organisasi.labels, chartConfig.organisasi.colors),
            tanggungan: createDefaultChartData(chartConfig.tanggungan.labels, chartConfig.tanggungan.colors),
            ukm: createDefaultChartData(chartConfig.ukm.labels, chartConfig.ukm.colors),
        }
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const processChartData = useCallback((attribute, labels, getCategoryFunc, results) => {
        const chartData = createDefaultChartData(labels, chartConfig[attribute].colors);
        results.forEach(item => {
            const category = getCategoryFunc(item);
            const index = labels.indexOf(category);
            if (index > -1) {
                const status = (item.statusKelulusan || '').trim();
                if (status === 'Terima') chartData.datasets[0].data[index]++;
                else if (status === 'Tidak') chartData.datasets[1].data[index]++;
            }
        });
        return chartData;
    }, []);

    const processDoughnutData = useCallback((attribute, results) => {
        const config = chartConfig[attribute];
        const chartData = createDefaultChartData(config.labels, config.colors);
        
        results.forEach(item => {
            const category = item[attribute] === 'Ya' ? 'Ya' : 'Tidak';
            const index = config.labels.indexOf(category);
            if (index > -1) {
                const status = (item.statusKelulusan || '').trim();
                if (status === 'Terima') chartData.datasets[0].data[index]++;
                else if (status === 'Tidak') chartData.datasets[1].data[index]++;
            }
        });
        
        return chartData;
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [applicantStatsRes, reportRes] = await Promise.all([
                applicantService.getApplicantStats(),
                reportService.getAllSelectionResults({ limit: 10000 })
            ]);

            const results = reportRes.results || [];
            
            const summary = results.reduce((acc, curr) => {
                const status = (curr.statusKelulusan || "Tidak").trim();
                if (status === 'Terima') acc.Terima += 1; else acc.Tidak += 1;
                return acc;
            }, { Terima: 0, Tidak: 0 });
            summary.total = results.length;

            setStats({
                summary,
                applicants: applicantStatsRes || stats.applicants,
                charts: {
                    ipk: processChartData('ipk', chartConfig.ipk.labels, item => {
                        const ipk = parseFloat(item.ipk);
                        if (ipk < 3.0) return '<3.00'; if (ipk <= 3.25) return '3.00-3.25'; if (ipk <= 3.50) return '3.26-3.50'; if (ipk <= 3.75) return '3.51-3.75'; return '>3.75';
                    }, results),
                    penghasilan: processChartData('penghasilan', chartConfig.penghasilan.labels, item => item.penghasilanOrtu, results),
                    tanggungan: processChartData('tanggungan', chartConfig.tanggungan.labels, item => {
                        const tanggungan = parseInt(item.jmlTanggungan);
                        if (tanggungan <= 1) return '1'; if (tanggungan === 2) return '2'; if (tanggungan === 3) return '3'; if (tanggungan === 4) return '4'; return '> 4';
                    }, results),
                    organisasi: processDoughnutData('ikutOrganisasi', results),
                    ukm: processDoughnutData('ikutUKM', results)
                }
            });

        } catch (err) {
            setError('Gagal memuat data dashboard. Pastikan backend berjalan dan coba lagi.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [processChartData, processDoughnutData, stats.applicants]);

    return { stats, isLoading, error, fetchData };
};

export default useDashboardData;
