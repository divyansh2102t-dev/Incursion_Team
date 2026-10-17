'use client';

import React, { useState, useRef } from 'react';
import { TeamRecord } from '@/types';
import {
  X,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FolderOpen,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  Clock,
  Play,
  Lock,
} from 'lucide-react';
import {
  parseCloudResumeUrl,
  parseLocalPdfFile,
  matchResumeToCandidate,
  ResumeParseResult,
} from '@/engine/resumeParser';

interface ResumeSyncModalProps {
  teams: TeamRecord[];
  onUpdateTeamsWithParsedResumes: (
    updater: (prevTeams: TeamRecord[]) => TeamRecord[]
  ) => void;
  onClose: () => void;
}

export const ResumeSyncModal: React.FC<ResumeSyncModalProps> = ({
  teams,
  onUpdateTeamsWithParsedResumes,
  onClose,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    candidateName: string;
  } | null>(null);
  const [scanResults, setScanResults] = useState<
    Array<{
      memberId: string;
      candidateName: string;
      teamName: string;
      source: string;
      status: string;
      skillsFound: string[];
      hackathonCount: number;
      error?: string;
    }>
  >([]);

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Flatten all candidate members with resume links
  const candidateItems = teams.flatMap((team) =>
    team.members.map((member) => ({
      memberId: member.id,
      candidateName: member.name || 'Unnamed Candidate',
      teamName: team.teamName,
      email: member.email,
      resumeUrl: member.resumeUrl,
      hasResume: Boolean(member.resumeUrl),
      existingSkills: member.rawSignals.skills || [],
    }))
  );

  const candidateWithLinks = candidateItems.filter((c) => Boolean(c.resumeUrl));

  // Run live scan across all cloud resume links (Google Drive, Dropbox, web links)
  const handleStartCloudScan = async () => {
    if (candidateWithLinks.length === 0) {
      alert('No candidate resume links found in the active cohort.');
      return;
    }

    setIsScanning(true);
    const results: typeof scanResults = [];
    const updatesMap = new Map<string, ResumeParseResult>();

    let idx = 0;
    for (const item of candidateWithLinks) {
      idx++;
      setProgress({
        current: idx,
        total: candidateWithLinks.length,
        candidateName: item.candidateName,
      });

      const parsed = await parseCloudResumeUrl(item.resumeUrl!, item.candidateName);
      updatesMap.set(item.memberId, parsed);

      results.push({
        memberId: item.memberId,
        candidateName: item.candidateName,
        teamName: item.teamName,
        source: item.resumeUrl!.includes('drive.google.com') ? 'Google Drive' : 'Cloud URL',
        status: parsed.status,
        skillsFound: parsed.skills,
        hackathonCount: parsed.hackathonMentionCount,
        error: parsed.errorMessage,
      });
    }

    // Apply updates to cohort
    onUpdateTeamsWithParsedResumes((prev) =>
      prev.map((team) => {
        const updatedMembers = team.members.map((member) => {
          if (updatesMap.has(member.id)) {
            const parsed = updatesMap.get(member.id)!;
            if (parsed.success) {
              const mergedSkills = Array.from(
                new Set([...member.rawSignals.skills, ...parsed.skills])
              );
              const maxHackathons = Math.max(
                member.rawSignals.hackathonExperienceCount || 0,
                parsed.hackathonMentionCount
              );

              return {
                ...member,
                githubUrl: member.githubUrl || (parsed.embeddedGithub ? `https://github.com/${parsed.embeddedGithub}` : undefined),
                linkedinUrl: member.linkedinUrl || parsed.embeddedLinkedin,
                portfolioUrl: member.portfolioUrl || parsed.embeddedPortfolio,
                rawSignals: {
                  ...member.rawSignals,
                  skills: mergedSkills,
                  hackathonExperienceCount: maxHackathons,
                  workExperiences: parsed.workExperiences || member.rawSignals.workExperiences,
                  clubActivities: parsed.clubActivities || member.rawSignals.clubActivities,
                  matchedCustomKeywords: parsed.matchedCustomKeywords || member.rawSignals.matchedCustomKeywords,
                  hasResume: true,
                  hasGithub: Boolean(member.githubUrl || member.rawSignals.githubUsername || parsed.embeddedGithub),
                  hasLinkedin: Boolean(member.linkedinUrl || parsed.embeddedLinkedin),
                  hasPortfolio: Boolean(member.portfolioUrl || parsed.embeddedPortfolio),
                },
              };
            }
          }
          return member;
        });

        return {
          ...team,
          members: updatedMembers,
        };
      })
    );

    setScanResults(results);
    setIsScanning(false);
    setProgress(null);
  };

  // Handle local PDF drops or folder selection
  const handleLocalPdfFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.name.endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      alert('No PDF files found in the selected files/folder.');
      return;
    }

    setIsScanning(true);
    const results: typeof scanResults = [];
    const updatesMap = new Map<string, ResumeParseResult>();

    let idx = 0;
    for (const file of pdfFiles) {
      idx++;
      setProgress({
        current: idx,
        total: pdfFiles.length,
        candidateName: file.name,
      });

      const parsed = await parseLocalPdfFile(file);

      // Match PDF file to a candidate in the active cohort
      const matchedMemberId = matchResumeToCandidate(
        file.name,
        parsed.snippet || '',
        candidateItems.map((c) => ({
          memberId: c.memberId,
          name: c.candidateName,
          email: c.email,
        }))
      );

      const matchedCandidate = candidateItems.find((c) => c.memberId === matchedMemberId);

      if (matchedMemberId && matchedCandidate) {
        updatesMap.set(matchedMemberId, parsed);
        results.push({
          memberId: matchedMemberId,
          candidateName: matchedCandidate.candidateName,
          teamName: matchedCandidate.teamName,
          source: `PDF: ${file.name}`,
          status: parsed.status,
          skillsFound: parsed.skills,
          hackathonCount: parsed.hackathonMentionCount,
          error: parsed.errorMessage,
        });
      } else {
        results.push({
          memberId: `unmatched-${idx}`,
          candidateName: `Unmatched (${file.name})`,
          teamName: '—',
          source: `PDF: ${file.name}`,
          status: 'unmatched',
          skillsFound: parsed.skills,
          hackathonCount: parsed.hackathonMentionCount,
          error: 'Could not pair file name with any registered team member',
        });
      }
    }

    // Apply updates to cohort
    if (updatesMap.size > 0) {
      onUpdateTeamsWithParsedResumes((prev) =>
        prev.map((team) => {
          const updatedMembers = team.members.map((member) => {
            if (updatesMap.has(member.id)) {
              const parsed = updatesMap.get(member.id)!;
              if (parsed.success) {
                const mergedSkills = Array.from(
                  new Set([...member.rawSignals.skills, ...parsed.skills])
                );
                const maxHackathons = Math.max(
                  member.rawSignals.hackathonExperienceCount || 0,
                  parsed.hackathonMentionCount
                );

                return {
                  ...member,
                  githubUrl: member.githubUrl || (parsed.embeddedGithub ? `https://github.com/${parsed.embeddedGithub}` : undefined),
                  linkedinUrl: member.linkedinUrl || parsed.embeddedLinkedin,
                  portfolioUrl: member.portfolioUrl || parsed.embeddedPortfolio,
                  rawSignals: {
                    ...member.rawSignals,
                    skills: mergedSkills,
                    hackathonExperienceCount: maxHackathons,
                    workExperiences: parsed.workExperiences || member.rawSignals.workExperiences,
                    clubActivities: parsed.clubActivities || member.rawSignals.clubActivities,
                    matchedCustomKeywords: parsed.matchedCustomKeywords || member.rawSignals.matchedCustomKeywords,
                    hasResume: true,
                    hasGithub: Boolean(member.githubUrl || member.rawSignals.githubUsername || parsed.embeddedGithub),
                    hasLinkedin: Boolean(member.linkedinUrl || parsed.embeddedLinkedin),
                    hasPortfolio: Boolean(member.portfolioUrl || parsed.embeddedPortfolio),
                  },
                };
              }
            }
            return member;
          });

          return {
            ...team,
            members: updatedMembers,
          };
        })
      );
    }

    setScanResults((prev) => [...results, ...prev]);
    setIsScanning(false);
    setProgress(null);
  };

  const successfullyParsedCount = scanResults.filter((r) => r.status === 'parsed').length;
  const inaccessibleCount = scanResults.filter((r) => r.status === 'inaccessible').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 rounded-2xl max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-cyan-950/80 overflow-hidden max-h-[92vh] flex flex-col my-auto text-xs text-zinc-300 font-mono">
        {/* Header */}
        <div className="px-6 py-4 bg-black/60 border-b border-cyan-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-cyan-400 tracking-tight uppercase neon-glow-cyan">
                  Resume Intelligence & Cloud Drive Parser
                </h2>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-bold">
                  $0 COST • UNLIMITED
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Extracts skills, hackathons, and credentials directly from Google Drive links and local PDFs into volatile RAM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File / Folder inputs */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleLocalPdfFiles(e.target.files);
          }}
        />
        <input
          type="file"
          ref={folderInputRef}
          // @ts-expect-error webkitdirectory is standard across modern browsers
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleLocalPdfFiles(e.target.files);
          }}
        />

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top Telemetry Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-black/60 border border-zinc-800/80 p-3 rounded-xl">
              <span className="text-zinc-500 text-[10px] uppercase block">TOTAL CANDIDATES</span>
              <span className="text-base font-bold text-zinc-200 mt-0.5 block">
                {candidateItems.length} Applicants
              </span>
            </div>
            <div className="bg-black/60 border border-cyan-900/40 p-3 rounded-xl">
              <span className="text-cyan-500 text-[10px] uppercase block">DRIVE / RESUME LINKS</span>
              <span className="text-base font-bold text-cyan-300 mt-0.5 block">
                {candidateWithLinks.length} Detected
              </span>
            </div>
            <div className="bg-black/60 border border-emerald-900/40 p-3 rounded-xl">
              <span className="text-emerald-500 text-[10px] uppercase block">PARSED & ENRICHED</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {successfullyParsedCount} Resumes
              </span>
            </div>
            <div className="bg-black/60 border border-amber-900/40 p-3 rounded-xl">
              <span className="text-amber-500 text-[10px] uppercase block">PRIVATE DRIVE LINKS</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block">
                {inaccessibleCount} Flagged
              </span>
            </div>
          </div>

          {/* Action Cards: Cloud Scan & Local PDF Drop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Cloud Google Drive / Dropbox Links */}
            <div className="bg-black/50 border border-cyan-900/50 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>Cloud Google Drive & URL Scan</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Fetches candidate Google Drive and Dropbox URLs through our serverless resolver to bypass browser CORS and parse PDF text streams in volatile memory.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartCloudScan}
                disabled={isScanning || candidateWithLinks.length === 0}
                className={`w-full py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isScanning || candidateWithLinks.length === 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Scan {candidateWithLinks.length} Cloud Links</span>
              </button>
            </div>

            {/* Card 2: Local PDF Files / Folder Drop */}
            <div className="bg-black/50 border border-blue-900/50 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  <span>Local PDF Files / Folder</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Have candidate PDFs downloaded locally? Select individual PDF files or an entire folder. Candidates are automatically matched by filename or name.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-cyan-400 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Select PDFs</span>
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-cyan-400 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Select Folder</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          {isScanning && progress && (
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-cyan-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Parsing resume: <strong className="text-zinc-100">{progress.candidateName}</strong></span>
                </div>
                <span className="font-bold text-cyan-400">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-cyan-950">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_10px_#22d3ee]"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Diagnostic Log & Results Table */}
          {scanResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-200 uppercase tracking-wider text-xs">
                  Extraction Results ({scanResults.length} Processed)
                </h3>
                <span className="text-[10px] text-zinc-500">
                  Updates applied live to cohort leaderboard
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-black/60 max-h-64">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase bg-zinc-950/80">
                      <th className="py-2 px-3">Candidate / Team</th>
                      <th className="py-2 px-2">Source</th>
                      <th className="py-2 px-2 text-center">Status</th>
                      <th className="py-2 px-2">Skills Extracted</th>
                      <th className="py-2 px-2 text-center">Hackathons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {scanResults.map((res, i) => (
                      <tr key={res.memberId + i} className="hover:bg-zinc-900/30">
                        <td className="py-2 px-3">
                          <span className="font-bold text-zinc-200 block truncate max-w-[170px]">
                            {res.candidateName}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate max-w-[170px]">
                            {res.teamName}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-zinc-400 text-[11px] truncate max-w-[110px]">
                          {res.source}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {res.status === 'parsed' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PARSED</span>
                            </span>
                          ) : res.status === 'inaccessible' ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded"
                              title={res.error}
                            >
                              <Lock className="w-3 h-3" />
                              <span>PRIVATE LINK</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded"
                              title={res.error}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px]">
                          {res.skillsFound.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {res.skillsFound.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="text-[9px] bg-zinc-900 text-cyan-300 border border-zinc-800 px-1 rounded"
                                >
                                  {s}
                                </span>
                              ))}
                              {res.skillsFound.length > 3 && (
                                <span className="text-[9px] text-zinc-500">
                                  +{res.skillsFound.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-zinc-300">
                          {res.hackathonCount > 0 ? (
                            <span className="text-amber-400 font-bold text-xs">
                              {res.hackathonCount}x
                            </span>
                          ) : (
                            <span className="text-zinc-600">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Privacy & Zero-DB Notice */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center justify-between text-[11px] text-zinc-400 font-sans">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>100% Volatile RAM:</strong> All PDF document buffers are held temporarily in volatile memory only to extract numerical skills, and immediately discarded. Zero database storage, zero GDPR liability.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/60 border-t border-cyan-950/60 flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-sans text-[11px]">
            {candidateWithLinks.length} cloud links ready to parse • Instant live re-ranking
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 rounded-lg cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
