"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { conditionData, conditionCategories, workTypeNames } from "@/lib/condition-data"
import { RiskAssessmentPanel } from "@/components/risk-assessment-panel"
import { Search, CheckSquare, Square, Filter, RotateCcw, Shield } from "lucide-react"
import { analyzeRisk, type RiskAnalysis } from "@/lib/risk-assessment"

interface ProjectInfo {
  name: string
  location: string
  client: string
  summary: string
  projectType: string
  detailedType: string
}

interface ConditionTabsProps {
  projectInfo: ProjectInfo
  selectedConditions: any
  setSelectedConditions: (conditions: any) => void
  showModal: (title: string, message: string, type: "success" | "warning" | "error", onConfirm?: () => void) => void
}

export function ConditionTabs({ projectInfo, selectedConditions, setSelectedConditions, showModal }: ConditionTabsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  
  // 현장 특수사항 추가 상태
  const [customConditionText, setCustomConditionText] = useState("")
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [showRiskAnalysis, setShowRiskAnalysis] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleConditionChange = (conditionId: string, checked: boolean, tab: string) => {
    console.log('ConditionTabs - handleConditionChange 호출:', { conditionId, checked, tab, detailedType: projectInfo.detailedType })
    
    const updatedConditions = { ...selectedConditions }
    const currentProjectConditions = updatedConditions[projectInfo.detailedType]

    if (checked) {
      const dataSource = tab === "basic" ? conditionData.basic : (conditionData as any)[projectInfo.detailedType]?.[tab] || []
      const condition = dataSource.find((c: any) => c.id === conditionId)
      if (condition && !currentProjectConditions[tab].some((c: any) => c.id === conditionId)) {
        currentProjectConditions[tab].push(condition)
        console.log('ConditionTabs - 조건 추가됨:', condition)
      }
    } else {
      currentProjectConditions[tab] = currentProjectConditions[tab].filter((c: any) => c.id !== conditionId)
      console.log('ConditionTabs - 조건 제거됨:', conditionId)
    }

    console.log('ConditionTabs - 업데이트된 조건들:', updatedConditions)
    setSelectedConditions(updatedConditions)
  }

  // 현장 특수사항 추가 관련 함수들
  const handleReviewRisk = async () => {
    if (!customConditionText.trim()) {
      showModal("입력 오류", "분석할 내용을 먼저 입력해 주세요.", "error")
      return
    }

    setIsAnalyzing(true)
    try {
      // Call backend MISO workflow API
      const res = await fetch("/api/miso/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: customConditionText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "API 오류")
      }

      // Create analysis based on MISO result
      const misoResult = data?.result ?? ""
      const hasUnfairClause = misoResult.includes("부당특약") || misoResult.includes("부당")
      
      const analysis = {
        score: hasUnfairClause ? 75 : 5,
        level: hasUnfairClause ? "high" as const : "low" as const,
        category: hasUnfairClause ? "부당특약" : "일반사항",
        issues: hasUnfairClause ? ["부당특약 발견"] : [],
        suggestions: [misoResult], // MISO 결과를 권장사항으로 사용
        blockedKeywords: [],
      }
      
      setRiskAnalysis(analysis)
      setShowRiskAnalysis(true)

      // Optionally persist brief history
      const history = JSON.parse(localStorage.getItem("risk-analysis-history") || "[]")
      history.push({
        text: customConditionText,
        analysis,
        timestamp: new Date().toISOString(),
        misoResult: data?.result ?? "",
      })
      if (history.length > 10) {
        history.shift()
      }
      localStorage.setItem("risk-analysis-history", JSON.stringify(history))
    } catch (e: any) {
      console.error(e)
      showModal("API 오류", e?.message || "미소 API 호출 중 오류가 발생했습니다.", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddCustomCondition = () => {
    if (!customConditionText.trim()) {
      showModal("입력 오류", "추가할 내용을 먼저 입력해 주세요.", "error")
      return
    }

    if (!riskAnalysis) {
      showModal("경고", "위험도 분석을 먼저 진행해 주세요. 위험도 분석을 하지 않으면 조건을 추가할 수 없습니다.", "warning")
      return
    }

    if (riskAnalysis.level === "critical" || riskAnalysis.level === "high") {
      showModal(
        "위험도 높음",
        `위험도가 ${riskAnalysis.level === "critical" ? "매우 높은" : "높은"} 조건입니다. 강제로 추가하시겠습니까?`,
        "warning",
        () => {
          // 강제 추가 로직
          const newCondition = {
            id: `custom-${Date.now()}`,
            text: customConditionText.trim(),
            riskLevel: riskAnalysis.level,
            riskScore: riskAnalysis.score,
            isForced: true, // 강제 추가 플래그
          }

          const updatedConditions = { ...selectedConditions }
          updatedConditions[projectInfo.detailedType].custom.push(newCondition)
          setSelectedConditions(updatedConditions)

          setCustomConditionText("")
          setRiskAnalysis(null)
          setShowRiskAnalysis(false)
          showModal("강제 추가 완료", "위험도가 높은 조건이 강제로 추가되었습니다. 별도 확인이 필요합니다.", "warning")
        }
      )
      return
    }

    if (riskAnalysis.level === "medium") {
      showModal("주의 필요", "중간 위험도의 조건입니다. 담당자와 협의 후 추가하시기 바랍니다.", "warning")
    }

    const newCondition = {
      id: `custom-${Date.now()}`,
      text: customConditionText.trim(),
      riskLevel: riskAnalysis.level,
      riskScore: riskAnalysis.score,
    }

    const updatedConditions = { ...selectedConditions }
    updatedConditions[projectInfo.detailedType].custom.push(newCondition)
    setSelectedConditions(updatedConditions)

    setCustomConditionText("")
    setRiskAnalysis(null)
    setShowRiskAnalysis(false)
    showModal("추가 완료", "현장 특수사항이 목록에 성공적으로 추가되었습니다.", "success")
  }

  const handleReset = () => {
    setCustomConditionText("")
    setRiskAnalysis(null)
    setShowRiskAnalysis(false)
  }

  const handleSelectAll = (tab: string) => {
    const dataSource = tab === "basic" ? conditionData.basic : (conditionData as any)[projectInfo.detailedType]?.[tab] || []
    const updatedConditions = { ...selectedConditions }
    const currentProjectConditions = updatedConditions[projectInfo.detailedType]

    dataSource.forEach((condition: any) => {
      if (!currentProjectConditions[tab].some((c: any) => c.id === condition.id)) {
        currentProjectConditions[tab].push(condition)
      }
    })

    setSelectedConditions(updatedConditions)
  }

  const handleDeselectAll = (tab: string) => {
    const updatedConditions = { ...selectedConditions }
    updatedConditions[projectInfo.detailedType][tab] = []
    setSelectedConditions(updatedConditions)
  }

  const filteredConditions = useMemo(() => {
    const dataSource = conditionData.basic
    const selectedInTab = selectedConditions[projectInfo.detailedType]["basic"]

    return dataSource.filter((condition: any) => {
      const matchesSearch = condition.text.toLowerCase().includes(searchTerm.toLowerCase())
      const isSelected = selectedInTab.some((c: any) => c.id === condition.id)

      if (showOnlySelected) {
        return matchesSearch && isSelected
      }
      return matchesSearch
    })
  }, [searchTerm, showOnlySelected, selectedConditions, projectInfo.detailedType])

  const getSelectedCount = (tab: string) => {
    return selectedConditions[projectInfo.detailedType][tab]?.length || 0
  }

  const getTotalCount = (tab: string) => {
    if (tab === "custom") {
      return selectedConditions[projectInfo.detailedType].custom.length
    }
    const dataSource = tab === "basic" ? conditionData.basic : (conditionData as any)[projectInfo.detailedType]?.[tab] || []
    return dataSource.length
  }

  const renderConditions = () => {
    if (filteredConditions.length === 0) {
      if (searchTerm) {
        return <p className="text-gray-500 text-center py-8">검색 결과가 없습니다.</p>
      }
      return <p className="text-gray-500 text-center py-8">현장기본조건이 없습니다.</p>
    }

    return filteredConditions.map((condition: any) => {
      const isChecked = selectedConditions[projectInfo.detailedType]["basic"].some((c: any) => c.id === condition.id)

      return (
        <Card
          key={condition.id}
          className={`p-3 transition-all hover:shadow-sm ${isChecked ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleConditionChange(condition.id, checked as boolean, "basic")
              }
              className="mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed text-pretty">{condition.text}</p>
              {isChecked && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  선택됨
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* 현장기본조건 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">현장기본조건</h3>
        <Badge variant="outline" className="text-xs">
          {getSelectedCount("basic")}/{getTotalCount("basic")}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="조건 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={showOnlySelected ? "bg-blue-50 border-blue-200" : ""}
          >
            <Filter className="h-4 w-4 mr-1" />
            선택된 항목만
          </Button>
        </div>

        {getTotalCount("basic") > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleSelectAll("basic")} className="h-8 px-2">
                <CheckSquare className="h-4 w-4 mr-1" />
                전체 선택
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeselectAll("basic")} className="h-8 px-2">
                <Square className="h-4 w-4 mr-1" />
                전체 해제
              </Button>
            </div>
            <div className="text-gray-500">{getSelectedCount("basic")}개 선택됨</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
        <span>
          현재 공종: <strong>{workTypeNames[projectInfo.detailedType as keyof typeof workTypeNames]}</strong>
        </span>
        <span>모든 공종에 공통으로 적용되는 기본 조건</span>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">{renderConditions()}</div>
      
      {/* 5. 현장 기본조건 - 현장 특수사항 추가 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-semibold">5. 현장 특수조건</h3>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>
        </div>
        <div className="space-y-3">
          <Textarea
            placeholder="추가할 조건을 입력하세요..."
            rows={3}
            value={customConditionText}
            onChange={(e) => setCustomConditionText(e.target.value)}
          />
          <Button
            onClick={handleReviewRisk}
            disabled={isAnalyzing || !customConditionText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                분석 중...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                위험도 분석
              </>
            )}
          </Button>
          <RiskAssessmentPanel analysis={riskAnalysis!} isVisible={showRiskAnalysis && !!riskAnalysis} />
          <Button
            onClick={handleAddCustomCondition}
            className="w-full"
          >
            목록에 추가
          </Button>
        </div>
      </div>
    </div>
  )
}
