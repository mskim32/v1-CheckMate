export interface UploadedImage {
  id: string
  file: File
  preview: string
  description?: string
}

export interface ContractClause {
  공종명: string
  공종코드: string
  대분류: string
  공종상세: string
  중분류: string
  태그: string
  내용: string
  중요표기: string
  이미지: string
  uploadedImages?: UploadedImage[]
}

export interface ContractConditionSelectorProps {
  onConditionsChange: (conditions: ContractClause[]) => void
}

export interface ParsedCSVResult {
  data: ContractClause[]
  errors: string[]
  warnings: string[]
}
