"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// 解析图片文件名中的坐标信息
const parseMapCoordinatesFromFilename = (filename: string): { width: number; height: number } | null => {
  // 匹配格式：map_name_x_y.png
  const match = filename.match(/^([^_]+)_(\d+)_(\d+)\.(png|jpg|jpeg|svg)$/i);
  
  if (match) {
    const x = parseInt(match[2]);
    const y = parseInt(match[3]);
    
    if (x > 0 && y > 0) {
      return { width: x, height: y };
    }
  }
  
  return null;
};

// 游戏地图数据
const gameMaps = [
  {
    id: "jian_ye_cheng",
    name: "建业城",
    image: "/maps/jian_ye_cheng_287_143.png",
    width: 287, // 从文件名自动解析
    height: 143, // 从文件名自动解析
    description: "茂密的森林区域，包含多个资源点和隐藏路径"
  },
  {
    id: "zhu_zi_guo", 
    name: "朱紫国",
    image: "/maps/zhu_zi_guo_191_119.png",
    width: 191,
    height: 119,
    description: "广阔的沙漠地带，视野开阔但资源稀少"
  },
  {
    id: "map3",
    name: "城市地图",
    image: "/maps/city-map.jpg.svg", 
    width: 1200,
    height: 900,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "map4",
    name: "雪山地图",
    image: "/maps/snow-mountain-map.jpg.svg",
    width: 960,
    height: 720,
    description: "冰雪覆盖的山脉，地形复杂，视野受限"
  }
];

// 坐标点类型
interface Coordinate {
  x: number;
  y: number;
  label?: string;
}

export default function MapAnnotationPage() {
  const [selectedMap, setSelectedMap] = useState(gameMaps[0]);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [coordinatesInput, setCoordinatesInput] = useState('');
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  
  // DOM引用
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);

  // 自动检测并更新地图尺寸
  useEffect(() => {
    const updateMapDimensions = () => {
      const filename = selectedMap.image.split('/').pop();
      if (filename) {
        const coords = parseMapCoordinatesFromFilename(filename);
        if (coords) {
          // 如果检测到坐标信息，更新地图尺寸
          setSelectedMap(prev => ({
            ...prev,
            width: coords.width,
            height: coords.height
          }));
        }
      }
    };

    updateMapDimensions();
  }, [selectedMap.image]);

  // 解析坐标输入
  const parseCoordinates = useCallback((input: string): Coordinate[] => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    const parsed: Coordinate[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 支持多种格式：x,y 或 x,y,label 或 (x,y) 或 (x,y,label)
      const match = line.match(/^[\\(]?(\d+)[,\s]+(\d+)[\\)]?(?:[,\s]+([^,]+))?$/);
      
      if (match) {
        const x = parseInt(match[1]);
        const y = parseInt(match[2]);
        const label = match[3]?.trim() || `点${i + 1}`;
        
        // 左下角坐标系验证：x从0到地图宽度，y从0到地图高度
        if (x >= 0 && x <= selectedMap.width && y >= 0 && y <= selectedMap.height) {
          parsed.push({ x, y, label });
        } else {
          throw new Error(`第${i + 1}行坐标超出地图范围：(${x}, ${y})，地图尺寸：${selectedMap.width}×${selectedMap.height}`);
        }
      } else {
        throw new Error(`第${i + 1}行格式错误："${line}"`);
      }
    }
    
    return parsed;
  }, [selectedMap]);

  // 处理坐标输入
  const handleApplyCoordinates = () => {
    setError(null);
    
    if (!coordinatesInput.trim()) {
      setError("请输入坐标数据");
      return;
    }
    
    try {
      const parsed = parseCoordinates(coordinatesInput);
      setCoordinates(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析坐标时发生错误");
    }
  };

  // 清除所有坐标
  const handleClearCoordinates = () => {
    setCoordinates([]);
    setCoordinatesInput("");
    setError(null);
  };

  // 处理地图选择
  const handleMapChange = (mapId: string) => {
    const map = gameMaps.find(m => m.id === mapId) || gameMaps[0];
    setSelectedMap(map);
    setCoordinates([]);
    setError(null);
  };



  // 计算图片实际显示区域
  const getImageDisplayRect = (containerRect: DOMRect) => {
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const imageAspectRatio = selectedMap.width / selectedMap.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let imageWidth, imageHeight, offsetX, offsetY;
    
    if (containerAspectRatio > imageAspectRatio) {
      // 容器更宽，图片高度填满，宽度按比例
      imageHeight = containerHeight;
      imageWidth = imageHeight * imageAspectRatio;
      offsetX = (containerWidth - imageWidth) / 2;
      offsetY = 0;
    } else {
      // 容器更高，图片宽度填满，高度按比例
      imageWidth = containerWidth;
      imageHeight = imageWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - imageHeight) / 2;
    }
    
    return {
      x: offsetX,
      y: offsetY,
      width: imageWidth,
      height: imageHeight
    };
  };

  // 获取标注点的实际显示位置
  const getMarkerPosition = (coord: Coordinate) => {
    if (!mapContainerRef.current) return { leftPercent: 0, topPercent: 0 };
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const imageDisplayRect = getImageDisplayRect(containerRect);
    
    // 计算坐标点在图片中的位置（百分比）
    // X坐标：直接按比例计算
    const leftPercent = (coord.x / selectedMap.width) * 100;
    
    // Y坐标：需要转换为DOM坐标系统（上方为0）
    // 地图坐标(0,0)在下方，所以DOM中应该是100%的位置
    // 地图坐标(height,0)在上方，所以DOM中应该是0%的位置
    const topPercent = ((selectedMap.height - coord.y) / selectedMap.height) * 100;
    
    // 将百分比坐标转换为容器内的绝对像素位置
    const absoluteLeft = imageDisplayRect.x + (imageDisplayRect.width * leftPercent / 100);
    const absoluteTop = imageDisplayRect.y + (imageDisplayRect.height * topPercent / 100);
    
    // 返回相对于容器的百分比位置
    const containerLeftPercent = (absoluteLeft / containerRect.width) * 100;
    const containerTopPercent = (absoluteTop / containerRect.height) * 100;
    
    return { 
      leftPercent: containerLeftPercent, 
      topPercent: containerTopPercent 
    };
  };

  // 处理鼠标离开事件（隐藏坐标）
  const handleMouseLeave = () => {
    setMousePosition(null);
    setCursorPosition(null);
  };

  // 处理右键鼠标按下事件（取消拖拽功能）
  const handleMouseDown = (e: React.MouseEvent) => {
    // 不再处理任何拖拽操作
    return;
  };

  // 处理鼠标移动事件（取消拖拽功能）
  const handleDragMouseMove = (e: React.MouseEvent) => {
    // 不再处理任何拖拽操作
    return;
  };

  // 处理鼠标释放事件（取消拖拽功能）
  const handleMouseUp = (e: React.MouseEvent) => {
    // 不再处理任何拖拽操作
    return;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mapImageRef.current || !mapContainerRef.current) return;
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const imageDisplayRect = getImageDisplayRect(containerRect);
    
    // 计算鼠标在图片显示区域内的相对位置
    const relativeX = e.clientX - containerRect.left - imageDisplayRect.x;
    const relativeY = e.clientY - containerRect.top - imageDisplayRect.y;
    
    // 检查鼠标是否在图片实际显示区域内
    if (relativeX >= 0 && 
        relativeX <= imageDisplayRect.width &&
        relativeY >= 0 && 
        relativeY <= imageDisplayRect.height) {
      
      // 转换为地图坐标（使用图片实际显示尺寸）
      const scaleX = selectedMap.width / imageDisplayRect.width;
      const scaleY = selectedMap.height / imageDisplayRect.height;
      const mapX = Math.round(relativeX * scaleX);
      
      // Y坐标转换：从DOM的上方为0转换为地图的下方为0
      const mapY = Math.round((imageDisplayRect.height - relativeY) * scaleY);
      
      setMousePosition({ x: mapX, y: mapY });
      setCursorPosition({ x: e.clientX, y: e.clientY });
    } else {
      setMousePosition(null);
      setCursorPosition(null);
    }
  };

  // 处理图片点击事件（添加新坐标点）
  const handleImageClick = (event: React.MouseEvent) => {
    if (!mapImageRef.current || !mapContainerRef.current) return;
    
    // 只处理左键点击
    if (event.button !== 0) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // 限制最多只能有20个点
    if (coordinates.length >= 20) {
      setError("最多只能标注20个位置");
      return;
    }
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const imageDisplayRect = getImageDisplayRect(containerRect);
    
    // 计算鼠标在图片显示区域内的相对位置
    const relativeX = event.clientX - containerRect.left - imageDisplayRect.x;
    const relativeY = event.clientY - containerRect.top - imageDisplayRect.y;
    
    // 检查鼠标是否在图片实际显示区域内
    if (relativeX >= 0 && 
        relativeX <= imageDisplayRect.width &&
        relativeY >= 0 && 
        relativeY <= imageDisplayRect.height) {
      
      // 转换为地图坐标（使用图片实际显示尺寸）
      const scaleX = selectedMap.width / imageDisplayRect.width;
      const scaleY = selectedMap.height / imageDisplayRect.height;
      const mapX = Math.round(relativeX * scaleX);
      
      // Y坐标转换：从DOM的上方为0转换为地图的下方为0
      const mapY = Math.round((imageDisplayRect.height - relativeY) * scaleY);
      
      // 计算格子坐标（5列4行）
      const rowIndex = Math.floor(coordinates.length / 5) + 1;  // 行号（1-4）
      const colIndex = (coordinates.length % 5) + 1;           // 列号（1-5）
      const label = `${rowIndex}-${colIndex}`;
      
      const newCoordinate: Coordinate = {
        x: mapX,
        y: mapY,
        label: label
      };
      
      setCoordinates(prev => [...prev, newCoordinate]);
      
      // 更新文本框内容
      const newLine = `${mapX},${mapY},${label}`;
      setCoordinatesInput(prev => prev ? `${prev}\n${newLine}` : newLine);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
            游戏地图标注工具
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            选择地图，输入坐标，在地图上标注重要位置
          </p>
        </header>

        <main className="space-y-8">
          {/* 地图选择区域 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              选择游戏地图
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <select 
                value={selectedMap.id}
                onChange={(e) => handleMapChange(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white flex-1"
              >
                {gameMaps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.name} - {map.width}×{map.height}
                  </option>
                ))}
              </select>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p>{selectedMap.description}</p>
              </div>
            </div>
          </section>

          {/* 坐标输入区域 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              坐标输入
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  坐标格式：x,y 或 x,y,标签 (每行一个坐标)
                </label>
                <textarea
                  value={coordinatesInput}
                  onChange={(e) => setCoordinatesInput(e.target.value)}
                  placeholder={`例如：\n100,200,资源点\n300,400,BOSS位置\n500,600,隐藏入口`}
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleApplyCoordinates}
                  className="px-6 py-3"
                >
                  应用坐标
                </Button>
                <Button 
                  onClick={handleClearCoordinates}
                  variant="outline"
                  className="px-6 py-3"
                >
                  清除所有
                </Button>
              </div>
            </div>
          </section>

          {/* 地图显示和标注区域 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              地图标注 - {selectedMap.name}
            </h2>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p>地图尺寸：{selectedMap.width} × {selectedMap.height} 像素</p>
                <p>坐标系：左下角为原点(0,0)，右上角为({selectedMap.width},{selectedMap.height})</p>
                <p>已标注 {coordinates.length} 个位置</p>
                <p className="mt-1 text-blue-600 dark:text-blue-400">
                  💡 提示：点击地图可以直接添加坐标点
                </p>
              </div>
              
              {/* 地图容器 */}
              <div className="relative border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      💡 左键点击添加坐标点
                    </div>
                  </div>
                
                <div 
                  ref={mapContainerRef}
                  className="flex justify-center items-start relative"
                  style={{ 
                    width: '100%', 
                    minHeight: `${selectedMap.height}px`
                  }}
                  onMouseMove={handleMouseMove}
                  onClick={handleImageClick}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* 地图图片 */}
                  <img
                    ref={mapImageRef}
                    src={selectedMap.image}
                    alt={selectedMap.name}
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      display: 'block',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    draggable={false}
                  />
                  
                  {/* 浮动坐标显示 */}
                  {mousePosition && cursorPosition && (
                    <div 
                      className="fixed z-50 bg-black/80 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none"
                      style={{
                        left: cursorPosition.x + 10,
                        top: cursorPosition.y + 10
                      }}
                    >
                      ({mousePosition.x}, {mousePosition.y})
                    </div>
                  )}
                  
                  {/* 显示坐标点 */}
                  {coordinates.map((coord, index) => {
                    const { leftPercent, topPercent } = getMarkerPosition(coord);
                    
                    return (
                      <div
                        key={index}
                        className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-pointer shadow-lg"
                        style={{ 
                          left: `calc(${leftPercent}% - 8px)`, 
                          top: `calc(${topPercent}% - 8px)` 
                        }}
                        title={`${coord.label} (${coord.x}, ${coord.y})`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {coord.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 坐标列表 */}
              {coordinates.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    标注位置列表
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {coordinates.map((coord, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {coord.label}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            ({coord.x}, {coord.y})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="mt-12 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>游戏地图标注工具 - 支持多种坐标格式和交互式标注</p>
        </footer>
      </div>
    </div>
  );
}