const XLSX = require('xlsx');

// 샘플 데이터 생성
const sampleData = [
  {
    siteName: "마포자이힐스테이트라첼스(서울)",
    exemptionRate: 82.56,
    contactName: "이담당당 공무",
    contactPhoneRest: "5252-5252",
    contactEmailLocal: "tmdgks0304",
    docsUrl: "https://example.com/마포자이힐스테이트트",
    docsPassword: "1234"
  },
  {
    siteName: "영등포자이디그니티",
    exemptionRate: 85.30,
    contactName: "김담당 공무",
    contactPhoneRest: "1234-5678",
    contactEmailLocal: "kimdang",
    docsUrl: "https://example.com/영등포자이",
    docsPassword: "0000"
  },
  {
    siteName: "라틀라체자이드파인",
    exemptionRate: 89.12,
    contactName: "박공무",
    contactPhoneRest: "9876-5432",
    contactEmailLocal: "parkgong",
    docsUrl: "https://example.com/라클라체자이드파인",
    docsPassword: "9999"
  }
];

// 워크북 생성
const wb = XLSX.utils.book_new();

// 워크시트 생성
const ws = XLSX.utils.json_to_sheet(sampleData);

// 컬럼 너비 설정
ws['!cols'] = [
  { wch: 30 }, // siteName
  { wch: 12 }, // exemptionRate
  { wch: 20 }, // contactName
  { wch: 15 }, // contactPhoneRest
  { wch: 20 }, // contactEmailLocal
  { wch: 50 }, // docsUrl
  { wch: 15 }  // docsPassword
];

// 워크시트를 워크북에 추가
XLSX.utils.book_append_sheet(wb, ws, "sites");

// 파일 저장
XLSX.writeFile(wb, "data/site-presets-sample.xlsx");

console.log("샘플 엑셀 파일이 생성되었습니다: data/site-presets-sample.xlsx");
console.log("컬럼 설명:");
console.log("- siteName: 현장명");
console.log("- exemptionRate: 면세율 (숫자)");
console.log("- contactName: 담당자명");
console.log("- contactPhoneRest: 전화번호 뒷자리 (예: 5252-5252)");
console.log("- contactEmailLocal: 이메일 아이디 부분 (예: tmdgks0304)");
console.log("- docsUrl: 설계도서 URL");
console.log("- docsPassword: 설계도서 비밀번호");







