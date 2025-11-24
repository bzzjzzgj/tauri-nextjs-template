"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 坐标提取函数
export const extractCoordinates = (text: string): { x: number; y: number; location?: string } | null => {
  // 正则表达式：匹配"[坐标]"开头，然后是任意字符，最后是(数字,数字)格式
  const regex = /\[坐标\](.*?)\((\d+),(\d+)\)/;
  const match = text.match(regex);
  
  if (match) {
    return {
      location: match[1].trim(), // 地点名称
      x: parseInt(match[2], 10),  // X坐标
      y: parseInt(match[3], 10)   // Y坐标
    };
  }
  
  return null;
};

// 测试用例数据
const testCases = [
  "[坐标]普陀山(48,26)",
  "[坐标]朱紫国(123,45)",
  "[坐标]建业城(67,89)",
  "[坐标]东海湾(100,200)",
  "[坐标]花果山(300,400)",
  "普通文本，没有坐标信息",
  "[坐标]地点(abc,def)" // 无效坐标
];

export default function TestCoordinateExtractionPage() {
  const [inputText, setInputText] = useState<string>(testCases[0]);
  const [result, setResult] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // 测试单个输入
  const handleTestSingle = () => {
    const extracted = extractCoordinates(inputText);
    setResult(extracted);
  };

  // 运行所有测试用例
  const handleRunAllTests = () => {
    const results = testCases.map((testCase, index) => ({
      testCase,
      result: extractCoordinates(testCase)
    }));
    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
            坐标提取测试
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            测试从文本中提取"[坐标]地点(48,26)"格式的坐标信息
          </p>
        </header>

        <main className="space-y-8">
          {/* 单例测试 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">单例测试</h2>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="输入要测试的文本，如：[坐标]普陀山(48,26)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleTestSingle}>测试提取</Button>
              </div>

              {result && (
                <Alert className="mt-4">
                  <AlertDescription>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <strong>地点:</strong> {result.location || '未提取到'}
                      </div>
                      <div>
                        <strong>X坐标:</strong> {result.x}
                      </div>
                      <div>
                        <strong>Y坐标:</strong> {result.y}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result === null && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>未提取到有效坐标</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* 批量测试 */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">批量测试</h2>
              <Button onClick={handleRunAllTests}>运行所有测试</Button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-3">
                {testResults.map((item, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="font-mono text-sm mb-1">{item.testCase}</div>
                    {item.result ? (
                      <div className="text-sm text-green-700 dark:text-green-300">
                        ✓ 提取成功: 地点={item.result.location}, 坐标=({item.result.x},{item.result.y})
                      </div>
                    ) : (
                      <div className="text-sm text-red-700 dark:text-red-300">
                        ✗ 提取失败
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 测试用例列表 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">测试用例</h2>
            <ul className="list-disc list-inside space-y-2">
              {testCases.map((testCase, index) => (
                <li key={index} className="text-sm">{testCase}</li>
              ))}
            </ul>
          </Card>
        </main>
      </div>
    </div>
  );
}
