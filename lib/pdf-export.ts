// PDF 내보내기를 위한 간단한 인터페이스
export interface PDFExportOptions {
  format: "a4" | "letter"
  orientation: "portrait" | "landscape"
  margin: number
  includeHeader: boolean
  includeFooter: boolean
  includeWatermark: boolean
  quality: number
  template: "standard" | "compact" | "detailed"
}

export const defaultPDFOptions: PDFExportOptions = {
  format: "a4",
  orientation: "portrait",
  margin: 1,
  includeHeader: true,
  includeFooter: true,
  includeWatermark: false,
  quality: 0.98,
  template: "standard",
}

export interface ExportData {
  projectInfo: {
    name: string
    location: string
    client: string
    summary: string
    projectType: string
    detailedType: string
  }
  selectedConditions: any // ContractClause[] 또는 기존 구조
  exportOptions: PDFExportOptions
  timestamp: string
}

export function validateExportData(data: ExportData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Only check for essential fields, allow empty conditions
  if (!data.projectInfo.name.trim()) {
    errors.push("현장명을 입력해주세요.")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function generateFileName(projectInfo: any, template: string): string {
  const date = new Date().toISOString().split("T")[0]
  const projectName = projectInfo.name.trim() || "견적조건서"
  const templateSuffix = template !== "standard" ? `_${template}` : ""

  return `${projectName}_견적조건서${templateSuffix}_${date}.pdf`
}

// 브라우저 기본 인쇄 기능을 활용한 안정적인 PDF 내보내기
export async function exportToPDF(
  elementId: string,
  exportData: ExportData,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error("문서 요소를 찾을 수 없습니다.")
  }

  try {
    onProgress?.(10)

    // 원본 요소의 스타일 저장
    const originalStyle = element.style.cssText
    const originalClasses = element.className

    try {
      // PDF용 최소한의 스타일만 적용 (레이아웃 보존)
      element.style.backgroundColor = "white"
      element.style.color = "black"
      element.style.fontFamily = "Arial, sans-serif"
      element.style.fontSize = "12px"
      element.style.lineHeight = "1.4"
      element.style.padding = "20px"
      element.style.margin = "0"
      element.style.width = "100%"
      element.style.maxWidth = "none"
      element.style.minHeight = "297mm" // A4 높이
      element.style.boxSizing = "border-box"

      // 모든 하위 요소의 스타일을 최소한으로만 수정
      const allElements = element.querySelectorAll('*')
      allElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement
        
        // 레이아웃 관련 스타일은 그대로 유지하고 색상만 조정
        if (htmlEl.classList.contains('bg-yellow-100')) {
          htmlEl.style.backgroundColor = '#fef3c7'
        }
        if (htmlEl.classList.contains('border-yellow-400')) {
          htmlEl.style.borderColor = '#f59e0b'
          htmlEl.style.borderWidth = '2px'
          htmlEl.style.borderStyle = 'solid'
        }
        if (htmlEl.classList.contains('text-red-600')) {
          htmlEl.style.color = '#dc2626'
        }
        
        // 이미지 요소만 최적화
        if (htmlEl.tagName === 'IMG') {
          htmlEl.style.maxWidth = '100%'
          htmlEl.style.height = 'auto'
          htmlEl.style.pageBreakInside = 'avoid'
        }
        
        // 입력 필드 스타일 제거 (PDF에서는 일반 텍스트로 표시)
        if (htmlEl.tagName === 'INPUT') {
          htmlEl.style.backgroundColor = 'transparent'
          htmlEl.style.border = 'none'
          htmlEl.style.padding = '0'
          htmlEl.style.margin = '0'
          htmlEl.style.outline = 'none'
          htmlEl.style.boxShadow = 'none'
        }
        
        // 폰트만 통일
        htmlEl.style.fontFamily = 'Arial, sans-serif'
      })

      onProgress?.(50)

      // 새로운 창에서 PDF용 페이지 생성
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        throw new Error("팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.")
      }

      // PDF용 HTML 생성 - 원본 스타일을 최대한 보존
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${generateFileName(exportData.projectInfo, exportData.exportOptions.template)}</title>
          <style>
            @page {
              size: ${exportData.exportOptions.format} ${exportData.exportOptions.orientation};
              margin: ${exportData.exportOptions.margin}in;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: black;
              background: white;
              margin: 0;
              padding: 0;
            }
            .pdf-content {
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 0;
            }
            
            /* Tailwind CSS 클래스들을 PDF용으로 변환 */
            .flex { display: flex !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .flex-shrink-0 { flex-shrink: 0 !important; }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .gap-8 { gap: 2rem !important; }
            .gap-3 { gap: 0.75rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .items-center { align-items: center !important; }
            .items-start { align-items: flex-start !important; }
            .justify-center { justify-content: center !important; }
            .space-y-3 > * + * { margin-top: 0.75rem !important; }
            .space-y-2 > * + * { margin-top: 0.5rem !important; }
            .space-y-6 > * + * { margin-top: 1.5rem !important; }
            .mb-8 { margin-bottom: 2rem !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .mb-3 { margin-bottom: 0.75rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mt-3 { margin-top: 0.75rem !important; }
            .mt-2 { margin-top: 0.5rem !important; }
            .mt-10 { margin-top: 2.5rem !important; }
            .ml-8 { margin-left: 2rem !important; }
            .ml-6 { margin-left: 1.5rem !important; }
            .ml-4 { margin-left: 1rem !important; }
            .pl-6 { padding-left: 1.5rem !important; }
            .p-4 { padding: 1rem !important; }
            .p-6 { padding: 1.5rem !important; }
            .pt-6 { padding-top: 1.5rem !important; }
            .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
            .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
            .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
            .w-16 { width: 4rem !important; }
            .w-20 { width: 5rem !important; }
            .w-50 { width: 12.5rem !important; }
            .w-12 { width: 3rem !important; }
            .w-24 { width: 6rem !important; }
            .h-5 { height: 1.25rem !important; }
            .h-7 { height: 1.75rem !important; }
            .h-20 { height: 5rem !important; }
            .min-w-0 { min-width: 0px !important; }
            .max-w-4xl { max-width: 56rem !important; }
            .mx-auto { margin-left: auto !important; margin-right: auto !important; }
            .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
            .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
            .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
            .font-bold { font-weight: 700 !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-medium { font-weight: 500 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-gray-400 { color: #9ca3af !important; }
            .text-red-600 { color: #dc2626 !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .text-pretty { text-wrap: pretty !important; }
            .border { border-width: 1px !important; }
            .border-t { border-top-width: 1px !important; }
            .border-b { border-bottom-width: 1px !important; }
            .border-r { border-right-width: 1px !important; }
            .border-l-4 { border-left-width: 4px !important; }
            .border-gray-300 { border-color: #d1d5db !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .border-yellow-400 { border-color: #f59e0b !important; }
            .border-blue-400 { border-color: #60a5fa !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-yellow-100 { background-color: #fef3c7 !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .rounded { border-radius: 0.25rem !important; }
            .rounded-md { border-radius: 0.375rem !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            .overflow-hidden { overflow: hidden !important; }
            .overflow-y-auto { overflow-y: auto !important; }
            .h-full { height: 100% !important; }
            .underline { text-decoration: underline !important; }
            .flex-wrap { flex-wrap: wrap !important; }
            .relative { position: relative !important; }
            .object-contain { object-fit: contain !important; }
            .hover\\:border-blue-400:hover { border-color: #60a5fa !important; }
            .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke !important; }
            .cursor-pointer { cursor: pointer !important; }
            
            /* 테이블 스타일 */
            table, .grid {
              border-collapse: collapse !important;
            }
            .border-gray-300 {
              border-color: #d1d5db !important;
              border-width: 1px !important;
              border-style: solid !important;
            }
            .border-b {
              border-bottom: 1px solid #d1d5db !important;
            }
            .border-r {
              border-right: 1px solid #d1d5db !important;
            }
            
            /* 입력 필드 스타일 제거 (PDF에서는 일반 텍스트로 표시) */
            input[type="number"], input[type="text"] {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              font-family: inherit !important;
              font-size: inherit !important;
              color: inherit !important;
              outline: none !important;
              box-shadow: none !important;
            }
            
            /* 헤더 필드들의 테두리 제거 */
            .border-b {
              border-bottom: none !important;
            }
            
            /* 발주물량 공지 값 우측정렬 */
            .text-right {
              text-align: right !important;
            }
            
            /* 이미지 스타일 */
            img {
              max-width: 100% !important;
              height: auto !important;
              page-break-inside: avoid !important;
              display: block !important;
            }
            
            /* 인쇄용 스타일 */
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .bg-yellow-100 { background-color: #fef3c7 !important; }
              .border-yellow-400 { border-color: #f59e0b !important; }
              .text-red-600 { color: #dc2626 !important; }
              .bg-blue-50 { background-color: #eff6ff !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .border-gray-300 { border-color: #d1d5db !important; }
              .border-b { border-bottom: none !important; }
              .border-r { border-right: 1px solid #d1d5db !important; }
              .text-right { text-align: right !important; }
              img { 
                max-width: 100% !important; 
                height: auto !important; 
                page-break-inside: avoid !important;
              }
              input[type="number"], input[type="text"] {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                font-family: inherit !important;
                font-size: inherit !important;
                color: inherit !important;
                outline: none !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="pdf-content">
            ${element.innerHTML}
          </div>
          <script>
            // 페이지 로드 후 자동으로 인쇄 대화상자 열기
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // 인쇄 후 창 닫기 (사용자가 취소해도 3초 후 닫힘)
                setTimeout(function() {
                  window.close();
                }, 3000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `

      printWindow.document.write(pdfHTML)
      printWindow.document.close()

      onProgress?.(90)

      // 내보내기 기록 저장
      try {
        const history = JSON.parse(localStorage.getItem("pdf-export-history") || "[]")
        history.unshift({
          ...exportData,
          exportedAt: new Date().toISOString(),
        })
        if (history.length > 20) {
          history.splice(20)
        }
        localStorage.setItem("pdf-export-history", JSON.stringify(history))
      } catch (storageError) {
        console.warn("Failed to save export history:", storageError)
      }

      onProgress?.(100)

    } finally {
      // 원래 스타일 복원
      element.style.cssText = originalStyle
      element.className = originalClasses
    }

  } catch (error) {
    console.error("PDF export error:", error)
    throw new Error(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

export function getExportHistory(): ExportData[] {
  try {
    return JSON.parse(localStorage.getItem("pdf-export-history") || "[]")
  } catch {
    return []
  }
}

export function clearExportHistory(): void {
  localStorage.removeItem("pdf-export-history")
}