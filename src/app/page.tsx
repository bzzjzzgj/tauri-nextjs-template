"use client";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";

export default function Home() {
  const [greeted, setGreeted] = useState<string | null>(null);
  const [asktaoInput, setAsktaoInput] = useState<string>("");
  const [asktaoResult, setAsktaoResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const greet = useCallback((): void => {
    invoke<string>("greet")
      .then((s) => {
        setGreeted(s);
      })
      .catch((err: unknown) => {
        console.error(err);
        setGreeted("Error: " + String(err));
      });
  }, []);

  const callAsktaoDll = useCallback((): void => {
    if (!asktaoInput.trim()) return;
    
    setIsLoading(true);
    invoke<string>("call_asktao_dll", { input: asktaoInput })
      .then((result) => {
        setAsktaoResult(result);
      })
      .catch((err: unknown) => {
        console.error(err);
        setAsktaoResult("Error calling DLL: " + String(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [asktaoInput]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Tauri Next.js Template
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            A powerful desktop application built with Tauri and Next.js
          </p>
        </header>

        <main className="space-y-12">
          {/* Greeting Section */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  Greeting Function
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Click the button to receive a greeting from the backend
                </p>
              </div>
              <Button 
                onClick={greet}
                className="w-full md:w-auto px-6 py-3 text-lg"
                variant="default"
              >
                Say Hello
              </Button>
            </div>
            
            {greeted && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  {greeted}
                </p>
              </div>
            )}
          </section>

          {/* DLL Call Section */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  CQ.Asktao.dll Integration
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Enter input to call the external DLL function
                </p>
              </div>
              
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={asktaoInput}
                    onChange={(e) => setAsktaoInput(e.target.value)}
                    placeholder="Enter input for DLL function"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={callAsktaoDll}
                    disabled={isLoading || !asktaoInput.trim()}
                    className="px-6 py-3"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">●</span>
                        Processing...
                      </span>
                    ) : (
                      "Execute"
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {asktaoResult && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Result:
                </h3>
                <p className="text-green-700 dark:text-green-300 font-mono text-sm whitespace-pre-wrap">
                  {asktaoResult}
                </p>
              </div>
            )}
          </section>
        </main>

        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>Built with Tauri 2.0 + Next.js 15 App Router</p>
        </footer>
      </div>
    </div>
  );
}
