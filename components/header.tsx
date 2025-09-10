"use client"

import { Button } from "@/components/ui/button"
import { FileDown, Save } from "lucide-react"

interface HeaderProps {
  onExportPdf: () => void
  onTempSave: () => void
}

export function Header({ onExportPdf, onTempSave }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-blue-600 text-balance">견적 조건 Master(by CheckMate)</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onTempSave}>
          <Save className="h-4 w-4 mr-2" />
          임시저장
        </Button>
        <Button onClick={onExportPdf} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <FileDown className="h-4 w-4 mr-2" />
          PDF로 내보내기
        </Button>
      </div>
    </header>
  )
}
