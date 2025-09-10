"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/header"
import { ControlPanel } from "@/components/control-panel"
import { PreviewPanel } from "@/components/preview-panel"
import { Modal } from "@/components/modal"
import { PDFExportDialog } from "@/components/pdf-export-dialog"
import { ContractClause } from "@/lib/types"

interface ProjectInfo {
  name: string
  location: string
  client: string
  summary: string
  projectType: string
  detailedType: string
  exemptionRate?: number
  orderVolumeRate?: number
  contactRole?: string
  contactName?: string
  contactPhoneRest?: string
  contactEmailLocal?: string
  docsUrl?: string
  docsPassword?: string
}

interface Condition {
  id: string
  text: string
  isForced?: boolean
}

interface SelectedConditions {
  [key: string]: {
    basic: Condition[]
    construction: Condition[]
    safety: Condition[]
    quality: Condition[]
    custom: Condition[]
  }
}

export default function QuoteGeneratorPage() {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: "",
    location: "",
    client: "",
    summary: "",
    projectType: "건축공사",
    detailedType: "tile_work",
    exemptionRate: 100,
    orderVolumeRate: 100,
    contactRole: "공무",
    contactName: "000",
    contactPhoneRest: "5252-5252",
    contactEmailLocal: "5252",
  })

  // MISO 워크플로우 결과 텍스트 저장
  const [misoResult, setMisoResult] = useState<string>("")

  // 계약조건 상태
  const [contractConditions, setContractConditions] = useState<ContractClause[]>([])
  
  // 선택된 공종 상태
  const [selectedWorkType, setSelectedWorkType] = useState<string>('')

  const [selectedConditions, setSelectedConditions] = useState<SelectedConditions>({
    tile_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    framing_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    finishing_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    painting_work: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
    interior_woodwork: {
      basic: [],
      construction: [],
      safety: [],
      quality: [],
      custom: [],
    },
  })

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success" as "success" | "warning" | "error",
    onConfirm: undefined as (() => void) | undefined,
    onDelete: undefined as (() => void) | undefined,
    showDelete: false,
  })

  const [showPDFDialog, setShowPDFDialog] = useState(false)

  const showModal = useCallback((title: string, message: string, type: "success" | "warning" | "error", onConfirm?: () => void, onDelete?: () => void, showDelete?: boolean) => {
    setModalState({ isOpen: true, title, message, type, onConfirm, onDelete, showDelete: showDelete || false })
  }, [])

  const hideModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  // 계약조건 변경 핸들러
  const handleContractConditionsChange = useCallback((conditions: ContractClause[]) => {
    console.log('Page - handleContractConditionsChange 호출됨:', conditions)
    setContractConditions(conditions)
  }, [])

  const handleExportPdf = useCallback(() => {
    setShowPDFDialog(true)
  }, [])

  const handlePDFExportSuccess = useCallback(
    (message: string) => {
      showModal("내보내기 완료", message, "success")
      setShowPDFDialog(false)
    },
    [showModal],
  )

  const handlePDFExportError = useCallback(
    (message: string) => {
      showModal("내보내기 오류", message, "error")
    },
    [showModal],
  )

  const handleTempSave = useCallback(() => {
    const saveData = {
      projectInfo,
      selectedConditions,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("quote-generator-temp-save", JSON.stringify(saveData))
    showModal("저장 완료", "현재 작업 내용이 임시 저장되었습니다.", "success")
  }, [projectInfo, selectedConditions, showModal])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onExportPdf={handleExportPdf} onTempSave={handleTempSave} />

      <main className="flex-grow flex overflow-hidden">
        <ControlPanel
          projectInfo={projectInfo}
          setProjectInfo={setProjectInfo}
          selectedConditions={selectedConditions}
          setSelectedConditions={setSelectedConditions}
          showModal={showModal}
          onMisoResult={(text) => setMisoResult(text)}
          contractConditions={contractConditions}
          setContractConditions={handleContractConditionsChange}
          onWorkTypeChange={setSelectedWorkType}
        />

        <PreviewPanel 
          projectInfo={projectInfo} 
          selectedConditions={selectedConditions} 
          setProjectInfo={setProjectInfo} 
          misoResult={misoResult}
          contractConditions={contractConditions}
          selectedWorkType={selectedWorkType}
        />
      </main>

      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        onDelete={modalState.onDelete}
        showDelete={modalState.showDelete}
      />

      <PDFExportDialog
        isOpen={showPDFDialog}
        onClose={() => setShowPDFDialog(false)}
        projectInfo={projectInfo}
        selectedConditions={contractConditions}
        selectedWorkType={selectedWorkType}
        onSuccess={handlePDFExportSuccess}
        onError={handlePDFExportError}
      />
    </div>
  )
}
