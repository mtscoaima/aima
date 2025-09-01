"use client";
import React from "react";

type Section = { section: string; items: string[] };

interface StructuredRecommendationTableProps {
  sections: Section[];
}

export default function StructuredRecommendationTable({ sections }: StructuredRecommendationTableProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2 w-40">항목</th>
              <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">내용</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s, idx) => (
              <tr key={`${s.section}-${idx}`} className="align-top border-t border-gray-200">
                <td className="px-3 py-2 text-sm font-medium text-gray-700 whitespace-nowrap">{s.section}</td>
                <td className="px-3 py-2">
                  <ul className="list-disc pl-5 space-y-1">
                    {s.items?.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 leading-6">{item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


