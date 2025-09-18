"use client"
import React, { useState, useRef, useEffect } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Navbar = () => {
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event : any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (event : any) => {
    if (event.key === 'Escape') {
      setShowDropdown(false)
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setShowDropdown(!showDropdown)
    }
  }

  const handleLogout = (e : any) => {
    e.preventDefault()
    signOut()
    setShowDropdown(false)
  }

  console.log(session?.user?.name, session?.user?.email, session?.user?.image)

  return (

    <nav className="fixed w-full bg-transparent bg-opacity-90 backdrop-blur-sm z-10 py-2 px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {/* <div className="w-8 h-8 bg-indigo-600 rounded-md"></div> */}
          <span className="text-xl font-bold text-gray-900">EzzAlgo</span>
        </div>
        <div className="hidden md:flex space-x-8 items-center">
            <Link href="/algorithm" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors relative group">
            Learn
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#practice" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors relative group">
            Practice
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#progress" className="text-gray-700 font-medium hover:text-indigo-600 transition-colors relative group">
            Progress
            <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          {/* </div> */}
        
        <div className='relative' ref={dropdownRef}>
          {session ? (
            <>
              <button
                className='text-gray-700 hover:opacity-80 rounded-full font-medium p-1 w-10 h-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all'
                onClick={() => setShowDropdown(!showDropdown)}
                onKeyDown={handleKeyDown}
                aria-expanded={showDropdown}
                aria-haspopup="true"
                aria-label={`User menu for ${session?.user?.name || 'User'}`}
              >
                {session?.user?.image ? (
                  <img 
                    className='w-full rounded-full h-full object-cover'
                    src={session?.user?.image} 
                    alt={`${session?.user?.name || 'User'} profile picture`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-sm ${session?.user?.image ? 'hidden' : ''}`}>
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>
              
              <div 
                className={`z-10 ${showDropdown ? "block" : "hidden"} absolute top-14 right-0 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 dark:bg-gray-700 dark:divide-gray-600 border border-gray-200 dark:border-gray-600`}
                role="menu"
                aria-orientation="vertical"
              >
                <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" role="none">
                  <li role="none">
                    <Link 
                      href="/mysettings" 
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
                      role="menuitem"
                      onClick={() => setShowDropdown(false)}
                    >
                      {session?.user?.name || 'User Settings'}
                    </Link>
                  </li>
                </ul>
                <div className="py-2" role="none">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
                    role="menuitem"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex space-x-4">
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar