import { CarFront } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="border-t border-sky-100 bg-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-6">
              <img src="/logo.png" alt="SawariSync" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              The modern operating system for vehicle service centers and auto
              parts retailers.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#features" className="hover:text-sky-700 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-700 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-sky-100 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
          <p>
            © {new Date().getFullYear()} SawariSync. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
