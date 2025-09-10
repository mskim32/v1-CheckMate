'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Upload, X, Star, RefreshCw, Search, Shield, RotateCcw, Trash2, Plus, CheckSquare, Square } from 'lucide-react'
import { ContractClause, ContractConditionSelectorProps, UploadedImage } from '@/lib/types'
import { parseCSVData, getUniqueCategories, getUniqueSubCategories, getUniqueTags, getFilteredClauses, getWorkTypes } from '@/lib/parser'
import { getImagePath, formatFileSize, generateId, createImagePreview, validateImageFile } from '@/lib/contract-utils'
import { Textarea } from '@/components/ui/textarea'
import { RiskAssessmentPanel } from '@/components/risk-assessment-panel'

// RiskAnalysis 타입 정의
interface RiskAnalysis {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  category: string
  issues: string[]
  suggestions: string[]
  blockedKeywords: string[]
}

export function ContractConditionSelector({ onConditionsChange, showModal, onWorkTypeChange }: ContractConditionSelectorProps) {
  const [clauses, setClauses] = useState<ContractClause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [selectedWorkType, setSelectedWorkType] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  
  // 검색 상태
  const [workTypeSearchTerm, setWorkTypeSearchTerm] = useState<string>('')
  const [showWorkTypeDropdown, setShowWorkTypeDropdown] = useState<boolean>(false)

  // 선택된 조건들
  const [selectedConditions, setSelectedConditions] = useState<ContractClause[]>([])

  // 이미지 업로드 상태
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: UploadedImage[] }>({})

  // 위험도 분석 상태
  const [customConditionText, setCustomConditionText] = useState<string>('')
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [showRiskAnalysis, setShowRiskAnalysis] = useState<boolean>(false)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  // 위험도 분석 함수들
  const handleReviewRisk = async () => {
    if (!customConditionText.trim()) {
      if (showModal) {
        showModal("입력 오류", "분석할 내용을 먼저 입력해 주세요.", "error")
      }
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
      if (showModal) {
        showModal("API 오류", e?.message || "미소 API 호출 중 오류가 발생했습니다.", "error")
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddCustomCondition = () => {
    if (!customConditionText.trim()) {
      if (showModal) {
        showModal("입력 오류", "추가할 내용을 먼저 입력해 주세요.", "error")
      } else {
        alert("추가할 내용을 먼저 입력해 주세요.")
      }
      return
    }

    if (!riskAnalysis) {
      if (showModal) {
        showModal("경고", "위험도 분석을 먼저 진행해 주세요. 위험도 분석 없이는 조건을 추가할 수 없습니다.", "warning")
      } else {
        alert("위험도 분석을 먼저 진행해 주세요. 위험도 분석 없이는 조건을 추가할 수 없습니다.")
      }
      return
    }

    if (riskAnalysis.level === "critical" || riskAnalysis.level === "high") {
      if (showModal) {
        showModal(
          "위험도 높음",
          `위험도가 ${riskAnalysis.level === "critical" ? "매우 높은" : "높은"} 조건입니다. 강제로 추가하시겠습니까?`,
          "warning",
          () => {
            // 강제 추가 로직
            const newCondition: ContractClause = {
              공종명: selectedWorkType || '사용자 정의',
              공종코드: 'CUSTOM',
              대분류: selectedCategory || '기타',
              공종상세: customConditionText,
              중분류: selectedSubCategory || '기타',
              태그: selectedTag || '사용자정의',
              내용: customConditionText,
              중요표기: '중요',
              이미지: '',
              isForced: true // 강제 추가 플래그
            }

            // 선택된 조건에 추가
            const updatedConditions = [...selectedConditions, newCondition]
            setSelectedConditions(updatedConditions)
            onConditionsChange(updatedConditions)

            // 초기화
            setCustomConditionText('')
            setRiskAnalysis(null)
            setShowRiskAnalysis(false)
            
            if (showModal) {
              showModal("강제 추가 완료", "위험도가 높은 조건이 강제로 추가되었습니다. 별도 확인이 필요합니다.", "warning")
            }
          }
        )
      }
      return
    }

    if (riskAnalysis.level === "medium") {
      if (showModal) {
        showModal("주의 필요", "중간 위험도의 조건입니다. 담당자와 협의 후 추가하시기 바랍니다.", "warning")
      }
    }

    // 일반 추가 로직
    const newCondition: ContractClause = {
      공종명: selectedWorkType || '사용자 정의',
      공종코드: 'CUSTOM',
      대분류: selectedCategory || '기타',
      공종상세: customConditionText,
      중분류: selectedSubCategory || '기타',
      태그: selectedTag || '사용자정의',
      내용: customConditionText,
      중요표기: '일반',
      이미지: ''
    }

    // 선택된 조건에 추가
    const updatedConditions = [...selectedConditions, newCondition]
    setSelectedConditions(updatedConditions)
    onConditionsChange(updatedConditions)

    // 초기화
    setCustomConditionText('')
    setRiskAnalysis(null)
    setShowRiskAnalysis(false)
  }

  const handleReset = () => {
    setCustomConditionText('')
    setRiskAnalysis(null)
    setShowRiskAnalysis(false)
  }

  // CSV 데이터 로드 및 초기화
  const loadCSVData = async () => {
    try {
      setLoading(true)
      setError(null)
     
      const response = await fetch('/api/contract-condition-system/csv-data')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
     
      const csvText = await response.text()
      console.log('CSV 텍스트 길이:', csvText.length)
      console.log('CSV 첫 500자:', csvText.substring(0, 500))
      
      const parsedData = parseCSVData(csvText)
      console.log('파싱된 데이터 개수:', parsedData.length)
      console.log('첫 번째 데이터:', parsedData[0])
      
      setClauses(parsedData)
     
      // 첫 번째 공종으로 초기화
      const workTypes = getWorkTypes(parsedData)
      console.log('사용 가능한 공종들:', workTypes)
      if (workTypes.length > 0) {
        setSelectedWorkType(workTypes[0])
      }
    } catch (err) {
      console.error('CSV 데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 데이터 새로고침 및 초기화
  const handleRefreshData = async () => {
    console.log('ContractConditionSelector - 데이터 새로고침 시작')
    
    // 선택된 조건들 초기화
    setSelectedConditions([])
    console.log('ContractConditionSelector - 선택된 조건들 초기화됨')
    
    // 필터 상태 초기화
    setSelectedWorkType('')
    setSelectedCategory('')
    setSelectedSubCategory('')
    setSelectedTag('')
    setWorkTypeSearchTerm('')
    setShowWorkTypeDropdown(false)
    
    // 이미지 업로드 상태 초기화
    setUploadingImages({})
    
    // 상위 컴포넌트에 공종 초기화 알림
    if (onWorkTypeChange) {
      onWorkTypeChange('')
    }
    
    // CSV 데이터 다시 로드
    await loadCSVData()
    
    console.log('ContractConditionSelector - 데이터 새로고침 완료')
  }

  useEffect(() => {
    loadCSVData()
  }, [])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.work-type-dropdown')) {
        setShowWorkTypeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 필터 옵션들
  const workTypes = getWorkTypes(clauses)
  const filteredWorkTypes = workTypes.filter(workType => 
    workType.toLowerCase().includes(workTypeSearchTerm.toLowerCase())
  )
  const categories = getUniqueCategories(clauses, selectedWorkType)
  const subCategories = getUniqueSubCategories(clauses, selectedWorkType, selectedCategory)
  const tags = getUniqueTags(clauses, selectedWorkType, selectedCategory, selectedSubCategory)
  const filteredClauses = getFilteredClauses(clauses, selectedWorkType, selectedCategory, selectedSubCategory, selectedTag)

  // 조건 선택/해제
  const toggleCondition = (clause: ContractClause) => {
    const isSelected = selectedConditions.some(c => c.공종코드 === clause.공종코드 && c.내용 === clause.내용)
   
    console.log('ContractConditionSelector - 조건 토글:', {
      내용: clause.내용,
      대분류: clause.대분류,
      중분류: clause.중분류,
      태그: clause.태그,
      isSelected
    })
   
    if (isSelected) {
      const newConditions = selectedConditions.filter(c => !(c.공종코드 === clause.공종코드 && c.내용 === clause.내용))
      setSelectedConditions(newConditions)
    } else {
      const newConditions = [...selectedConditions, clause]
      setSelectedConditions(newConditions)
    }
  }

  // 개별 조건 삭제
  const removeCondition = (conditionToRemove: ContractClause) => {
    const newConditions = selectedConditions.filter(c => !(c.공종코드 === conditionToRemove.공종코드 && c.내용 === conditionToRemove.내용))
    setSelectedConditions(newConditions)
  }

  // 전체 조건 삭제
  const clearAllConditions = () => {
    if (showModal) {
      showModal(
        "전체 삭제 확인",
        "선택된 모든 계약조건을 삭제하시겠습니까?",
        "warning",
        () => {
          setSelectedConditions([])
          showModal("삭제 완료", "모든 계약조건이 삭제되었습니다.", "success")
        }
      )
    } else {
      setSelectedConditions([])
    }
  }

  // 전체 선택/해제
  const toggleAllConditions = () => {
    if (selectedConditions.length === filteredClauses.length) {
      // 모두 선택된 상태면 모두 해제
      setSelectedConditions([])
    } else {
      // 일부만 선택된 상태면 모두 선택
      setSelectedConditions([...filteredClauses])
    }
  }

  // 이미지 업로드
  const handleImageUpload = async (clause: ContractClause, files: FileList) => {
    const clauseKey = `${clause.공종코드}-${clause.내용}`
    const newImages: UploadedImage[] = []
   
    for (const file of Array.from(files)) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        continue
      }

      try {
        const preview = await createImagePreview(file)
        const id = generateId()
        newImages.push({ id, file, preview })
      } catch (error) {
        console.error('이미지 미리보기 생성 실패:', error)
      }
    }
   
    setUploadingImages(prev => ({
      ...prev,
      [clauseKey]: [...(prev[clauseKey] || []), ...newImages]
    }))
  }

  // 이미지 삭제
  const removeImage = (clause: ContractClause, imageId: string) => {
    const clauseKey = `${clause.공종코드}-${clause.내용}`
    setUploadingImages(prev => ({
      ...prev,
      [clauseKey]: (prev[clauseKey] || []).filter(img => img.id !== imageId)
    }))
  }

  // 선택된 조건 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    const conditionsWithImages = selectedConditions.map(condition => {
      const clauseKey = `${condition.공종코드}-${condition.내용}`
      const uploadedImages = uploadingImages[clauseKey] || []
      return {
        ...condition,
        uploadedImages
      }
    })
    console.log('ContractConditionSelector - 선택된 조건들:', conditionsWithImages)
    console.log('ContractConditionSelector - 카테고리별 분류:', {
      공사사항: conditionsWithImages.filter(c => c.대분류 === '공사사항'),
      안전사항: conditionsWithImages.filter(c => c.대분류 === '안전사항'),
      품질사항: conditionsWithImages.filter(c => c.대분류 === '품질사항'),
      기타: conditionsWithImages.filter(c => !['공사사항', '안전사항', '품질사항'].includes(c.대분류))
    })
    onConditionsChange(conditionsWithImages)
  }, [selectedConditions, uploadingImages])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>데이터를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button onClick={loadCSVData} className="ml-2" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            다시 시도
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleRefreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          데이터 새로고침
        </Button>
      </div>

      {/* 필터링 UI */}
      <Card>
        <CardHeader>
          <CardTitle>계약조건 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 공종 선택 - 검색 가능한 드롭다운 */}
          <div>
            <label className="text-sm font-medium mb-2 block">공종</label>
            <div className="relative work-type-dropdown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="공종을 검색하거나 선택하세요..."
                  value={workTypeSearchTerm}
                  onChange={(e) => {
                    setWorkTypeSearchTerm(e.target.value)
                    setShowWorkTypeDropdown(true)
                  }}
                  onFocus={() => setShowWorkTypeDropdown(true)}
                  className="pl-10"
                />
              </div>
              
              {showWorkTypeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredWorkTypes.length > 0 ? (
                    filteredWorkTypes.map(workType => (
                      <div
                        key={workType}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setSelectedWorkType(workType)
                          setWorkTypeSearchTerm(workType)
                          setShowWorkTypeDropdown(false)
                          
                          // 상위 컴포넌트에 공종 변경 알림
                          if (onWorkTypeChange) {
                            onWorkTypeChange(workType)
                          }
                        }}
                      >
                        {workType}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 선택된 공종 표시 */}
            {selectedWorkType && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-sm">
                  선택됨: {selectedWorkType}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWorkType('')
                    setWorkTypeSearchTerm('')
                    setSelectedCategory('')
                    setSelectedSubCategory('')
                    setSelectedTag('')
                    
                    // 상위 컴포넌트에 공종 초기화 알림
                    if (onWorkTypeChange) {
                      onWorkTypeChange('')
                    }
                  }}
                  className="ml-2 text-xs"
                >
                  초기화
                </Button>
              </div>
            )}
          </div>

          {/* 대분류 선택 */}
          {selectedWorkType && (
            <div>
              <label className="text-sm font-medium mb-2 block">대분류</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="대분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 중분류 태그 방식 */}
          {selectedCategory && (
            <div>
              <label className="text-sm font-medium mb-2 block">중분류</label>
              <div className="flex flex-wrap gap-2">
                {subCategories.map(subCategory => (
                  <Button
                    key={subCategory}
                    variant={selectedSubCategory === subCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      console.log('ContractConditionSelector - 중분류 선택:', subCategory)
                      setSelectedSubCategory(subCategory)
                    }}
                    className="text-sm"
                  >
                    {subCategory}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 태그 첨부 방식 */}
          {selectedSubCategory && (
            <div>
              <label className="text-sm font-medium mb-2 block">태그</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                    className="text-sm"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 조건 목록 */}
      {selectedTag && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>계약조건 목록</CardTitle>
              {filteredClauses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllConditions}
                    className="text-xs"
                  >
                    {selectedConditions.length === filteredClauses.length ? (
                      <>
                        <CheckSquare className="h-3 w-3 mr-1" />
                        전체 해제
                      </>
                    ) : (
                      <>
                        <Square className="h-3 w-3 mr-1" />
                        전체 선택
                      </>
                    )}
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {selectedConditions.length}/{filteredClauses.length}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredClauses.map((clause, index) => {
                  const isSelected = selectedConditions.some(c => c.공종코드 === clause.공종코드 && c.내용 === clause.내용)
                  const clauseKey = `${clause.공종코드}-${clause.내용}`
                  const images = uploadingImages[clauseKey] || []
                 
                  return (
                    <div key={index} className={`border rounded-lg p-4 space-y-3 transition-all duration-200 ${
                      isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCondition(clause)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {clause.중요표기 === '중요' && (
                              <Star className="h-4 w-4 text-red-500 fill-current" />
                            )}
                            <span className="font-medium">{clause.내용}</span>
                            {clause.중요표기 === '중요' && (
                              <Badge variant="destructive" className="text-xs">중요</Badge>
                            )}
                            {isSelected && (
                              <Badge variant="default" className="text-xs bg-blue-600">선택됨</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {clause.대분류}
                            </Badge>
                            {clause.중분류 && (
                              <Badge variant="outline" className="text-xs">
                                {clause.중분류}
                              </Badge>
                            )}
                            {clause.태그 && (
                              <Badge variant="outline" className="text-xs">
                                {clause.태그}
                              </Badge>
                            )}
                          </div>
                         
                          {/* 이미지 업로드 */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => e.target.files && handleImageUpload(clause, e.target.files)}
                                className="hidden"
                                id={`image-upload-${index}`}
                              />
                              <label htmlFor={`image-upload-${index}`}>
                                <Button variant="outline" size="sm" asChild>
                                  <span>
                                    <Upload className="h-4 w-4 mr-1" />
                                    이미지 업로드
                                  </span>
                                </Button>
                              </label>
                              {images.length > 0 && (
                                <Badge variant="secondary">{images.length}개</Badge>
                              )}
                            </div>
                           
                            {/* 업로드된 이미지 미리보기 */}
                            {images.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {images.map(image => (
                                  <div key={image.id} className="relative">
                                    <img
                                      src={image.preview}
                                      alt="업로드된 이미지"
                                      className="w-16 h-16 object-cover rounded border"
                                    />
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                      onClick={() => removeImage(clause, image.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 위험도 분석 섹션 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>현장 특수조건 추가</span>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              초기화
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* 선택된 조건 요약 */}
      {selectedConditions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>선택된 계약조건 ({selectedConditions.length}개)</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllConditions}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  전체 삭제
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 overflow-y-auto">
              <div className="space-y-2">
                {selectedConditions.map((condition, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {condition.중요표기 === '중요' && (
                          <Star className="h-4 w-4 text-red-500 fill-current" />
                        )}
                        <span className="text-sm font-medium">{condition.내용}</span>
                        {condition.중요표기 === '중요' && (
                          <Badge variant="destructive" className="text-xs">중요</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {condition.대분류}
                        </Badge>
                        {condition.중분류 && (
                          <Badge variant="outline" className="text-xs">
                            {condition.중분류}
                          </Badge>
                        )}
                        {condition.태그 && (
                          <Badge variant="outline" className="text-xs">
                            {condition.태그}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}