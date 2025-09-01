"use client"
import React, { useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { useEffect } from 'react'

const Navbar = () => {
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

//   useEffect(() => {
//     const handleScroll = () => {
//       const navbar = document.querySelector('nav')
//       if (window.scrollY > 50) {
//         navbar.classList.add('scrolled')
//       } else {
//         navbar.classList.remove('scrolled')
//       }
//     }

//     window.addEventListener('scroll', handleScroll)
//     return () => window.removeEventListener('scroll', handleScroll)
//   }, [])
  console.log(session?.user?.name)
  return (
    <>
      <nav className='navbar bg-gradient-to-r from-bg-#09090b bg-zinc-800 text-white flex justify-between px-5 h-12 sticky top-0 z-10 items-center'>
        <Link href="/" >
          <div className="logo font-bold text-lg flex justify-center items-center z-50">
            Ezzalgo
          </div>
        </Link>
        <div className='relative'>
          {session && <>
          <div className='text-white hover:opacity-80 rounded-full font-medium p-1 w-[3em]'>
              <img className='w-full rounded-full cursor-pointer'
              onClick={() => { setShowDropdown(!showDropdown) }}
              onBlur={() => {
                setTimeout(() => { setShowDropdown(false) }, 500)
              }}
              id="dropdownDividerButton"
              src={`${session?.user?.image}`} alt="" />
            </div>
            <div id="dropdownDivider" className={`z-10 ${showDropdown ? "" : "hidden"} absolute top-[45px] right-[0px] bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600`}>
              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDividerButton">
                <li>
                  <Link href="/mysettings" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{session?.user?.name}</Link>
                </li>
              </ul>
              <div className="py-2">
                <Link onClick={() => signOut()} href={"/"} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-auto dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white" >Log Out</Link>
              </div>
            </div>
          </>}
        </div>
        {!session &&
          // <Link href={"/login"}>

          <button onClick={() => signIn()} type="button" className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2 text-center flex justify-center items-center">Login</button>
          // {/* </Link> */}
        }
      </nav>
    </>
  )
}

export default Navbar




