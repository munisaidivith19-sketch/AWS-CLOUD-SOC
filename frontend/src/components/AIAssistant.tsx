import { useState } from 'react'
import { Bot, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Threat } from '../types'

interface Props { threat: Threat }

export default function AIAssistant({ threat }: Props) {
  const [open, setOpen] = useState(false)

  const scoreColor =
    threat.risk_score >= 90 ? 'text-red-400' :
    threat.risk_score >= 70 ? 'text-orange-400' :
    threat.risk_score >= 40 ? 'text-yellow-400' : 'text-blue-400'

  return (
    <div className="bg-gray-800 border border-purple-500/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">AI Security Analysis</p>
            <p className="text-gray-400 text-xs">Risk Score:
              <span className={`ml-1 font-bold ${scoreColor}`}>
                {threat.risk_score}/100
              </span>
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Analysis */}
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Analysis
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              {threat.ai_analysis || 'No analysis available.'}
            </p>
          </div>

          {/* Recommendations */}
          {threat.recommendations && threat.recommendations.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Recommended Actions
              </p>
              <ul className="space-y-2">
                {threat.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <AlertTriangle className="w-3 h-3 text-orange-400 mt-1 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}