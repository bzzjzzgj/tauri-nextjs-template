// 设置运行时为Node.js
// @ts-ignore
// eslint-disable-next-line import/no-extraneous-dependencies
import { NextRequest, NextResponse } from 'next/server';
// 导入腾讯云OCR SDK
import * as tencentcloud from "tencentcloud-sdk-nodejs-ocr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 });
    }

    // 调试环境变量
    console.log('环境变量加载情况:');
    console.log('TENCENT_CLOUD_SECRET_ID:', process.env.TENCENT_CLOUD_SECRET_ID ? '已加载' : '未加载');
    console.log('TENCENT_CLOUD_SECRET_KEY:', process.env.TENCENT_CLOUD_SECRET_KEY ? '已加载' : '未加载');

    // 从DataURL中提取base64数据
    const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, '');

    // 配置腾讯云OCR客户端
    const OCRClient = tencentcloud.ocr.v20181119.Client;
    const clientConfig = {
      credential: {
        secretId: process.env.TENCENT_CLOUD_SECRET_ID,
        secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
      },
      region: "ap-beijing",
      profile: {
        httpProfile: {
          endpoint: "ocr.tencentcloudapi.com",
        },
      },
    };

    // 调试客户端配置
    console.log('客户端配置:');
    console.log('SecretId长度:', process.env.TENCENT_CLOUD_SECRET_ID ? process.env.TENCENT_CLOUD_SECRET_ID.length : 0);
    console.log('SecretKey长度:', process.env.TENCENT_CLOUD_SECRET_KEY ? process.env.TENCENT_CLOUD_SECRET_KEY.length : 0);
    console.log('Region:', clientConfig.region);
    console.log('Endpoint:', clientConfig.profile?.httpProfile?.endpoint);

    // 创建客户端
    const client = new OCRClient(clientConfig);

    // 调用腾讯云通用文字识别API
    const params = {
      ImageBase64: base64Data
    };
    const result = await client.GeneralAccurateOCR(params);

    // 提取坐标信息
    const coordinates = result.TextDetections?.map(item => {
      if (item.ItemPolygon) {
        return {
          x: item.ItemPolygon.X || 0,
          y: item.ItemPolygon.Y || 0,
          width: item.ItemPolygon.Width || 0,
          height: item.ItemPolygon.Height || 0,
          text: item.DetectedText || '',
          confidence: item.Confidence || 0
        };
      }
      return null;
    }).filter(Boolean) || [];

    return NextResponse.json({
      success: true,
      data: result,
      coordinates
    });
  } catch (error) {
    console.error('OCR识别失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR识别失败'
    }, { status: 500 });
  }
}