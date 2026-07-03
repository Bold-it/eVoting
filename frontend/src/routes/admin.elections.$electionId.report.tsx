import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Printer, ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/elections/$electionId/report")({
  component: ReportPage,
});

function ReportPage() {
  const { electionId } = Route.useParams();

  const { data: report, isLoading } = useQuery({
    queryKey: ["electionReport", electionId],
    queryFn: async () => {
      const res = await api.get(`/admin/elections/${electionId}/report`);
      return res.data;
    },
  });

  if (isLoading) return <div className="p-10 text-center">Loading Report Data...</div>;
  if (!report) return <div className="p-10 text-center text-red-500">Failed to load report.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Non-printable controls */}
      <div className="print:hidden bg-slate-100 border-b border-slate-200 p-4 flex items-center justify-between">
        <Link to={`/admin/elections/${electionId}`} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Election
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto p-12 print:p-0 print:pt-8 bg-white print:shadow-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src="/htu_logo.png" alt="HTU Logo" className="h-20 w-auto" />
            <img src="/compssa_logo.jpg" alt="COMPSSA Logo" className="h-16 w-auto rounded-md" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Electoral Commission</h1>
            <p className="text-sm font-semibold text-slate-600">Comprehensive Election Report</p>
            <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Election Info */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{report.electionInfo.title}</h2>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-1 rounded-md inline-block">
                {report.electionInfo.status.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Voting Window</p>
              <p className="text-sm font-medium text-slate-900">
                {report.electionInfo.startTime ? new Date(report.electionInfo.startTime).toLocaleString() : "Not Set"}
                {" - "}
                {report.electionInfo.endTime ? new Date(report.electionInfo.endTime).toLocaleString() : "Not Set"}
              </p>
            </div>
          </div>
        </div>

        {/* Voter Metrics */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Voter Turnout & Engagement
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Roll</p>
              <p className="text-3xl font-bold text-slate-900">{report.voterMetrics.totalVoters}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tokens Issued</p>
              <p className="text-3xl font-bold text-slate-900">{report.voterMetrics.tokensGenerated}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Votes Cast</p>
              <p className="text-3xl font-bold text-slate-900">{report.voterMetrics.votesCast}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Turnout</p>
              <p className="text-3xl font-bold text-blue-900">{report.voterMetrics.turnoutPercentage}%</p>
            </div>
          </div>
        </div>

        {/* Candidate & Position Breakdown */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Positions & Candidates
          </h3>
          
          {report.positions.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No positions configured for this election.</p>
          ) : (
            <div className="space-y-8">
              {report.positions.map((pos: any) => (
                <div key={pos.name} className="break-inside-avoid">
                  <h4 className="text-md font-bold text-slate-800 mb-3 uppercase tracking-wide">{pos.name}</h4>
                  <table className="w-full text-left text-sm border-collapse border border-slate-200">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-slate-200 px-4 py-2 font-semibold text-slate-700">Candidate Name</th>
                        <th className="border border-slate-200 px-4 py-2 font-semibold text-slate-700 w-32 text-right">Votes Received</th>
                        <th className="border border-slate-200 px-4 py-2 font-semibold text-slate-700 w-24 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pos.candidates.map((c: any) => {
                        const hasVotes = typeof c.votes === 'number';
                        const percentage = hasVotes && pos.totalVotes > 0 
                          ? ((c.votes / pos.totalVotes) * 100).toFixed(1) 
                          : null;
                        return (
                          <tr key={c.name}>
                            <td className="border border-slate-200 px-4 py-2 font-medium">{c.name}</td>
                            <td className="border border-slate-200 px-4 py-2 text-right">
                              {hasVotes ? c.votes : <span className="text-slate-500 italic">Pending Decryption</span>}
                            </td>
                            <td className="border border-slate-200 px-4 py-2 text-right">
                              {percentage !== null ? `${percentage}%` : <span className="text-slate-500 italic">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-200 flex justify-between items-end break-inside-avoid">
          <div className="text-center w-64">
            <div className="border-b border-slate-400 h-10 mb-2"></div>
            <p className="text-sm font-semibold text-slate-800">Electoral Commissioner</p>
            <p className="text-xs text-slate-500">Sign & Stamp</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-slate-400 h-10 mb-2"></div>
            <p className="text-sm font-semibold text-slate-800">Dean of Students Affairs</p>
            <p className="text-xs text-slate-500">Sign & Stamp</p>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-slate-400 print:block hidden">
          Securely generated by COMPSSA eVoting System • Cryptographically Verified
        </div>

      </div>
    </div>
  );
}
