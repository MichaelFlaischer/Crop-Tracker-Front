import { LabelsDoughnut } from '../cmps/LabelsDoughnut'
import { LabelsLineChart } from '../cmps/LabelsLineChart'

export function ToyDashboard() {
    return (
        <section className="toy-dashboard">
            <LabelsDoughnut />
            <LabelsLineChart />
        </section>
    )
}
