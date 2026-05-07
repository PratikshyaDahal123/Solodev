import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Wrench,
  PackageSearch,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Settings,
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Hero from '/hero.png'

const Landing = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#f6fbff] text-slate-700 selection:bg-sky-200/80 overflow-x-hidden">
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-500 { animation-delay: 500ms; }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(186, 230, 253, 0.85);
        }
      `}</style>

      <Header scrolled={scrolled} />

      {/* Hero Section */}
      <div className="relative w-full h-screen min-h-[600px] overflow-hidden flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={Hero} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>

        {/* Content Overlay - Left Aligned */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col justify-center max-w-2xl animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 leading-tight text-white drop-shadow-lg">
              Digitize Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-300">
                Auto Parts Business
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-100 mb-10 leading-relaxed drop-shadow-md">
              A modern web-based platform designed to simplify operations of vehicle service centers and auto spare parts businesses. Manage inventory, sales, customers, and service appointments in one centralized solution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <Link to="/register" className="px-8 py-3 rounded-full text-base font-medium text-blue bg-white text-black hover:bg-gray-100 shadow-lg shadow-black/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group font-semibold">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/demo" className="px-8 py-3 rounded-full text-base font-medium text-white bg-transparent border-2 border-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center font-semibold">
                <Settings className="mr-2 w-5 h-5" />
                Explore Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Powerful Features for Modern Auto Business</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Role-based access, AI-powered insights, and advanced automation designed for admins, staff, and customers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <PackageSearch className="w-8 h-8 text-cyan-500" />,
                title: "Inventory Management",
                desc: "Real-time tracking of vehicle parts with automatic low-stock notifications and supplier management."
              },
              {
                icon: <Wrench className="w-8 h-8 text-cyan-400" />,
                title: "Service & Appointments",
                desc: "Manage service bookings, track repair status, and maintain comprehensive service history for vehicles."
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
                title: "AI-Powered Analytics",
                desc: "Analyze vehicle conditions and predict part failures based on service history and usage patterns."
              },
              {
                icon: <Users className="w-8 h-8 text-emerald-400" />,
                title: "Customer Management",
                desc: "Centralized customer records, vehicle details, and loyalty discount programs for valued clients."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-amber-400" />,
                title: "Role-Based Access",
                desc: "Dedicated portals for Admins, Staff, and Customers with specific functionalities per role."
              },
              {
                icon: <Zap className="w-8 h-8 text-rose-400" />,
                title: "Automated Features",
                desc: "Overdue payment reminders, invoice email services, and smart notifications for efficient operations."
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/70 hover:bg-white group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-100 transition-all shadow-inner border border-sky-100">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div id="how-it-works" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">How It Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Streamlined workflow designed for vehicle service centers and parts retailers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Account",
                desc: "Register as Admin to set up your vehicle service center or auto parts business."
              },
              {
                step: "2",
                title: "Configure System",
                desc: "Set up your inventory, vendors, staff roles, and business information."
              },
              {
                step: "3",
                title: "Manage Operations",
                desc: "Add inventory, process sales, and handle customer service appointments."
              },
              {
                step: "4",
                title: "Grow With AI",
                desc: "Leverage AI insights to predict part failures and optimize your business decisions."
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-2xl font-bold mb-4 shadow-lg shadow-sky-200/60">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-1 bg-gradient-to-r from-sky-300 to-cyan-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats/Trust Section */}
      <div id="stats" className="py-20 border-y border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "50K+", label: "Parts Tracked" },
              { value: "1000+", label: "Active Users" },
              { value: "99.9%", label: "System Uptime" },
              { value: "24/7", label: "Customer Support" },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-sky-700 to-cyan-600">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-sky-100/70"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Ready to Transform Your Auto Business?</h2>
          <p className="text-xl text-slate-600 mb-10">
            Join vehicle service centers and auto spare parts businesses that are digitalizing their operations and growing with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-medium text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95">
              Create Free Account
            </Link>
            <Link to="/contact" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-medium text-slate-700 glass-panel hover:bg-white transition-all hover:scale-105 active:scale-95">
              Contact Sales
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-slate-600">
            <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> No credit card required</div>
            <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> 14-day free trial</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Landing
