import React, { useEffect, useMemo, useState } from "react";

type Item = { code: string; name: string; label?: string; ksic?: string; upte?: string };
type Group = { group: string; items: Item[] };
type ApiRes = { years: string[]; year: string; groups: Group[] };

interface NTSFinderProps {
  onSelect?: (item: Item & { group: string }) => void;
}

export default function NTSFinder({ onSelect }: NTSFinderProps) {
  const [years, setYears] = useState<string[]>([]);
  const [year, setYear] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [group, setGroup] = useState<string>("");   // 대분류 (""=전체)
  const [detail, setDetail] = useState<string>(""); // 세부업종 라벨 (""=전체)
  const [searchText, setSearchText] = useState<string>(""); // 검색어
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async (y?: string) => {
    try {
      const url = y ? `/api/nts-industries?year=${y}` : `/api/nts-industries`;
      const res = await fetch(url);
      const data: ApiRes = await res.json();
      setYears(data.years);
      setYear(data.year);
      setGroups(data.groups);
    } catch (error) {
      console.error('Failed to load industry data:', error);
    }
  };

  useEffect(() => { load(); }, []);

  // 대분류 옵션
  const groupOptions = useMemo(() => {
    return [{ label: "전체", value: "" }]
      .concat(groups.map(g => ({ label: g.group, value: g.group })));
  }, [groups]);

  // 세부업종 옵션 (선택된 대분류 기준)
  const detailOptions = useMemo(() => {
    const base = [{ label: "전체", value: "" }];
    if (!group) return base; // 대분류 미선택이면 '전체'만
    const g = groups.find(x => x.group === group);
    if (!g) return base;
    const opts = g.items.map(it => ({
      label: it.label || it.name,
      value: it.label || it.name,
    }));
    // 중복 라벨 제거
    const uniq = Array.from(new Map(opts.map(o => [o.value, o])).values())
      .sort((a,b)=>a.label.localeCompare(b.label, "ko"));
    return base.concat(uniq);
  }, [group, groups]);

  // 테이블 데이터 필터링
  const filtered = useMemo(() => {
    let rows: Array<{year:string; group:string; item:Item}> = [];
    for (const g of groups) {
      if (group && g.group !== group) continue;
      for (const it of g.items) {
        if (detail && (it.label || it.name) !== detail) continue;
        // 검색어 필터링
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          const matchCode = it.code.toLowerCase().includes(searchLower);
          const matchName = (it.name || "").toLowerCase().includes(searchLower);
          const matchLabel = (it.label || "").toLowerCase().includes(searchLower);
          const matchGroup = g.group.toLowerCase().includes(searchLower);
          if (!matchCode && !matchName && !matchLabel && !matchGroup) continue;
        }
        rows.push({ year, group: g.group, item: it });
      }
    }
    return rows;
  }, [groups, group, detail, year, searchText]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [group, detail, year, searchText]); // 선택 변경 시 페이지 초기화

  const handleSelect = (item: Item, itemGroup: string) => {
    onSelect?.({ ...item, group: itemGroup });
  };

  return (
    <div className="space-y-4">
      {/* 상단 필터 행 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">귀속년도</label>
          <select
            value={year}
            onChange={e => { setGroup(""); setDetail(""); setSearchText(""); load(e.target.value); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">대분류</label>
          <select
            value={group}
            onChange={e => { setGroup(e.target.value); setDetail(""); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {groupOptions.map(o => <option key={o.value || "ALL"} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">세부업종</label>
          <select
            value={detail}
            onChange={e => setDetail(e.target.value)}
            disabled={!group}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {detailOptions.map(o => <option key={o.value || "ALL"} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="업종코드, 업종명 검색"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 결과 개수 표시 */}
      <div className="text-sm text-gray-600">
        총 {filtered.length}개 업종
      </div>

      {/* 결과 테이블 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">귀속년도</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업종코드</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업종명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대분류</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">세부업종</th>
              {onSelect && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">선택</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paged.map(({year, group: itemGroup, item}) => (
              <tr key={`${year}-${item.code}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{year}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.code}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{itemGroup}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.label || "-"}</td>
                {onSelect && (
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleSelect(item, itemGroup)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      선택
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={onSelect ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filtered.length)} / {filtered.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm">
              {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize) || 1, p + 1))}
              disabled={page >= Math.ceil(filtered.length / pageSize)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}