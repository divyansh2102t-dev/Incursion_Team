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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-cyan-950/80 overflow-hidden max-h-[92vh] flex flex-col my-auto font-mono text-xs text-zinc-300">
        {/* Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-cyan-400 tracking-tight uppercase neon-glow-cyan">
              CSV Column Mapping & Schema Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-xl text-zinc-300 font-sans text-xs">
            Verify or adjust how your CSV spreadsheet columns map to teams and individual members.
            Auto-detection has mapped standard column names automatically.
          </div>

          {/* Team Level Columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-zinc-300 text-xs uppercase">Team Name Column:</label>
              <select
                value={mapping.teamNameCol}
                onChange={(e) => setMapping({ ...mapping, teamNameCol: e.target.value })}
                className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2 font-mono text-zinc-200 focus:border-cyan-400 outline-none"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-300 text-xs uppercase">Submission Timestamp (Optional):</label>
              <select
                value={mapping.submissionTimeCol || '__NONE__'}
                onChange={(e) =>
                  setMapping({
                    ...mapping,
                    submissionTimeCol: e.target.value === '__NONE__' ? undefined : e.target.value,
                  })
                }
                className="w-full bg-black/60 border border-zinc-800 rounded-lg p-2 font-mono text-zinc-200 focus:border-cyan-400 outline-none"
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
              <div className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Member Columns Mapping ({mapping.memberColumns.length} slots)</span>
              </div>
              <button
                onClick={addMemberSlot}
                className="text-cyan-400 hover:text-cyan-300 font-bold text-xs cursor-pointer"
              >
                + Add Member Slot
              </button>
            </div>

            <div className="space-y-3">
              {mapping.memberColumns.map((m) => (
                <div key={m.memberIndex} className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-2">
                  <div className="font-bold text-zinc-100 uppercase text-[11px]">Member #{m.memberIndex}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500">Name:</span>
                      <select
                        value={m.nameCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'nameCol', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded p-1 text-[11px] outline-none"
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
                      <span className="text-[10px] text-zinc-500">GitHub:</span>
                      <select
                        value={m.githubCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'githubCol', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded p-1 text-[11px] outline-none"
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
                      <span className="text-[10px] text-zinc-500">Resume / CV:</span>
                      <select
                        value={m.resumeCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'resumeCol', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded p-1 text-[11px] outline-none"
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
                      <span className="text-[10px] text-zinc-500">Skills / Role / Bio:</span>
                      <select
                        value={m.roleOrBioCol || '__NONE__'}
                        onChange={(e) => updateMemberCol(m.memberIndex, 'roleOrBioCol', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded p-1 text-[11px] outline-none"
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
        <div className="px-6 py-3 bg-black/60 border-t border-cyan-950/60 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(mapping)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Mapping & Reparse</span>
          </button>
        </div>
      </div>
    </div>
  );
};
