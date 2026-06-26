import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface Props {
  data: { labels: string[]; data: number[] }
  days?: number
}

export default function TimelineChart({ data }: Props) {
  const chartData = {
    labels: data.labels.map(l => l.slice(5)),
    datasets: [{
      label: 'Threats',
      data: data.data,
      borderColor: 'rgb(59,130,246)',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(59,130,246)',
      pointRadius: 4,
    }]
  }

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#6b7280', maxTicksLimit: 10 },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#6b7280' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            beginAtZero: true
          }
        }
      }}
    />
  )
}