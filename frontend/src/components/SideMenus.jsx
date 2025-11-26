import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiBeaker, HiCurrencyRupee, HiDocument } from "react-icons/hi2";
import {
  ChevronsLeft,
  ChevronsRight,
  NotepadText,
  TestTube2,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import {
  MdAppRegistration,
  MdAssignment,
  MdTrendingUp,
} from "react-icons/md";
import { IoAnalytics } from "react-icons/io5";
import { FaMagnifyingGlass } from "react-icons/fa6";

export default function SideMenus({
  activeView,
  onViewChange,
  isMinimized = false,
  onToggleMinimize,
  onLogout,
  bdCode,
  designation, 
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const searchingMenus = [
    { key: "inqDate", label: "Inquiry", icon: MdAssignment },
    { key: "quotDate", label: "Quotation", icon: NotepadText },
    { key: "regisDate", label: "Registration", icon: MdAppRegistration },
  ];

  const analysisMenus = [
    { key: "pendingQuotations", label: "Pnd. Quotations", icon: HiDocument },
    bdCode && { key: "bdProjection", label: "BD Projection", icon: MdTrendingUp },
    !bdCode && { key: "bdPerformanceAnalysis", label: "BD Performance", icon: IoAnalytics },
    { key: "businessAnalysis", label: "Business Analysis", icon: HiCurrencyRupee },
    designation === 'Administrator' && { key: "labAnalysis", label: "LAB Analysis", icon: HiBeaker },
    designation === 'Administrator' && { key: "qaAnalysis", label: "QA Analysis", icon: FaMagnifyingGlass },
    { key: "sampleAnalysis", label: "Sample Analysis", icon: TestTube2 },
  ].filter(Boolean);

  const renderMenuItem = (menu) => (
    <li key={menu.key} className="group relative"> 
      <motion.button
        onClick={() => onViewChange(menu.key)}
        whileHover={{ scale: 1.02, x: 2 }}
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center w-full px-2.5 py-2.5 my-2 rounded-lg transition-all duration-300 ${
          isMinimized ? "justify-center" : ""
        } ${
          activeView === menu.key
            ? "bg-gradient-to-r from-white/25 to-white/20 shadow-lg font-semibold backdrop-blur-sm ring-2 ring-white/30"
            : "hover:bg-white/10 h;"
        }`}
      >
        <motion.div
          animate={activeView === menu.key ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <menu.icon 
            className={`w-4 h-4 transition-all duration-300 ${
              activeView === menu.key ? "text-white drop-shadow-lg" : ""
            } group-hover:scale-125 group-hover:rotate-12`} 
          />
        </motion.div>
        
        {!isMinimized && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm ml-2.5 font-medium"
          >
            {menu.label}
          </motion.span>
        )}

        {isMinimized && (
          <div 
            className="absolute left-full ml-5 px-4 py-2.5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white text-sm font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out pointer-events-none z-[60] whitespace-nowrap shadow-2xl border border-cyan-400/30 backdrop-blur-xl group-hover:scale-105 group-hover:ml-6"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-blue-600/30 rounded-xl blur-md -z-10"></div>
            
            {/* Content with gradient text */}
            <span className="relative z-10 bg-gradient-to-r from-cyan-200 via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              {menu.label}
            </span>
            
            {/* Animated arrow */}
            <motion.span 
              initial={{ x: -2, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mr-1 top-1/2 -translate-y-1/2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" className="drop-shadow-lg">
                <path 
                  d="M0 6 L12 0 L12 12 Z" 
                  fill="url(#arrowGradient)"
                  className="drop-shadow-xl"
                />
                <defs>
                  <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1f2937" />
                    <stop offset="100%" stopColor="#111827" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.span>

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
            />
          </div>
        )}
      </motion.button>
    </li>
  );

  const ToggleIcon = isMinimized ? ChevronsRight : ChevronsLeft;

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed top-0 left-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 text-white ${
          isMinimized ? "w-16" : "w-52"
        } h-screen overflow-y-auto px-3 py-4 flex flex-col shadow-2xl transition-all duration-300 z-50 custom-scrollbar`}
      >
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-400/10 pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />

        {/* Header */}
        <div className="mb-6 relative z-10">
          <div className={`flex ${isMinimized ? "justify-center" : "justify-between"} items-center mb-4`}>
            {!isMinimized && (
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent drop-shadow-lg"
              >
                LIMS Dashboard
              </motion.h2>
            )}
            <motion.button
              onClick={onToggleMinimize}
              whileHover={{ scale: 1.15, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl"
            >
              <ToggleIcon className="w-4 h-4" />
            </motion.button>
          </div>
          
          {!isMinimized && (
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            ></motion.div>
          )}
        </div>

        {/* Menus */}
        <nav className="flex-1 space-y-6 relative z-10">
          <div>
            {!isMinimized && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-extrabold uppercase text-cyan-100 mb-2 tracking-widest px-1 drop-shadow-md"
              >
                Searching
              </motion.h3>
            )}
            <ul className="space-y-1">{searchingMenus.map(renderMenuItem)}</ul>
          </div>

          <div>
            {!isMinimized ? (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-extrabold uppercase text-cyan-100 mb-2 tracking-widest px-1 drop-shadow-md"
              >
                Analysis
              </motion.h3>
            ) : (
              <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-3"></div>
            )}
            <ul className="space-y-1">{analysisMenus.map(renderMenuItem)}</ul>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto pt-3 border-t border-white/20 relative z-10">
          <motion.button
            className="group relative flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-300 hover:bg-white/15 text-white justify-center hover:shadow-lg backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <motion.div
              whileHover={{ rotate: 15 }}
            >
              <LogOut className={`${isMinimized ? "w-5 h-5" : "w-4 h-4"} transition-all duration-300 group-hover:scale-125`} />
            </motion.div>
            
            {!isMinimized && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm ml-2.5 font-medium"
              >
                Logout
              </motion.span>
            )}
            
            {isMinimized && (
              <div 
                className="absolute left-full ml-5 px-4 py-2.5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white text-sm font-bold rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out pointer-events-none z-[60] whitespace-nowrap shadow-2xl border border-red-400/30 backdrop-blur-xl group-hover:scale-105 group-hover:ml-6"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-pink-600/30 to-red-600/30 rounded-xl blur-md -z-10"></div>
                
                <span className="relative z-10 bg-gradient-to-r from-red-200 via-pink-200 to-red-200 bg-clip-text text-transparent">
                  Logout
                </span>
                
                <motion.span 
                  initial={{ x: -2, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="absolute right-full mr-1 top-1/2 -translate-y-1/2"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M0 6 L12 0 L12 12 Z" fill="url(#arrowGradient)" />
                    <defs>
                      <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1f2937" />
                        <stop offset="100%" stopColor="#111827" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.span>

                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[101] px-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.2 },
              }}
            >
              <motion.div
                initial={{ y: 30, rotateX: -15 }}
                animate={{ y: 0, rotateX: 0 }}
                exit={{ y: 30, rotateX: 15 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-200 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Gradient background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-pink-50 opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-5">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl shadow-lg"
                    >
                      <AlertTriangle className="w-7 h-7 text-red-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Confirm Logout
                    </h3>
                  </div>

                  <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                    Are you sure you want to log out? You'll need to sign in again to access the dashboard.
                  </p>

                  <div className="flex justify-end gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowLogoutConfirm(false)}
                      className="px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all text-sm font-bold shadow-md hover:shadow-lg"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        y: -2,
                        boxShadow: "0 10px 25px rgba(239, 68, 68, 0.4)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        onLogout?.();
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all text-sm font-bold relative overflow-hidden"
                    >
                      <span className="relative z-10">Logout</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(147, 197, 253, 0.6), rgba(96, 165, 250, 0.8));
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(96, 165, 250, 0.8), rgba(59, 130, 246, 0.9));
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(147, 197, 253, 0.6) transparent;
        }
      `}</style>
    </>
  );
}