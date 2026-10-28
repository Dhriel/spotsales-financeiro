import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Table2,
  Columns3,
  Send,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  Users,
  UserPlus,
  FileText,
  ShieldAlert,
  Pencil,
  Moon,
  Sun
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lancamentos', icon: Table2, label: 'Lançamentos' },
  { to: '/kanban', icon: Columns3, label: 'Kanban' },
  {
    icon: Users,
    label: 'Asaas',
    submenu: [
      { type: 'header', label: 'Editar' },
      { type: 'link', to: '/editar-contatos', icon: Pencil, label: 'Contatos' },
      { type: 'link', to: '/asaas-cobrancas-editar', icon: Pencil, label: 'Cobranças' },
      { type: 'header', label: 'Criar' },
      { type: 'link', to: '/asaas-clientes', icon: UserPlus, label: 'Clientes' },
      { type: 'link', to: '/asaas-cobranca', icon: FileText, label: 'Assinaturas / Cobranças' },
    ],
  },
  { to: '/envios', icon: Send, label: 'Envios' },
  { to: '/monitoramento', icon: ShieldAlert, label: 'Monitoramento' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [asaasOpen, setAsaasOpen] = useState(true)

  // Initial Check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    }
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img src="/logo.jpeg" alt="SpotSales" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight tracking-tight">SpotSales</h1>
                <p className="text-white/60 text-[10px] font-medium uppercase tracking-widest">Financial System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Botão de Dark Mode temporariamente removido */}
            <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 text-xs font-medium">Online</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-semibold">
              SS
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 transition-all duration-300 ease-in-out bg-white border-r border-brand-100/50 shadow-sm
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'w-[68px]' : 'w-60'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const hasSubmenu = 'submenu' in item

                if (hasSubmenu) {
                  return (
                    <div key={item.label}>
                      {/* Parent item */}
                      <button
                        onClick={() => setAsaasOpen(!asaasOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <item.icon size={20} />
                        {!collapsed && (
                          <>
                            <span>{item.label}</span>
                            <ChevronDown
                              size={16}
                              className={`ml-auto transition-transform ${asaasOpen ? 'rotate-180' : ''}`}
                            />
                          </>
                        )}
                      </button>

                      {/* Submenu */}
                      {asaasOpen && !collapsed && item.submenu && (
                        <div className="space-y-1 mt-1 ml-2 pl-2 border-l-2 border-brand-200">
                          {item.submenu.map((subitem, i) => {
                            if (subitem.type === 'header') {
                              return (
                                <div key={`header-${i}`} className="px-3 pt-3 pb-1 text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                                  {subitem.label}
                                </div>
                              )
                            }
                            return (
                              <NavLink
                                key={subitem.to}
                                to={subitem.to as string}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-all duration-200
                                  ${isActive
                                    ? 'bg-brand-100 text-brand-700'
                                    : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50/50'
                                  }
                                  `
                                }
                              >
                                {subitem.icon && <subitem.icon size={16} />}
                                <span>{subitem.label}</span>
                              </NavLink>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'bg-brand-700 text-white shadow-md shadow-brand-700/25'
                        : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
                      }
                      ${collapsed ? 'justify-center' : ''}
                      `
                    }
                  >
                    <item.icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:block p-3 border-t border-brand-100/50">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center w-full py-2 text-gray-400 hover:text-brand-700 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={`pt-16 transition-all duration-300 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-60'}`}
      >
        <div className="p-4 lg:p-6 xl:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
