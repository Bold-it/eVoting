import { createFileRoute, Outlet, Link, Navigate } from '@tanstack/react-router'
import { LayoutDashboard, Users, UserPlus, LogOut, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    // If not authenticated or not an admin, we could redirect here.
    // For now we rely on the component or a proper auth guard.
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'election_officer')) {
    return <Navigate to="/admin-login" />
  }

  return <Outlet />
}
