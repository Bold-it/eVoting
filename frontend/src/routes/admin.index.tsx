import { createFileRoute } from '@tanstack/react-router'
import { api } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { Activity, Archive, CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['admin-elections'],
    queryFn: async () => {
      const res = await api.get('/admin/elections')
      return res.data
    },
  })

  if (isLoading) return <div className="p-8">Loading dashboard...</div>

  const active = elections?.filter((e: any) => e.status === 'active').length || 0
  const upcoming = elections?.filter((e: any) => e.status === 'upcoming').length || 0
  const closed = elections?.filter((e: any) => e.status === 'closed').length || 0

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Elections</p>
              <h3 className="text-2xl font-bold text-gray-900">{active}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Archive className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Elections</p>
              <h3 className="text-2xl font-bold text-gray-900">{upcoming}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <CheckCircle className="size-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Closed Elections</p>
              <h3 className="text-2xl font-bold text-gray-900">{closed}</h3>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {elections?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No elections created yet. Head over to the Elections tab to get started.
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Dates</th>
              </tr>
            </thead>
            <tbody>
              {elections?.slice(0, 5).map((e: any) => (
                <tr key={e.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{e.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      e.status === 'active' ? 'bg-green-100 text-green-700' :
                      e.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(e.startDate).toLocaleDateString()} - {new Date(e.endDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
