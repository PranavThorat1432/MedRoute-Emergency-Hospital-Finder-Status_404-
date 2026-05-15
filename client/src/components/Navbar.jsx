import { useLang } from '../context/LangContext'
import { adminURL } from '../App'

export default function Navbar() {
  const { lang, setLang, t } = useLang()

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 glow-cyan">
              <span className="text-white text-lg">🏥</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white tracking-tight">{t('appName')}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="hidden sm:block text-xs text-cyan-400 font-mono">JALGAON DISTRICT</span>
                <span className="hidden sm:block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Admin Link & Language Toggle */}
          <div className="flex items-center gap-4">
            <a 
              href={adminURL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span>⚙️</span> Admin Portal
            </a>
            
            <div className="flex items-center bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 gap-1 border border-slate-700/50">
            {['en', 'hi', 'mr'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  lang === l
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'मर'}
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
