"use client"

import { useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useSession, signIn } from "next-auth/react"
import Navbar from './Navbar';
export default function HomePage() {
  const { data: session } = useSession();
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Hero animation
    gsap.fromTo(heroRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );

    // Section animations
    const sections = [section1Ref.current, section2Ref.current, section3Ref.current];

    sections.forEach((section) => {
      gsap.fromTo(section,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Clean up
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Head>
        <title>EzzAlgo - Learn Algorithms Visually</title>
        <meta name="description" content="Interactive platform for learning algorithms through visualization and practice" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      {/* Hero Section */}
      <div ref={heroRef} className="pt-32 pb-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Master Algorithms Through <span className="text-indigo-600">Visualization</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Learn complex algorithms with interactive animations, practice with real coding problems, and track your progress all in one place.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/algorithm">
            <p className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
              Start Learning
            </p>
          </Link>
          {!session ? (
            <button
              onClick={() => signIn()}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors border border-indigo-600 rounded-md hover:bg-indigo-50 w-[10rem]"
            >
              Sign In
            </button>
          ) : (
            <Link href="/practice">
              <p className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors">
                Practice Problems
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* Section 1: Algorithm Visualization */}
      <section id="learn" ref={section1Ref} className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Visualize Algorithms</h2>
              <p className="text-lg text-gray-600 mb-6">
                Understand how algorithms work through interactive animations. Watch step-by-step executions of sorting, searching, and other complex algorithms.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Step-by-step algorithm animations</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Adjustable animation speed</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Interactive code highlighting</span>
                </li>
              </ul>
              <Link href="/learn">
                <p className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                  Explore Learning
                </p>
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-1 shadow-xl">
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="bg-gray-800 p-3 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="p-4 h-64 flex items-center justify-center">
                    <div className="w-full">
                      <div className="flex justify-between items-end mb-2 h-8">
                        {[5, 2, 8, 1, 9, 3, 7, 4, 6].map((height, index) => (
                          <div
                            key={index}
                            className="w-8 bg-indigo-500 rounded-t-md transition-all duration-300"
                            style={{ height: `${height * 0.75}rem` }}
                          ></div>
                        ))}
                      </div>
                      <div className="text-center text-sm text-gray-500 mt-4">
                        Interactive algorithm visualization
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Practice Coding */}
      <section id="practice" ref={section2Ref} className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Practice with Our Code Editor</h2>
              <p className="text-lg text-gray-600 mb-6">
                Apply what you've learned by solving problems in our integrated code editor. Get instant feedback and improve your skills.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Built-in code editor with syntax highlighting</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Real-time code execution</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Test cases and challenge problems</span>
                </li>
              </ul>
              <Link href="/practice">
                <p className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                  Start Practicing
                </p>
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gray-900 p-3 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="text-xs text-gray-400 ml-2">bubble-sort.js</div>
                </div>
                <div className="p-4 font-mono text-sm text-gray-200">
                  <div className="text-purple-400">function</div>
                  <div className="text-yellow-200 ml-4">bubbleSort</div>
                  <div className="text-gray-200">(arr) {'{'}</div>
                  <div className="text-blue-400 ml-4">let</div>
                  <div className="text-gray-200"> n = arr.length;</div>
                  <div className="text-blue-400 ml-4">for</div>
                  <div className="text-gray-200"> (let i = 0; i </div>
                  <div className="text-gray-400 ml-8">// Sorting logic here</div>
                  <div className="text-gray-200 ml-4">{'}'}</div>
                  <div className="text-gray-200">{'}'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Progress Tracking */}
      <section id="progress" ref={section3Ref} className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Track Your Progress</h2>
              <p className="text-lg text-gray-600 mb-6">
                Monitor your learning journey with detailed analytics. See which algorithms you've mastered and where you need more practice.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Completion tracking for each algorithm</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Skill proficiency metrics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">Personalized recommendations</span>
                </li>
              </ul>
              <Link href="/progress">
                <p className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                  View Progress
                </p>
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-1 shadow-xl">
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
                      <span className="text-sm text-indigo-600">72% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">15</div>
                        <div className="text-sm text-gray-500">Algorithms Learned</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">24</div>
                        <div className="text-sm text-gray-500">Problems Solved</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-md"></div>
              <span className="text-xl font-bold text-white">EzzAlgo</span>
            </div>
            <p className="text-sm">Master algorithms through visualization and practice.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Sorting Algorithms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Searching Algorithms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Graph Algorithms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Data Structures</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Practice</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Code Challenges</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Interview Prep</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Skill Tests</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community Problems</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© {new Date().getFullYear()} EzzAlgo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
