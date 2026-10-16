'use client';

import React, { useState } from 'react';
import { ColumnMappingConfig } from '@/types';
import { X, Check, Columns, Users } from 'lucide-react';

interface ColumnMapperModalProps {
  headers: string[];
  currentMapping: ColumnMappingConfig;
  onSave: (mapping: ColumnMappingConfig) => void;
  onClose: () => void;
}

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  headers,
  currentMapping,
  onSave,
  onClose,
}) => {
  const [mapping, setMapping] = useState<ColumnMappingConfig>(JSON.parse(JSON.stringify(currentMapping)));

  const updateMemberCol = (
    memberIdx: number,
    field: keyof ColumnMappingConfig['memberColumns'][0],
    val: string
  ) => {
    const updatedMembers = mapping.memberColumns.map((m) => {
      if (m.memberIndex === memberIdx) {
        return {
          ...m,
          [field]: val === '__NONE__' ? undefined : val,
        };
      }
      return m;
    });
    setMapping({ ...mapping, memberColumns: updatedMembers });
  };

  const addMemberSlot = () => {
    const nextIdx = mapping.memberColumns.length + 1;
    setMapping({
      ...mapping,
      maxMembersDetected: nextIdx,
      memberColumns: [
        ...mapping.memberColumns,
        {
          memberIndex: nextIdx,
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              CSV Column Mapping & Schema Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-blue-900">
            Verify or adjust how your CSV spreadsheet columns map to teams and individual members.
            Auto-detection has mapped standard column names automatically.
          </div>

          {/* Team Level Columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Team Name Column:</label>
              <select
                value={mapping.teamNameCol}
                onChange={(e) => setMapping({ ...mapping, teamNameCol: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Submission Timestamp (Optional):</label>
              <select
                value={mapping.submissionTimeCol || '__NONE__'}
                onChange={(e) =>
                  setMapping({
                    ...mapping,
                    submissionTimeCol: e.target.value === '__NONE__' ? undefined : e.target.value,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
              >
                <option value="__NONE__">(None)</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Mappings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Member Columns Mapping ({mapping.memberColumns.length} slots)</span>
              </div>
              <button
                onClick={addMemberSlot}
                className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
              >
                + Add Member Slot
              </button>
            </div>

            <div className="space-y-3">
              {mapping.memberColumns.map((m) => (
                <div key={m.memberIndex} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">Member #{m.memberIndex}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Name:</span>
                      <select
                        value={m.nameCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'nameCol', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        <option value="__NONE__">(Not mapped)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500">GitHub:</span>
                      <select
                        value={m.githubCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'githubCol', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        <option value="__NONE__">(Not mapped)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500">Resume / CV:</span>
                      <select
                        value={m.resumeCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'resumeCol', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        <option value="__NONE__">(Not mapped)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500">Skills / Role / Bio:</span>
                      <select
                        value={m.roleOrBioCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'roleOrBioCol', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-[11px]"
                      >
                        <option value="__NONE__">(Not mapped)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(mapping)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Apply Mapping & Reparse</span>
          </button>
        </div>
      </div>
    </div>
  );
};
