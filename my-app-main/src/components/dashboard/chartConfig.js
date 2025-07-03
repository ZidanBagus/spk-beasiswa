import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, Title,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register all Chart.js components and plugins
ChartJS.register(
    ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, ChartDataLabels
);

// Default chart data structure
export const createDefaultChartData = (labels, colors) => ({
    labels,
    datasets: [
        { label: 'Terima', data: Array(labels.length).fill(0), backgroundColor: colors.terima.bg, borderColor: colors.terima.border, borderWidth: 1 },
        { label: 'Tidak', data: Array(labels.length).fill(0), backgroundColor: colors.tidak.bg, borderColor: colors.tidak.border, borderWidth: 1 }
    ]
});

// Chart options generator
export const getChartOptions = (title, type = 'bar', additionalOptions = {}) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 20 } },
            title: { display: true, text: title, font: { size: 15, weight: '600' }, padding: { bottom: 15 } },
            datalabels: { display: false },
            ...additionalOptions.plugins
        },
        scales: {
            x: { stacked: type === 'bar', grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { stacked: type === 'bar', beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } }
        },
        ...additionalOptions
    };

    if (type === 'doughnut') {
        options.plugins.legend.position = 'right';
        options.scales = {};
    }

    if (type === 'horizontalBar') {
        options.indexAxis = 'y';
        options.scales.x.stacked = false;
        options.scales.y.stacked = false;
    }
    
    if (type === 'line') {
        options.elements = { line: { tension: 0.4 }, point: { radius: 3 } };
    }

    return options;
};

// Color and label configurations for each chart
export const chartConfig = {
    ipk: {
        type: 'bar',
        labels: ['<3.00', '3.00-3.25', '3.26-3.50', '3.51-3.75', '>3.75'],
        colors: { 
            terima: { bg: 'rgba(25, 135, 84, 0.8)', border: 'rgba(25, 135, 84, 1)' }, 
            tidak: { bg: 'rgba(220, 53, 69, 0.8)', border: 'rgba(220, 53, 69, 1)' } 
        }
    },
    penghasilan: {
        type: 'bar',
        labels: ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'],
        colors: { 
            terima: { bg: 'rgba(13, 110, 253, 0.8)', border: 'rgba(13, 110, 253, 1)' }, 
            tidak: { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgba(255, 193, 7, 1)' } 
        }
    },
    tanggungan: {
        type: 'bar',
        labels: ['1', '2', '3', '4', '> 4'],
        colors: { 
            terima: { bg: 'rgba(23, 162, 184, 0.8)', border: 'rgba(23, 162, 184, 1)' }, 
            tidak: { bg: 'rgba(255, 193, 7, 0.6)', border: 'rgba(255, 193, 7, 1)' } 
        }
    },
    organisasi: {
        type: 'bar',
        title: 'Hasil Berdasarkan Keikutsertaan Organisasi',
        labels: ['Ya', 'Tidak'],
        colors: { 
            terima: { bg: 'rgba(25, 135, 84, 0.8)', border: 'rgba(25, 135, 84, 1)' }, 
            tidak: { bg: 'rgba(220, 53, 69, 0.8)', border: 'rgba(220, 53, 69, 1)' } 
        }
    },
    ukm: {
        type: 'bar',
        title: 'Hasil Berdasarkan Keikutsertaan UKM',
        labels: ['Ya', 'Tidak'],
        colors: { 
            terima: { bg: 'rgba(25, 135, 84, 0.8)', border: 'rgba(25, 135, 84, 1)' }, 
            tidak: { bg: 'rgba(220, 53, 69, 0.8)', border: 'rgba(220, 53, 69, 1)' } 
        }
    }
};
