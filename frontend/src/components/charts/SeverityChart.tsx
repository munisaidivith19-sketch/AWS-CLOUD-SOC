import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

interface Props { data: { labels: string[]; data: number[] } }

export default function SeverityChart({ data }: Props) {
  return (
    <Doughnut
      data={{
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: ['rgba(239,68,68,0.8)','rgba(249,115,22,0.8)','rgba(234,179,8,0.8)','rgba(59,130,246,0.8)'],
          borderColor:     ['rgb(239,68,68)','rgb(249,115,22)','rgb(234,179,8)','rgb(59,130,246)'],
          borderWidth: 1,
        }]
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9ca3af', padding: 16, font: { size: 12 } }
          }
        }
      }}
    />
  )
}