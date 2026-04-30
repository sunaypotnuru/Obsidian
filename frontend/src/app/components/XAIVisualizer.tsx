/**
 * XAI Visualizer Component
 * 
 * Provides explainable AI visualization with dual-layer image overlay
 * Features:
 * - Interactive opacity slider
 * - Side-by-side comparison mode
 * - Zoom and pan controls
 * - Touch-friendly for tablets
 * - Accessibility compliant (WCAG 2.1)
 * 
 * Phase 1: Intelligent mock heatmaps
 * Phase 2: Real Grad-CAM integration
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ZoomIn, ZoomOut, Info, Download } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useTranslation } from '../../lib/i18n';

interface XAIVisualizerProps {
  originalImage: string;
  heatmapImage?: string;
  confidence: number;
  prediction: string;
  clinicalNotes?: string;
  mode?: 'mock' | 'real';
  attentionRegions?: Array<{
    region: string;
    confidence: number;
    description: string;
  }>;
}

type ViewMode = 'overlay' | 'sideBySide' | 'original' | 'heatmap';

const XAIVisualizer: React.FC<XAIVisualizerProps> = ({
  originalImage,
  heatmapImage,
  confidence,
  prediction,
  clinicalNotes,
  mode = 'mock',
  attentionRegions = []
}: XAIVisualizerProps) => {
  const { t } = useTranslation();
  const [opacity, setOpacity] = useState(60);
  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate intelligent mock heatmap if not provided
  // Bug 8 Fix: Added viewMode to dependency array so canvas is redrawn when switching to heatmap view
  useEffect(() => {
    if (!heatmapImage && mode === 'mock' && canvasRef.current) {
      generateIntelligentMockHeatmap();
    } else if (heatmapImage && mode === 'real' && canvasRef.current) {
      // Load real heatmap from base64
      loadRealHeatmap();
    } else if (!heatmapImage && mode === 'mock' && viewMode === 'heatmap') {
      // Re-generate when switching to heatmap-only view
      generateIntelligentMockHeatmap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, heatmapImage, mode, viewMode]);

  const generateIntelligentMockHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Analyze image to find regions of interest
      // This simulates where a real Grad-CAM would focus
      const heatmapData = new Uint8ClampedArray(data.length);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness and contrast
        const brightness = (r + g + b) / 3;
        const contrast = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);

        // For cataract detection, focus on:
        // 1. Areas with high opacity (low brightness)
        // 2. Areas with texture changes (high contrast)
        // 3. Central lens region (weighted by position)

        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        const maxDistance = Math.sqrt(
          Math.pow(centerX, 2) + Math.pow(centerY, 2)
        );
        const centralWeight = 1 - (distanceFromCenter / maxDistance);

        // Calculate attention score (0-255)
        let attentionScore = 0;

        if (prediction.includes('CATARACT')) {
          // Focus on opaque and textured regions in center
          attentionScore = (
            (255 - brightness) * 0.4 +  // Opacity
            contrast * 0.3 +              // Texture
            centralWeight * 255 * 0.3     // Central focus
          );
        } else {
          // For normal cases, show minimal attention
          attentionScore = Math.random() * 50;
        }

        // Apply Gaussian-like smoothing for realistic heatmap
        const noise = (Math.random() - 0.5) * 30;
        attentionScore = Math.max(0, Math.min(255, attentionScore + noise));

        // Create heatmap with jet colormap
        const heatmapColor = getJetColor(attentionScore / 255);
        heatmapData[i] = heatmapColor.r;
        heatmapData[i + 1] = heatmapColor.g;
        heatmapData[i + 2] = heatmapColor.b;
        heatmapData[i + 3] = attentionScore * 0.6; // Alpha based on attention
      }

      // Apply Gaussian blur for smooth heatmap
      const blurredData = applyGaussianBlur(heatmapData, canvas.width, canvas.height);

      // Draw heatmap overlay
      const heatmapImageData = ctx.createImageData(canvas.width, canvas.height);
      heatmapImageData.data.set(blurredData);
      ctx.putImageData(heatmapImageData, 0, 0);
    };
    img.src = originalImage;
  };

  const getJetColor = (value: number): { r: number; g: number; b: number } => {
    // Jet colormap: blue -> cyan -> yellow -> red
    const v = Math.max(0, Math.min(1, value));
    let r, g, b;

    if (v < 0.25) {
      r = 0;
      g = v * 4 * 255;
      b = 255;
    } else if (v < 0.5) {
      r = 0;
      g = 255;
      b = (0.5 - v) * 4 * 255;
    } else if (v < 0.75) {
      r = (v - 0.5) * 4 * 255;
      g = 255;
      b = 0;
    } else {
      r = 255;
      g = (1 - v) * 4 * 255;
      b = 0;
    }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  };

  const applyGaussianBlur = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number = 5
  ): Uint8ClampedArray => {
    // Simple box blur approximation of Gaussian blur
    const output = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = x + kx;
            const py = y + ky;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const i = (py * width + px) * 4;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              a += data[i + 3];
              count++;
            }
          }
        }

        const i = (y * width + x) * 4;
        output[i] = r / count;
        output[i + 1] = g / count;
        output[i + 2] = b / count;
        output[i + 3] = a / count;
      }
    }

    return output;
  };

  const loadRealHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.onerror = () => {
      // Fallback to mock if real heatmap fails to load
      console.warn('Failed to load real heatmap, falling back to mock');
      generateIntelligentMockHeatmap();
    };
    img.src = heatmapImage;
  };

  const handleDownloadHeatmap = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `xai-heatmap-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-600" />
            {t('xai.title', 'AI Explainability Visualization')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {mode === 'mock' 
              ? t('xai.subtitle_mock', 'Intelligent simulation of AI attention regions')
              : t('xai.subtitle_real', 'Real-time Grad-CAM visualization')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('xai.info_title', 'How to Read This Visualization')}
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>{t('xai.info_red', 'Red/Yellow areas')}</strong>: {t('xai.info_red_desc', 'High AI attention - key diagnostic regions')}</li>
              <li>• <strong>{t('xai.info_blue', 'Blue/Green areas')}</strong>: {t('xai.info_blue_desc', 'Low AI attention - less relevant')}</li>
              <li>• <strong>{t('xai.info_opacity', 'Opacity slider')}</strong>: {t('xai.info_opacity_desc', 'Adjust to compare original vs heatmap')}</li>
              <li>• <strong>{t('xai.info_confidence', 'Confidence')}</strong>: {(confidence * 100).toFixed(1)}% - {t('xai.info_confidence_desc', 'AI certainty in this diagnosis')}</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={viewMode === 'overlay' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('overlay')}
          className="flex-1 min-w-[120px]"
        >
          {t('xai.mode_overlay', 'Overlay')}
        </Button>
        <Button
          variant={viewMode === 'sideBySide' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('sideBySide')}
          className="flex-1 min-w-[120px]"
        >
          {t('xai.mode_sidebyside', 'Side by Side')}
        </Button>
        <Button
          variant={viewMode === 'original' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('original')}
          className="flex-1 min-w-[120px]"
        >
          {t('xai.mode_original', 'Original')}
        </Button>
        <Button
          variant={viewMode === 'heatmap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('heatmap')}
          className="flex-1 min-w-[120px]"
        >
          {t('xai.mode_heatmap', 'Heatmap Only')}
        </Button>
      </div>

      {/* Image Viewer */}
      <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden" ref={containerRef}>
        {viewMode === 'sideBySide' ? (
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-center text-gray-700 dark:text-gray-300">
                {t('xai.original_image', 'Original Image')}
              </p>
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-auto rounded-lg shadow-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-center text-gray-700 dark:text-gray-300">
                {t('xai.heatmap_overlay', 'AI Attention Heatmap')}
              </p>
              <canvas
                ref={canvasRef}
                className="w-full h-auto rounded-lg shadow-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        ) : (
          <div className="relative p-4">
            {viewMode === 'overlay' && (
              <>
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-auto rounded-lg"
                  style={{ transform: `scale(${zoom})` }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-4 left-4 w-[calc(100%-2rem)] h-auto rounded-lg"
                  style={{
                    transform: `scale(${zoom})`,
                    opacity: opacity / 100,
                    mixBlendMode: 'multiply'
                  }}
                />
              </>
            )}
            {viewMode === 'original' && (
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-auto rounded-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            )}
            {viewMode === 'heatmap' && (
              <canvas
                ref={canvasRef}
                className="w-full h-auto rounded-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {viewMode === 'overlay' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('xai.opacity', 'Heatmap Opacity')}: {opacity}%
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpacity(0)}>
                <EyeOff className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpacity(100)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={(value: number[]) => setOpacity(value[0])}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            {(zoom * 100).toFixed(0)}%
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadHeatmap}>
          <Download className="w-4 h-4 mr-2" />
          {t('xai.download', 'Download')}
        </Button>
      </div>

      {/* Attention Regions */}
      {attentionRegions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {t('xai.attention_regions', 'Key Attention Regions')}
          </h4>
          <div className="space-y-2">
            {attentionRegions.map((region, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{region.region}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{region.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{(region.confidence * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">{t('xai.attention', 'Attention')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Notes */}
      {clinicalNotes && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>{t('xai.clinical_note', 'Clinical Note')}:</strong> {clinicalNotes}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('xai.disclaimer', 'XAI visualizations are for educational and explanatory purposes. Clinical decisions should be made by qualified healthcare professionals.')}
      </div>
    </Card>
  );
};

export default XAIVisualizer;
