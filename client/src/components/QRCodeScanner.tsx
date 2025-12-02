import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, Copy, QrCode, Smartphone } from 'lucide-react';
import * as QRCodeLib from 'qrcode.react';
import { DefaultLayout } from './layout/DefaultLayout';

interface QRCodeGeneratorProps {
  onClose?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'generate' | 'scan'>('generate');
  const [generatedLink, setGeneratedLink] = useState('');
  const [qrValue, setQrValue] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const generateQRCode = () => {
    const baseUrl = window.location.origin;
    // Generate link that directs to order page after login
    const orderPageLink = `${baseUrl}/food?utm_source=qr&ref=menu`;
    setQrValue(orderPageLink);
    setGeneratedLink(orderPageLink);
    toast.success('QR Code generated successfully!');
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (svg) {
      // Convert SVG to canvas then download as PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'order-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code downloaded!');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  return (<DefaultLayout>

    <div className="w-full max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode size={24} />
            QR Code Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'generate' ? 'default' : 'outline'}
              onClick={() => setMode('generate')}
              className="flex-1"
            >
              <QrCode size={18} className="mr-2" />
              Generate QR
            </Button>
            <Button
              variant={mode === 'scan' ? 'default' : 'outline'}
              onClick={() => setMode('scan')}
              className="flex-1"
            >
              <Smartphone size={18} className="mr-2" />
              Scan QR
            </Button>
          </div>
          {/* Generate Mode */}
          {mode === 'generate' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ This QR code will redirect users to the order page after they login.
                </p>
              </div>
              <Button
                onClick={generateQRCode}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                Generate QR Code
              </Button>
              {qrValue && (
                <div className="space-y-4">
                  {/* QR Code Display */}
                  <div className="flex justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div ref={qrRef}>
                      <QRCodeLib.QRCodeSVG
                        value={qrValue}
                        size={256}
                        level="H"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    </div>
                  </div>
                  {/* Link Display */}
                  <div className="space-y-2">
                    <Label>Generated Link</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                  {/* Download Button */}
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="w-full"
                  >
                    <Download size={18} className="mr-2" />
                    Download QR Code
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* Scan Mode */}
          {mode === 'scan' && (
            <div className="text-center py-8 space-y-4">
              <Smartphone size={48} className="mx-auto text-gray-400" />
              <p className="text-gray-600">
                Scanning feature coming soon!
              </p>
              <p className="text-sm text-gray-500">
                Use your phone camera or a QR code scanner app to scan codes.
              </p>
            </div>
          )}
          {/* Close Button */}
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  </DefaultLayout>
  );
};

export default QRCodeGenerator;
