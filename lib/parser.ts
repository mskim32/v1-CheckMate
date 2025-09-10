import { ContractClause, ParsedCSVResult } from './types'

export function parseCSVData(csvText: string): ContractClause[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map((line, index) => {
    // CSV 파싱을 개선하여 따옴표 처리
    const values = parseCSVLine(line)
    
    return {
      공종명: values[0] || '',
      공종코드: values[1] || '',
      대분류: values[2] || '',
      공종상세: values[3] || '', // 중분류를 공종상세로 매핑
      중분류: values[3] || '', // 실제 CSV에서는 중분류가 4번째 필드
      태그: values[4] || '',
      내용: values[5] || '',
      중요표기: values[6] || '',
      이미지: '', // 이미지 필드는 CSV에 없으므로 빈 문자열
      uploadedImages: []
    }
  })
}

// CSV 라인을 올바르게 파싱하는 함수
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 이스케이프된 따옴표
        current += '"'
        i++ // 다음 따옴표 건너뛰기
      } else {
        // 따옴표 시작/끝
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // 쉼표로 필드 구분
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // 마지막 필드 추가
  result.push(current.trim())
  
  return result
}

export function parseCSVDataWithValidation(csvText: string): ParsedCSVResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      errors.push('CSV 파일이 비어있습니다.')
      return { data: [], errors, warnings }
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const expectedHeaders = ['공종명', '공종코드', '대분류', '중분류', '태그', '내용', '중요표기']
    
    if (headers.length !== expectedHeaders.length) {
      warnings.push(`헤더 개수가 예상과 다릅니다. 예상: ${expectedHeaders.length}, 실제: ${headers.length}`)
    }

    const data: ContractClause[] = []
    
    lines.slice(1).forEach((line, index) => {
      const values = parseCSVLine(line)
      
      if (values.length < 6) {
        errors.push(`라인 ${index + 2}: 필수 필드가 누락되었습니다.`)
        return
      }
      
      data.push({
        공종명: values[0] || '',
        공종코드: values[1] || '',
        대분류: values[2] || '',
        공종상세: values[3] || '',
        중분류: values[3] || '',
        태그: values[4] || '',
        내용: values[5] || '',
        중요표기: values[6] || '',
        이미지: '',
        uploadedImages: []
      })
    })

    return { data, errors, warnings }
  } catch (error) {
    errors.push(`CSV 파싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    return { data: [], errors, warnings }
  }
}

export function getUniqueCategories(clauses: ContractClause[], workType: string): string[] {
  return [...new Set(clauses
    .filter(clause => clause.공종명 === workType)
    .map(clause => clause.대분류)
    .filter(Boolean)
  )].sort()
}

export function getUniqueSubCategories(clauses: ContractClause[], workType: string, category: string): string[] {
  return [...new Set(clauses
    .filter(clause => clause.공종명 === workType && clause.대분류 === category)
    .map(clause => clause.중분류)
    .filter(Boolean)
  )].sort()
}

export function getUniqueTags(clauses: ContractClause[], workType: string, category: string, subCategory: string): string[] {
  return [...new Set(clauses
    .filter(clause =>
      clause.공종명 === workType &&
      clause.대분류 === category &&
      clause.중분류 === subCategory
    )
    .map(clause => clause.태그)
    .filter(Boolean)
  )].sort()
}

export function getFilteredClauses(
  clauses: ContractClause[],
  workType: string,
  category: string,
  subCategory: string,
  tag: string
): ContractClause[] {
  return clauses.filter(clause =>
    clause.공종명 === workType &&
    clause.대분류 === category &&
    clause.중분류 === subCategory &&
    clause.태그 === tag
  )
}

export function getWorkTypes(clauses: ContractClause[]): string[] {
  return [...new Set(clauses.map(clause => clause.공종명))].filter(Boolean).sort()
}
