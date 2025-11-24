"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home as HomeIcon } from "lucide-react";

// 注意：OCR识别逻辑已经移到后端API，避免在前端暴露密钥

// 解析图片文件名中的坐标信息
const parseMapCoordinatesFromFilename = (filename: string): { width: number; height: number } | null => {
  // 匹配格式：map_name_x_y.png
  const match = /^([^_]+)_(\d+)_(\d+)\.(png|jpg|jpeg|svg)$/i.exec(filename);

  if (match) {
    const x = parseInt(match[2]);
    const y = parseInt(match[3]);

    if (x > 0 && y > 0) {
      return { width: x, height: y };
    }
  }

  return null;
};

// 从文本中提取地图坐标信息
// 匹配格式：[坐标]地点名称(x,y)
const extractMapCoordinatesFromText = (text: string): { location: string; x: number; y: number }[] => {
  const coordinates: { location: string; x: number; y: number }[] = [];
  
  // 匹配所有符合格式的坐标文本
  const regex = /\[坐标\](.*?)\((\d+),(\d+)\)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const location = match[1].trim();
    const x = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    
    if (!isNaN(x) && !isNaN(y)) {
      coordinates.push({ location, x, y });
    }
  }
  
  return coordinates;
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
    id: "guo_jing_351_335",
    name: "大唐国境",
    image: "/maps/guo_jing_351_335.png",
    width: 351,
    height: 335,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "jiang_nan_ye_wai",
    name: "江南野外",
    image: "/maps/jiang_nan_ye_wai_159_119.png",
    width: 159,
    height: 119,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "nv_er_cun",
    name: "女儿村",
    image: "/maps/nv_er_cun_127_143.png",
    width: 127,
    height: 143,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "hua_guo_shan_159_119",
    name: "花果山",
    image: "/maps/hua_guo_shan_159_119.png",
    width: 159,
    height: 119,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "ao_lai_guo_223_150",
    name: "傲来国",
    image: "/maps/ao_lai_guo_223_150.png",
    width: 223,
    height: 150,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "chang_shou_jiao_wai_190_167",
    name: "长寿郊外",
    image: "/maps/chang_shou_jiao_wai_190_167.png",
    width: 190,
    height: 167,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "bei_ju_lu_zhou_226_168",
    name: "北俱芦洲",
    image: "/maps/bei_ju_lu_zhou_226_168.png",
    width: 226,
    height: 168,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "jing_wai_639_119",
    name: "大唐境外",
    image: "/maps/jing_wai_639_119.png",
    width: 639,
    height: 119,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "shi_tuo_ling_131_98",
    name: "狮驼岭",
    image: "/maps/shi_tuo_ling_131_98.png",
    width: 131,
    height: 98,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "mo_jia_cun_95_167",
    name: "墨家村",
    image: "/maps/mo_jia_cun_95_167.png",
    width: 95,
    height: 167,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "dong_hai_wan_119_118",
    name: "东海湾",
    image: "/maps/dong_hai_wan_119_118.png",
    width: 119,
    height: 118,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "wzg_99_74",
    name: "五庄观",
    image: "/maps/wzg_99_74.png",
    width: 99,
    height: 74,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "qi_lin_shan_190_142",
    name: "麒麟山",
    image: "/maps/qi_lin_shan_190_142.png",
    width: 190,
    height: 142,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
  {
    id: "pu_tuo_shan_95_71",
    name: "普陀山",
    image: "/maps/pu_tuo_shan_95_71.png",
    width: 95,
    height: 71,
    description: "现代化城市区域，建筑密集，适合巷战"
  },
];

// 坐标点类型
interface Coordinate {
  x: number;
  y: number;
  label?: string;
  visible?: boolean; // 添加visible属性，默认为true
}

// 图片类型
interface ClipboardImage {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export default function MapAnnotationPage() {
  const [selectedMap, setSelectedMap] = useState(gameMaps[0]);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [coordinatesInput, setCoordinatesInput] = useState('');
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightedCoordinateIndex, setHighlightedCoordinateIndex] = useState<number | null>(null); // 用于跟踪高亮的坐标点
  
  // 图片相关状态
  const [clipboardImages, setClipboardImages] = useState<ClipboardImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imageError, setImageError] = useState('');
  
  // OCR相关状态
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [ocrError, setOcrError] = useState('');

  // OCR识别函数
  const handleOCRRecognition = async () => {
    setIsOCRLoading(true);
    setOcrError('');
    setOcrResults([]);
    
    try {
      // 遍历所有图片，逐个调用OCR API
      const results = [];
      
      for (const image of clipboardImages) {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: image.dataUrl
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'OCR识别失败');
        }
        
        // 提取OCR识别到的所有文本
        const allText = (result.data.TextDetections || []).map(item => item.DetectedText || '').join('\n');
        
        // 从识别文本中提取符合格式的坐标信息：[坐标]地点名称(x,y)
        const extractedCoordinates = extractMapCoordinatesFromText(allText);
        
        results.push({
          imageId: image.id,
          data: result.data,
          coordinates: result.coordinates || [],
          extractedCoordinates: extractedCoordinates, // 保存提取到的格式化坐标
          timestamp: Date.now()
        });
      }
      
      setOcrResults(results);
      
      // 将提取到的坐标信息添加到地图标注点
      const allCoordinates = results.flatMap(result => 
        [...result.extractedCoordinates.map(coord => ({
          x: coord.x,
          y: coord.y,
          label: coord.location || `坐标点${results.length + 1}`
        }))]
      );
      
      if (allCoordinates.length > 0) {
        // 限制最多只能添加20个坐标点
        const coordinatesToAdd = allCoordinates.slice(0, 20 - coordinates.length);
        setCoordinates(prev => [...prev, ...coordinatesToAdd]);
        
        if (allCoordinates.length > coordinatesToAdd.length) {
          setOcrError(`已达到最大标注点数量限制(20个)，仅添加了${coordinatesToAdd.length}个坐标点`);
        }
      }
      
    } catch (error) {
      setOcrError(error instanceof Error ? error.message : 'OCR识别失败');
    } finally {
      setIsOCRLoading(false);
    }
  };

  // 处理手动输入的坐标文本提取
  const handleManualCoordinateExtraction = () => {
    const textarea = document.getElementById('manualCoordinates') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) {
      setError("请输入包含坐标的文本");
      return;
    }
    
    try {
      const extractedCoordinates = extractMapCoordinatesFromText(text);
      if (extractedCoordinates.length === 0) {
        setError("未从文本中提取到坐标信息，请检查格式是否为[坐标]地点名称(x,y)");
        return;
      }
      
      // 将提取到的坐标转换为Coordinate格式
      const newCoordinates = extractedCoordinates.map(coord => ({
        x: coord.x,
        y: coord.y,
        label: coord.location || `坐标点${coordinates.length + 1}`
      }));
      
      // 限制最多20个点
      const coordinatesToAdd = newCoordinates.slice(0, 20 - coordinates.length);
      setCoordinates(prev => [...prev, ...coordinatesToAdd]);
      
      if (newCoordinates.length > coordinatesToAdd.length) {
        setError(`已达到最大标注点数量限制(20个)，仅添加了${coordinatesToAdd.length}个坐标点`);
      } else {
        setError('');
      }
      
      // 清空文本域
      textarea.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : "提取坐标时发生错误");
    }
  };

  // 回到首页的按钮组件
  const BackToHomeButton = () => (
    <div className="mb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-700 dark:text-gray-200"
      >
        <HomeIcon className="w-4 h-4" />
        <span>回到首页</span>
      </Link>
    </div>
  );

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
    // 先按行分割，然后将每行按空格分割，得到所有的坐标项
    const lines = input.trim().split('\n').filter(line => line.trim());
    const coordinateItems: string[] = [];

    for (const line of lines) {
      // 如果一行中有空格分隔的坐标，则按空格分割
      if (line.includes(' ') && !line.includes('(')) {
        const items = line.trim().split(/\s+/);
        coordinateItems.push(...items);
      } else {
        // 否则整行作为一个坐标项处理
        coordinateItems.push(line.trim());
      }
    }

    const parsed: Coordinate[] = [];

    for (let i = 0; i < coordinateItems.length; i++) {
      const item = coordinateItems[i].trim();

      // 支持多种格式：x,y 或 x,y,label 或 (x,y) 或 (x,y,label)
      const match = /^[\\(]?(\d+)[,\s]+(\d+)[\\)]?(?:[,\s]+([^,]+))?$/.exec(item);

      if (match) {
        const x = parseInt(match[1]);
        const y = parseInt(match[2]);
        // 对于空格分割的格式，如果没有标签，则自动生成标签
        const label = (match[3] ? match[3].trim() : '') || `${Math.floor(i / 5) + 1}-${(i % 5) + 1}`;

        // 左下角坐标系验证：x从0到地图宽度，y从0到地图高度
        if (x >= 0 && x <= selectedMap.width && y >= 0 && y <= selectedMap.height) {
          parsed.push({ x, y, label, visible: true }); // 从文本框解析的点默认可见
        } else {
          throw new Error(`第${i + 1}个坐标超出地图范围：(${x}, ${y})，地图尺寸：${selectedMap.width}×${selectedMap.height}`);
        }
      } else {
        throw new Error(`第${i + 1}个坐标格式错误："${item}"`);
      }
    }

    return parsed;
  }, [selectedMap]);

  // 处理坐标输入
  const handleApplyCoordinates = () => {
    setError('');

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
    setError('');
  };

  // 处理地图选择
  const handleMapChange = (mapId: string) => {
    const map = gameMaps.find(m => m.id === mapId) ?? gameMaps[0];
    setSelectedMap(map);
    setCoordinates([]);
    setError('');
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

  // 处理切换坐标点显示/隐藏
  const handleToggleCoordinateVisibility = (index: number) => {
    // 更新坐标数组，切换指定索引坐标的visible状态
    setCoordinates(prev => {
      const newCoordinates = [...prev];
      const currentVisible = newCoordinates[index].visible !== false; // 默认为true
      newCoordinates[index] = {
        ...newCoordinates[index],
        visible: !currentVisible
      };
      return newCoordinates;
    });

    // 注意：文本框内容不需要更新，因为我们只是隐藏/显示点，而不是删除它们
  };

  // 从剪切板读取图片
  const handleLoadClipboardImages = async () => {
    setIsLoadingImages(true);
    setImageError('');
    
    try {
      // 直接尝试导入Tauri API，如果失败则说明不在Tauri环境中
      const { invoke } = await import('@tauri-apps/api/core');
      
      // 调用Tauri后端API读取剪切板图片
      const images = await invoke('get_clipboard_images');
      
      if (images && Array.isArray(images) && images.length > 0) {
        const newImages: ClipboardImage[] = images.map((dataUrl: string, index: number) => ({
          id: `image-${Date.now()}-${index}`,
          dataUrl,
          timestamp: Date.now()
        }));
        
        // 限制最多20张图片
        const imagesToAdd = newImages.slice(0, 20 - clipboardImages.length);
        setClipboardImages(prev => [...prev, ...imagesToAdd]);
        
        if (newImages.length > imagesToAdd.length) {
          setImageError(`已加载${imagesToAdd.length}张图片，达到最大限制20张`);
        }
      } else {
        setImageError('剪切板中没有找到图片');
      }
    } catch (error) {
      console.error('Failed to load clipboard images:', error);
      
      // 根据错误类型显示不同的提示信息
      if (error instanceof Error && error.message.includes('Cannot find module')) {
        setImageError('当前不在Tauri环境中，剪切板功能不可用');
      } else {
        setImageError(`读取剪切板图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } finally {
      setIsLoadingImages(false);
    }
  };

  // 删除单张图片
  const handleRemoveImage = (id: string) => {
    setClipboardImages(prev => prev.filter(img => img.id !== id));
  };

  // 清空所有图片
  const handleClearAllImages = () => {
    setClipboardImages([]);
    setImageError('');
  };

  // 处理鼠标移动事件（显示坐标）
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
        label: label,
        visible: true // 新添加的点默认可见
      };

      setCoordinates(prev => [...prev, newCoordinate]);

      // 更新文本框内容
      const newLine = `${mapX},${mapY},${label}`;
      setCoordinatesInput(prev => prev ? `${prev}\n${newLine}` : newLine);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="w-[1200px] mx-auto">
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
                onChange={(e) => {
                  handleMapChange(e.target.value);
                }}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                坐标输入
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  坐标格式：x,y 或 x,y,标签 (每行一个坐标)
                </label>
                <textarea
                  value={coordinatesInput}
                  onChange={(e) => {
                    setCoordinatesInput(e.target.value);
                  }}
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



          {/* 图片列表区域 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                微信截图图片列表
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => void handleLoadClipboardImages()}
                  disabled={isLoadingImages || clipboardImages.length >= 20}
                  className="px-4 py-2"
                >
                  {isLoadingImages ? '读取中...' : '从剪切板读取'}
                </Button>
                {clipboardImages.length > 0 && (
                  <Button
                    onClick={handleClearAllImages}
                    variant="outline"
                    className="px-4 py-2"
                  >
                    清空所有
                  </Button>
                )}
                <Button
                  variant="default"
                  onClick={() => void handleOCRRecognition()}
                  disabled={clipboardImages.length === 0 || isOCRLoading}
                  className="px-4 py-2"
                >
                  {isOCRLoading ? '识别中...' : 'OCR识别'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {imageError && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">{imageError}</p>
                </div>
              )}

              {clipboardImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">📋 剪切板图片列表</p>
                  <p className="text-sm">点击&quot;从剪切板读取&quot;按钮加载微信截图图片</p>
                  <p className="text-xs mt-2">支持最多20张图片，一行显示5张</p>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <p>已加载 {clipboardImages.length} 张图片</p>
                  </div>
                  
                  {/* 图片网格布局 - 一行5张 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {clipboardImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                      >
                        {/* 图片显示 */}
                        <img
                          src={image.dataUrl}
                          alt="剪切板图片"
                          className="w-full h-32 object-cover cursor-pointer"
                          onClick={() => {
                            // 点击图片可以放大查看
                            window.open(image.dataUrl, '_blank');
                          }}
                        />
                        
                        {/* 删除按钮 */}
                        <button
                          onClick={() => { handleRemoveImage(image.id); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs font-bold"
                          title="删除图片"
                        >
                          ×
                        </button>
                        
                        {/* 图片信息 */}
                        <div className="p-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {new Date(image.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 手动输入坐标文本区域 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                手动输入坐标文本
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  坐标格式：[坐标]地点名称(x,y)（每行一个坐标）
                </label>
                <textarea
                  id="manualCoordinates"
                  placeholder="例如：
[坐标]普陀山(48,26)
[坐标]五台山(120,80)"
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
              </div>

              <button
                onClick={handleManualCoordinateExtraction}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-xl transition duration-200 transform hover:scale-105"
              >
                提取坐标
              </button>
            </div>
          </section>

          {/* OCR识别结果区域 */}
          {ocrResults.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  OCR识别结果
                </h2>
              </div>

              <div className="space-y-6">
                {ocrResults.map((result, index) => (
                  <div key={result.imageId} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                      图片 {index + 1} 识别结果
                    </h3>

                    {/* 显示从格式化文本中提取的坐标信息 */}
                    {result.extractedCoordinates.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 text-green-600 dark:text-green-400">
                          从格式化文本中提取的坐标：[坐标]地点名称(x,y)
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.extractedCoordinates.map((coord, coordIndex) => (
                            <div key={coordIndex} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-600">
                              <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                地点：
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {coord.location}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-500">
                                <div>
                                  <span className="font-medium">坐标：</span>
                                  ({coord.x}, {coord.y})
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : result.coordinates.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          原始OCR坐标信息：
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.coordinates.map((coord, coordIndex) => (
                            <div key={coordIndex} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                              <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                识别文本：
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {coord.text}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-500">
                                <div>
                                  <span className="font-medium">坐标：</span>
                                  ({coord.x}, {coord.y})
                                </div>
                                <div>
                                  <span className="font-medium">尺寸：</span>
                                  {coord.width} × {coord.height}
                                </div>
                                <div>
                                  <span className="font-medium">置信度：</span>
                                  {Math.round(coord.confidence * 100)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        未识别到可提取的坐标信息
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* OCR错误信息 */}
          {ocrError && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  OCR识别错误：{ocrError}
                </p>
              </div>
            </section>
          )}

          {/* 地图显示和标注区域 */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                地图标注 - {selectedMap.name}
              </h2>
              <BackToHomeButton />
            </div>

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
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
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

                  {/* 显示坐标点（只显示visible为true的点） */}
                  {coordinates
                    .map((coord, originalIndex) => {
                      // 只显示可见的点
                      if (coord.visible === false) return null;

                      const { leftPercent, topPercent } = getMarkerPosition(coord);
                      // 使用原始索引来匹配高亮状态
                      const isHighlighted = highlightedCoordinateIndex === originalIndex;

                      return (
                        <div
                          key={originalIndex}
                          className={`absolute w-4 h-4 rounded-full cursor-pointer shadow-lg ${isHighlighted
                              ? 'bg-yellow-500 border-2 border-white scale-125'
                              : 'bg-red-500 border-2 border-white'
                            }`}
                          style={{
                            left: `calc(${leftPercent}% - 8px)`,
                            top: `calc(${topPercent}% - 8px)`
                          }}
                          title={`${coord.label} (${coord.x}, {coord.y})`}
                          onMouseEnter={() => {
                            setHighlightedCoordinateIndex(originalIndex);
                          }}
                          onMouseLeave={() => {
                            setHighlightedCoordinateIndex(null);
                          }}
                        >
                          <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded whitespace-nowrap ${isHighlighted
                              ? 'bg-yellow-500 text-black font-bold'
                              : 'bg-black text-white'
                            }`}>
                            {coord.label}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              </div>

              {/* 坐标列表 */}
              {coordinates.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    标注位置列表
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {coordinates.map((coord, index) => {
                      const isVisible = coord.visible !== false;
                      const isHighlighted = highlightedCoordinateIndex === index;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border flex justify-between items-center ${isHighlighted
                              ? "ring-2 ring-yellow-500 ring-opacity-50"
                              : ""
                            } ${isVisible
                              ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                              : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-500 opacity-60"
                            }`}
                          onMouseEnter={() => {
                            setHighlightedCoordinateIndex(index);
                          }}
                          onMouseLeave={() => {
                            setHighlightedCoordinateIndex(null);
                          }}
                        >
                          <div className="flex items-center">
                            <span className={`font-medium ${isVisible
                                ? "text-gray-800 dark:text-white"
                                : "text-gray-500 dark:text-gray-400"
                              } ${isHighlighted
                                ? "text-yellow-600 dark:text-yellow-400 font-bold"
                                : ""
                              }`}>
                              {coord.label}
                            </span>
                            <span className={`text-sm font-mono ml-2 ${isVisible
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-gray-500 dark:text-gray-500"
                              } ${isHighlighted
                                ? "text-yellow-600 dark:text-yellow-400 font-bold"
                                : ""
                              }`}>
                              ({coord.x}, {coord.y})
                            </span>
                          </div>
                          <Button
                            onClick={() => {
                              handleToggleCoordinateVisibility(index);
                            }}
                            variant="outline"
                            size="sm"
                            className="ml-2 h-8 w-8 p-0"
                          >
                            <span className="sr-only">{isVisible ? "隐藏" : "显示"}</span>
                            {isVisible ? "×" : "○"}
                          </Button>
                        </div>
                      );
                    })}
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