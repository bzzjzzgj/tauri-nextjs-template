"use client";
import Link from "next/link";
import { MapPin, Code, Home as HomeIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="w-[1200px] mx-auto">
        <header className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            我的小工具
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            一些小工具，方便我日常使用
          </p>
        </header>

        <main className="space-y-12">
          {/* Navigation Section */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 transition-all duration-300 hover:shadow-xl">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-8">
                应用导航
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

                {/* Map Annotation Icon */}
                <Link 
                  href="/map-annotation"
                  className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 group"
                >
                  <MapPin className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">地图标注</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    梦幻西游宝图位置标注
                  </p>
                </Link>
                
  
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>Built with Tauri 2.0 + Next.js 15 App Router</p>
        </footer>
      </div>
    </div>
  );
}
