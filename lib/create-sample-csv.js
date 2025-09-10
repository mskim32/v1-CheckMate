const fs = require('fs');

// create-sample-excel.js와 동일한 샘플 데이터
const sampleData = [
  {
    siteName: "마포자이힐스테이트라첼스(서울)",
    exemptionRate: 82.56,
    contactName: "이담당 공무",
    contactPhoneRest: "5252-5252",
    contactEmailLocal: "tmdgks0304",
    docsUrl: "https://examlie.com/mapo",
    docsPassword: "1234"
  },
  {
    siteName: "영등포자이디그니티",
    exemptionRate: 85.43,
    contactName: "김담당 공무",
    contactPhoneRest: "1234-5678",
    contactEmailLocal: "kimdang",
    docsUrl: "https://example.com/docs",
    docsPassword: "0000"
  },
  {
    siteName: "라클라체파인자이",
    exemptionRate: 89.12,
    contactName: "박담당 공무",
    contactPhoneRest: "9876-5432",
    contactEmailLocal: "parkgong",
    docsUrl: "https://example.com/gnam",
    docsPassword: "9999"
  }
];

// CSV 헤더
const headers = ['siteName', 'exemptionRate', 'contactName', 'contactPhoneRest', 'contactEmailLocal', 'docsUrl', 'docsPassword'];

// CSV 내용 생성
let csvContent = headers.join(',') + '\n';

sampleData.forEach(row => {
  const values = headers.map(header => {
    const value = row[header];
    // URL에 쉼표가 있으면 따옴표로 감싸기
    if (typeof value === 'string' && value.includes(',')) {
      return `"${value}"`;
    }
    return value;
  });
  csvContent += values.join(',') + '\n';
});

// CSV 파일 저장
fs.writeFileSync('data/site-presets.csv', csvContent, 'utf-8');

console.log("CSV 파일이 생성되었습니다: data/site-presets.csv");
console.log("create-sample-excel.js와 동일한 데이터로 업데이트되었습니다.");
console.log("컬럼 설명:");
console.log("- siteName: 현장명");
console.log("- exemptionRate: 면세율 (숫자)");
console.log("- contactName: 담당자명");
console.log("- contactPhoneRest: 전화번호 뒷자리 (예: 5252-5252)");
console.log("- contactEmailLocal: 이메일 아이디 부분 (예: tmdgks0304)");
console.log("- docsUrl: 설계도서 URL");
console.log("- docsPassword: 설계도서 비밀번호");
