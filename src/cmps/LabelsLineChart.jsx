import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    RadialLinearScale,
    Title,
    Tooltip,
} from 'chart.js'
import React from 'react'
import { Line } from 'react-chartjs-2'
ChartJS.register(
    CategoryScale,
    RadialLinearScale,
    ArcElement,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export function LabelsLineChart() {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Toys Prices',
            },
            tooltip: {
                callbacks: {
                    label: context => `$${context.formattedValue}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: value => `$${value}`,
                },
            },
        },
    }
    const labels = [
        '2000',
        '2005',
        '2008',
        '2013',
        '2017',
        '2020',
        '2021',
        '2022',
        '2023',
    ]

    const generateRandomData = () => {
        return labels.map(() => Math.floor(Math.random() * 20 + 5))
    }

    const data = {
        labels,
        datasets: [
            {
                label: 'Prices',
                data: generateRandomData(),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    }

    return (
        <section
            className="flex justify-center"
            style={{
                margin: 'auto',
                position: 'relative',
                height: '30vh',
                width: '80vw',
            }}
        >
            <Line options={options} data={data} />
        </section>
    )
}
