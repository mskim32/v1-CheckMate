"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { useState } from "react"
import { type RiskAnalysis, getRiskLevelInfo } from "@/lib/risk-assessment"

interface RiskAssessmentPanelProps {
  analysis: RiskAnalysis
  isVisible: boolean
}

export function RiskAssessmentPanel({ analysis, isVisible }: RiskAssessmentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible) return null

  const levelInfo = getRiskLevelInfo(analysis.level)

  const getIcon = () => {
    switch (analysis.level) {
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "low":
        return <Info className="h-5 w-5 text-blue-600" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="font-semibold text-gray-900">위험도 분석 결과</span>
          <Badge variant="outline" className="text-gray-600 bg-gray-100">
            경고
          </Badge>
        </div>
        <div className="text-sm font-medium text-gray-700">
          {analysis.score}/100
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-gray-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${analysis.score}%` }}
        ></div>
      </div>

      <div className={`text-sm mb-3 ${analysis.category === "부당특약" ? "text-red-700 font-bold" : "text-gray-700"}`}>
        <strong>분석 결과:</strong> 
        {analysis.category === "부당특약" ? (
          <span className="text-red-700 font-bold flex items-center gap-1">
            <span className="text-red-600">!</span>
            부당특약 있음
          </span>
        ) : (
          "부당특약 없음"
        )}
      </div>

      {analysis.issues.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">발견된 위험 요소:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {analysis.issues.map((issue, index) => (
              <li key={index} className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className={`w-full justify-between p-2 h-auto rounded-md ${analysis.category === "부당특약" ? "bg-red-50 hover:bg-red-100 border border-red-200" : "bg-gray-50 hover:bg-gray-100"}`}>
            <span className={`text-sm font-semibold ${analysis.category === "부당특약" ? "text-red-700" : "text-gray-700"}`}>
              {analysis.category === "부당특약" && <span className="text-red-600 mr-1">⚠️</span>}
              검토 내용 상세
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className={`text-sm space-y-2 p-3 rounded-md ${analysis.category === "부당특약" ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"}`}>
            {analysis.suggestions.map((suggestion, index) => (
              <div key={index} className={`flex items-start gap-2 ${analysis.category === "부당특약" ? "text-red-800" : "text-gray-700"}`}>
                <span className={`text-sm mt-0.5 ${analysis.category === "부당특약" ? "text-red-600" : "text-gray-500"}`}>•</span>
                <span className="leading-relaxed">{suggestion}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {analysis.blockedKeywords.length > 0 && (
        <div className="mt-3 bg-pink-50 border border-pink-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-gray-700">차단된 키워드:</span>
          </div>
          <div className="text-red-600 font-medium mb-1">
            {analysis.blockedKeywords.join(", ")}
          </div>
          <div className="text-xs text-red-600">
            이러한 키워드가 포함된 조건은 추가할 수 없습니다.
          </div>
        </div>
      )}
    </div>
  )
}
