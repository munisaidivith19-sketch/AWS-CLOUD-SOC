import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props { data: { labels: string[]; data: number[] } }

export default function TopThreatsChart({ data }: Props) {
  return (
    <Bar
      data={{
        labels: data.labels,
        datasets: [{
          label: 'Count',
          data: data.data,
          backgroundColor: 'rgba(139,92,246,0.7)',
          borderColor: 'rgb(139,92,246)',
          borderWidth: 1,
          borderRadius: 6,
        }]
      }}
      options={{
        responsive: true,
        indexAxis: 'y' as const,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
          y: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { display: false } }
        }
      }}
    />
  )
}