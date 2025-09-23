import xlsx from "xlsx";
import fs from "fs";

const wb = xlsx.readFile("./data/nts_industry.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]]; // '연계표' 시트

const range = xlsx.utils.decode_range(ws['!ref']);
console.log(`📊 Processing ${range.e.r + 1} rows...`);

const byYear = new Map(); // year -> Map(group -> items[])

// Row 5부터 실제 데이터 시작
for (let row = 5; row <= range.e.r; row++) {
  // 각 컬럼 값 추출
  const getCell = (col) => {
    const cellAddress = xlsx.utils.encode_cell({r: row, c: col});
    return ws[cellAddress]?.v || "";
  };

  const code = String(getCell(2)).trim(); // C열: 업종코드
  const group = String(getCell(4)).trim(); // E열: 대분류명
  const midClass = String(getCell(6)).trim(); // G열: 중분류명
  const subClass = String(getCell(8)).trim(); // I열: 소분류명
  const detail = String(getCell(10)).trim(); // K열: 세세분류명

  // 빈 데이터 스킵
  if (!code || !group) continue;

  // 2023년 고정 (엑셀에서 2023년 데이터만 있는 것으로 보임)
  const year = "2023";

  // 세부업종 라벨 생성 (중분류 > 소분류 > 세세분류)
  const detailParts = [midClass, subClass, detail].filter(Boolean);
  const detailLabel = detailParts.length > 0 ? detailParts.join(" > ") : "";

  const item = {
    code: code,
    name: detail || subClass || midClass || "",
    label: detailLabel || detail || subClass || midClass || "",
    ksic: "", // 표준산업분류코드는 별도 컬럼에서 추출 필요
  };

  // 연도별, 대분류별로 분류
  if (!byYear.has(year)) byYear.set(year, new Map());
  const map = byYear.get(year);
  if (!map.has(group)) map.set(group, []);

  // 동일 코드 중복 방지
  if (!map.get(group).some(x => x.code === item.code)) {
    map.get(group).push(item);
  }
}

// JSON 페이로드 생성
const years = Array.from(byYear.keys()).sort();
const dataByYear = {};

for (const year of years) {
  const map = byYear.get(year);
  const groups = Array.from(map.entries()).map(([group, items]) => ({
    group,
    items: items.sort((a,b) => (a.label || a.name).localeCompare(b.label || b.name, "ko")),
  })).sort((a,b) => a.group.localeCompare(b.group, "ko"));

  dataByYear[year] = { year, groups };

  console.log(`📊 Year ${year}: ${groups.length} groups, ${groups.reduce((sum, g) => sum + g.items.length, 0)} total items`);
}

// 디렉토리 생성 및 파일 저장
fs.mkdirSync("./public/data/nts", { recursive: true });
fs.writeFileSync("./public/data/nts/index.json", JSON.stringify({ years, dataByYear }, null, 2));

console.log("✅ Generated: /public/data/nts/index.json");
console.log(`📈 Total years: ${years.length}, Groups per year: ${Object.values(dataByYear)[0]?.groups.length || 0}`);