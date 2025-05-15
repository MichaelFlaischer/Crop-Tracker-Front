import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { toyService } from '../services/toy.service'
import { useEffect, useState } from 'react'
import { Loader } from './Loader'
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)
export function LabelsDoughnut() {
    const [chartData, setChartData] = useState(null)

    useEffect(() => {
        fetchLabels()
    }, [])

    async function fetchLabels() {
        try {
            const labelCounts = await toyService.getLabelCounts()
            setData(labelCounts)
        } catch (error) {
            console.log("Couldn't fetch labels", error)
        }
    }

    function setData(labelCounts) {
        const data = {
            labels: labelCounts.map(labelCount => labelCount.label),
            datasets: [
                {
                    label: '# of Toys',
                    data: labelCounts.map(labelCount => labelCount.count),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(128, 128, 128, 0.2)',
                        'rgba(0, 255, 128, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(128, 128, 128, 1)',
                        'rgba(0, 128, 0, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        }
        setChartData(data)
    }

    if (!chartData) return <Loader />

    return (
        <section
            className="flex justify-center"
            style={{
                margin: 'auto',
                position: 'relative',
                height: '40vh',
                width: '80vw',
            }}
        >
            <Doughnut data={chartData} />
        </section>
    )
}
