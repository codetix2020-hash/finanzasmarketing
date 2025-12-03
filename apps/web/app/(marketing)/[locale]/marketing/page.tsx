import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MarketingOS - God Mode Dashboard',
}

export default function MarketingDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">🚀 MarketingOS - God Mode</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Overview Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Content</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Hot Leads</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Jobs Running</h3>
          <p className="text-3xl font-bold mt-2">-</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🤖 Agentes IA</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Orquestador</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Content Generator</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Visual Agent</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Email Agent</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Voice Agent</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Competitor Analyzer</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Facebook Ads</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Google Ads</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>CRM</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Analytics</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Activo</span>
            </div>
          </div>
        </div>

        {/* Guards Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🛡️ Guardias</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Guardia Financiera</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">OK</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Guardia Reputacional</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">OK</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Guardia Legal</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📡 Endpoints Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm font-mono">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.guards.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.facebookAds.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.googleAds.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.crm.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.analytics.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.visual.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.email.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">marketing.voice.*</div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">autosaas.*</div>
        </div>
      </div>
    </div>
  )
}

