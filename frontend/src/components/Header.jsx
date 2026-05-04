import { useState } from 'react'
import { Link } from 'react-router-dom'
import {  Menu, X } from 'lucide-react'
import Logo from '/logo.png'

const Header = ({ scrolled }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-2">
            <img src={Logo} alt="AutoSync Logo" className="w-30 h-20" />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-slate-700 hover:text-slate-950' : 'text-white/90 hover:text-white'
              }`}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-slate-700 hover:text-slate-950' : 'text-white/90 hover:text-white'
              }`}
            >
              How it Works
            </a>
            <a
              href="#stats"
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-slate-700 hover:text-slate-950' : 'text-white/90 hover:text-white'
              }`}
            >
              Impact
            </a>
            <div className={`h-4 w-px ${scrolled ? 'bg-slate-200' : 'bg-white/25'}`} />
            <Link
              to="/login"
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-slate-700 hover:text-slate-950' : 'text-white/90 hover:text-white'
              }`}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-sky-600 to-cyan-600 transition-all hover:scale-105 active:scale-95 hover:from-sky-500 hover:to-cyan-500"
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`transition-colors ${scrolled ? 'text-slate-700 hover:text-slate-950' : 'text-white/90 hover:text-white'}`}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`md:hidden absolute w-full ${scrolled ? 'bg-white border-t border-slate-200 shadow-sm' : 'bg-black/40 backdrop-blur-md'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#features"
              className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                scrolled
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                scrolled
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              How it Works
            </a>
            <Link
              to="/login"
              className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                scrolled
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className={`block px-3 py-2 text-base font-medium rounded-md ${
                scrolled
                  ? 'text-white hover:text-white hover:bg-sky-600'
                  : 'text-white hover:text-white hover:bg-white/20'
              }`}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Header
