"use client";

import { useMemo, useState, useEffect } from "react";
import { ContractClause } from "@/lib/types";

interface ProjectInfo {
  name: string;
  location: string;
  client: string;
  summary: string;
  projectType: string;
  detailedType: string;
  exemptionRate?: number; // 면세율/발주 물량 비율 등 사용자 입력값 (옵션)
  orderVolumeRate?: number;
  contactRole?: string;
  contactName?: string;
  contactPhoneRest?: string;
  contactEmailLocal?: string;
  docsUrl?: string;
  docsPassword?: string;
}

interface Condition {
  id: string;
  text: string;
  isForced?: boolean;
}

type ConditionBuckets = {
  basic: Condition[];
  construction: Condition[];
  safety: Condition[];
  quality: Condition[];
  custom: Condition[];
};

interface PreviewPanelProps {
  projectInfo: ProjectInfo;
  selectedConditions: {
    [key: string]: ConditionBuckets | undefined;
  };
  setProjectInfo?: (info: ProjectInfo) => void;
  misoResult?: string;
  contractConditions?: ContractClause[];
  selectedWorkType?: string;
  contractImages?: { [key: string]: any[] }; // 계약조건별 이미지 정보 추가
}

const EMPTY_BUCKETS: ConditionBuckets = {
  basic: [],
  construction: [],
  safety: [],
  quality: [],
  custom: [],
};

export function PreviewPanel({ 
  projectInfo, 
  selectedConditions, 
  setProjectInfo, 
  misoResult, 
  contractConditions = [],
  selectedWorkType,
  contractImages = {} // 기본값 추가
}: PreviewPanelProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  
  // 현재 선택된 조건들을 가져오기
  const currentConditions = useMemo(() => {
    console.log('PreviewPanel - selectedWorkType:', selectedWorkType)
    console.log('PreviewPanel - projectInfo.detailedType:', projectInfo.detailedType)
    console.log('PreviewPanel - selectedConditions:', selectedConditions)
    
    // selectedWorkType이 있으면 해당 공종의 조건을 사용
    if (selectedWorkType && selectedConditions[selectedWorkType]) {
      console.log('PreviewPanel - selectedWorkType 조건 사용:', selectedConditions[selectedWorkType])
      return selectedConditions[selectedWorkType];
    }
    
    // selectedWorkType이 없으면 projectInfo.detailedType을 사용
    if (selectedConditions[projectInfo.detailedType]) {
      console.log('PreviewPanel - projectInfo.detailedType 조건 사용:', selectedConditions[projectInfo.detailedType])
      return selectedConditions[projectInfo.detailedType];
    }
    
    console.log('PreviewPanel - 조건을 찾을 수 없음, EMPTY_BUCKETS 반환')
    return EMPTY_BUCKETS;
  }, [selectedConditions, selectedWorkType, projectInfo.detailedType]);

  // 계약조건들을 카테고리별로 분류
  const categorizedContractConditions = useMemo(() => {
    console.log('PreviewPanel - 받은 contractConditions:', contractConditions)
    const categorized: { [key: string]: ContractClause[] } = {};

    contractConditions.forEach(condition => {
      // 중분류를 기준으로 분류 (대분류가 아닌 중분류 사용)
      const category = condition.중분류 || condition.대분류 || '기타';
      console.log(`PreviewPanel - 조건 "${condition.내용}"을 중분류 "${category}"에 분류`, {
        uploadedImages: condition.uploadedImages?.length || 0
      })
      
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(condition);
    });

    console.log('PreviewPanel - 최종 카테고리별 분류:', categorized)
    return categorized;
  }, [contractConditions]);

  // 동적 섹션 정보 생성
  const dynamicSections = useMemo(() => {
    const sections: Array<{ title: string; conditions: ContractClause[]; sectionNumber: number }> = [];
    let sectionNumber = 6; // 6번부터 시작

    // 중분류별로 섹션 생성 (공사사항, 안전사항, 품질사항 등)
    Object.keys(categorizedContractConditions).forEach(category => {
      const conditions = categorizedContractConditions[category];
      if (conditions && conditions.length > 0) {
        sections.push({
          title: category,
          conditions: conditions,
          sectionNumber: sectionNumber++
        });
      }
    });

    console.log('PreviewPanel - 동적 섹션 정보:', sections);
    return sections;
  }, [categorizedContractConditions]);

  // 총 조건 수 계산
  const totalConditions = useMemo(() => {
    const basicCount = currentConditions?.basic?.length || 0;
    const customCount = currentConditions?.custom?.length || 0;
    const contractCount = contractConditions.length;
    return basicCount + customCount + contractCount;
  }, [currentConditions, contractConditions]);

  // 지급자재 정보 생성
  const suppliedMaterialsByType = useMemo(() => {
    if (!contractConditions.length) return "미선택";
    
    const materials = contractConditions
      .filter(c => c.공종명 && c.공종명.includes("지급"))
      .map(c => c.공종명)
      .join(", ");
    
    return materials || "미선택";
  }, [contractConditions]);

  // 현재 시간 설정
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
  }, []);

  return (
    <section id="preview-content" className="flex-1 p-6 bg-white overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        {/* 문서 헤더 */}
        <div className="mb-8 border border-gray-300 bg-white">
          <div className="flex items-start p-4">
            {/* 좌상단 로고 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <img 
                src="/gs-logo.png" 
                alt="GS건설 로고" 
                className="w-50 h-20"
              />
            </div>
            
            {/* 문서 정보 필드들 */}
            <div className="flex-1 ml-8">
              <div className="grid grid-cols-2 gap-8 text-sm">
                {/* 첫 번째 줄 */}
                <div className="flex items-center">
                  <span className="w-16 text-gray-600">현장명:</span>
                  <span className="flex-1 border-b border-gray-300 pb-1 min-w-0">
                    {projectInfo.name || "-"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 text-gray-600">작성일자:</span>
                  <span className="flex-1 border-b border-gray-300 pb-1 min-w-0">
                    2025.09
                  </span>
                </div>
                
                {/* 두 번째 줄 */}
                <div className="flex items-center">
                  <span className="w-16 text-gray-600">제목:</span>
                  <span className="flex-1 border-b border-gray-300 pb-1 min-w-0">
                    {selectedWorkType ? `${selectedWorkType} 공종별견적조건(현장)` : "공종별견적조건(현장)"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 text-gray-600">페이지:</span>
                  <span className="flex-1 border-b border-gray-300 pb-1 min-w-0">
                    -
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. 현장 일반사항 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg">1. 현장 일반사항</h2>
          <div className="mt-3 text-sm space-y-3">
            <div className="text-pretty pl-6">
              <span className="font-medium">1)</span> 본 입찰의 현장설명회는 On-line으로만 진행하며, 별도 Off-line 현장설명회가 진행되지 않으므로, 견적조건을 포함한 입찰안내 서류를 면밀히 숙지하고 투찰한다.
            </div>
            <div className="text-pretty pl-6">
              <span className="font-medium">2) [발주 물량 공지]</span> 금회 발주 물량은 전체 예상 물량의 약 
              {typeof setProjectInfo === "function" ? (
                <>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="mx-1 h-5 w-16 border border-gray-300 rounded px-1 bg-yellow-100/60 text-xs text-right"
                    value={projectInfo.orderVolumeRate ?? 100}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      const clamped = Math.max(0, Math.min(100, isNaN(value) ? 100 : value));
                      setProjectInfo({ ...projectInfo, orderVolumeRate: clamped });
                    }}
                  />
                  %
                </>
              ) : (
                <strong className="mx-1 text-right">{String(projectInfo.orderVolumeRate ?? 100)}%</strong>
              )}
              {" "}
              수준이며, 내역 확정 후 증감수량은 변경계약을 통하여 반영예정임
            </div>
            <div className="text-pretty pl-6">
              <span className="font-medium">3) 지급자재 :</span> 공사용 용수/전력(단, 협력사사무실 전력 제외), 건설용리프트, 시멘트
            </div>
            <div className="text-pretty pl-6">
              <span className="font-medium">4) 담당자 :</span> 
              {typeof setProjectInfo === "function" ? (
                <>
                  <input
                    className="mx-1 h-5 w-12 border border-gray-300 rounded px-1 bg-yellow-100/60 text-xs"
                    placeholder="역할"
                    value={projectInfo.contactRole ?? ""}
                    onChange={(e) => setProjectInfo({ ...projectInfo, contactRole: e.target.value })}
                  />
                  <input
                    className="mx-1 h-5 w-20 border border-gray-300 rounded px-1 text-xs"
                    placeholder="이름"
                    value={projectInfo.contactName ?? ""}
                    onChange={(e) => setProjectInfo({ ...projectInfo, contactName: e.target.value })}
                  />
                  전임(연락처 : 010-5252-5252 / 이메일 : 5252@gsenc.com)
                </>
              ) : (
                `${projectInfo.contactRole ?? "공무"} ${projectInfo.contactName ?? "000"} 전임(연락처 : 010-5252-5252 / 이메일 : 5252@gsenc.com)`
              )}
            </div>
          </div>
        </div>
  

        {/* 2. VAT 금액 산정 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg">2. VAT 금액 산정</h2>
          <div className="mt-3 text-sm space-y-3">
            {/* 1) 아파트 면세율 */}
            <div className="flex items-center gap-2 pl-6">
              <div>1) 아파트 면세율 :</div>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={Number(projectInfo.exemptionRate ?? 100)}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
                  setProjectInfo?.({ ...projectInfo, exemptionRate: clamped });
                }}
                className="h-7 w-24 border border-gray-300 rounded px-2 text-sm bg-yellow-100/60"
              />
              <span>%</span>
            </div>

            {/* 2) 면세 적용에 따른 VAT 금액 산출 */}
            <div className="pl-6">2) 면세 적용에 따른 VAT 금액 산출</div>

            {/* VAT 계산 테이블 */}
            <div className="ml-6 mt-3">
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-2">
                  <div className="text-center font-medium border-b border-gray-300 border-r border-gray-300 bg-gray-50 py-2 px-3 text-sm">면세</div>
                  <div className="text-center font-medium border-b border-gray-300 bg-gray-50 py-2 px-3 text-sm">과세</div>
                </div>
                
                {/* 테이블 바디 */}
                <div className="grid grid-cols-2">
                  {/* 면세 컬럼 */}
                  <div className="border-r border-gray-300 p-3 text-sm">
                    <div className="text-left">
                      <div className="font-medium">"아파트+주차장+부속동"의 직접비 계</div>
                      <div className="text-sm text-gray-600 mt-1">
                        × 아파트면세율({(projectInfo.exemptionRate ?? 100).toFixed(2)}%) × 0%
                      </div>
                    </div>
                  </div>
                  
                  {/* 과세 컬럼 */}
                  <div className="p-3 text-sm">
                    <div className="text-left space-y-2">
                      <div>
                        <div className="font-medium">1) "아파트+주차장+부속동"의 직접비 계</div>
                        <div className="text-sm text-gray-600 mt-1">
                          × (100% - 아파트면세율({(projectInfo.exemptionRate ?? 100).toFixed(2)}%)) × 10%
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">2) 상가 직접비 × 10%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 각주 */}
              <div className="mt-3 text-sm text-gray-500">
                * 간접비는 직접비총액 중 과세금액(아파트+주차장+부속동 과세금액 및 상가금액) 비율 적용
              </div>
            </div>
          </div>
        </div>

        {/* 3. 하자보증기간 안내 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg">3. 하자보증기간 안내</h2>
          <div className="mt-3 text-sm pl-6">
            <div>• 공동주택 2년</div>
          </div>
        </div>

        {/* 4. 설계도서 및 기술자료 열람 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg">4. 설계도서 및 기술자료 열람</h2>
          <div className="mt-3 text-sm space-y-2 pl-6">
            <div className="text-pretty">
              <span className="font-medium">1)</span> 아래 URL을 통해 실시설계 자료를 확인한다.
            </div>
            <div className="text-pretty">
              <span className="font-medium">2)</span> URL: {projectInfo.docsUrl ? (
                <a href={projectInfo.docsUrl} target="_blank" rel="noreferrer noopener" className="text-blue-600 underline">{projectInfo.docsUrl}</a>
              ) : (
                <span className="text-gray-400">미등록</span>
              )}
            </div>
            <div className="text-pretty">
              <span className="font-medium">3)</span> 패스워드: {projectInfo.docsPassword ?? <span className="text-gray-400">미등록</span>}
            </div>
          </div>
        </div>

        {/* 5. 현장 기본조건 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg">5. 현장 기본조건</h2>
          <div className="space-y-2 mt-3 text-sm leading-6">
            {/* 디버깅 정보 */}
            <div className="text-xs text-gray-400 mb-2">
              디버그: 기본조건 {currentConditions?.basic?.length || 0}개, 특수조건 {currentConditions?.custom?.length || 0}개
            </div>
            
            {/* 기본 조건들 */}
            {currentConditions?.basic && currentConditions.basic.length > 0 ? (
              currentConditions.basic.map((c, i) => (
                <div key={c.id || String(i)} className="text-pretty pl-6">
                  <span className="font-medium">{i + 1})</span> {c.text}
                </div>
              ))
            ) : (
              <div className="text-gray-500 pl-6">좌측 패널에서 기본조건을 선택하세요.</div>
            )}
            
            {/* 현장 특수조건들 (custom 조건들) */}
            {currentConditions?.custom && currentConditions.custom.length > 0 && (
              <>
                {currentConditions.custom.map((c, i) => (
                  <div key={c.id || String(i)} className={`text-pretty pl-6 ${c.isForced ? 'bg-yellow-100 px-2 py-1 rounded border-l-4 border-yellow-400' : ''}`}>
                    <span className="font-medium">{(currentConditions.basic?.length || 0) + i + 1})</span> {c.text}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 동적 섹션들 (6번부터 시작) */}
        {dynamicSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="font-bold text-lg">{section.sectionNumber}. {section.title}</h2>
            <div className="space-y-2 mt-3 text-sm leading-6">
              {section.conditions.map((condition, i) => (
                <div key={i} className={`text-pretty pl-6 ${condition.isForced ? 'bg-yellow-100 px-2 py-1 rounded border-l-4 border-yellow-400' : ''}`}>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">{i + 1})</span> {condition.내용}
                      {condition.중요표기 === '중요' && (
                        <span className="ml-2 text-red-600 font-semibold">[중요]</span>
                      )}
                    </div>
                    
                    {/* 업로드된 이미지 표시 */}
                    {condition.uploadedImages && condition.uploadedImages.length > 0 && (
                      <div className="ml-4 mt-2">
                        <div className="flex flex-wrap gap-3">
                          {condition.uploadedImages.map((image: any) => (
                            <div key={image.id} className="relative">
                              <img
                                src={image.preview}
                                alt="첨부 이미지"
                                className="object-contain border border-gray-300 rounded hover:border-blue-400 transition-colors cursor-pointer"
                                onClick={() => window.open(image.preview, '_blank')}
                                style={{ height: '300px', maxWidth: '400px' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 하단 생성 정보 */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <div>본 견적조건서는 견적 조건서 생성기를 통해 생성되었습니다.</div>
          <div>생성일시: {currentTime || "로딩 중..."}</div>
          <div>총 조건 수: {totalConditions}개</div>
        </div>
      </div>
    </section>
  );
}