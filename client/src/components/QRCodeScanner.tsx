import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, Copy, QrCode, Info } from 'lucide-react';
import * as QRCodeLib from 'qrcode.react';
import { DefaultLayout } from './layout/DefaultLayout';

interface QRCodeGeneratorProps {
  onClose?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ onClose }) => {
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
      <Card className="bg-yendine-green/5 border-yendine-orange/20">
        <CardHeader className="bg-yendine-green rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-yellow-100">
            <QrCode size={24} />
            Generate QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="bg-yendine-green/40 border-2 border-gray-400 rounded-lg p-4">
            <p className="text-sm text-gray-300 font-medium">
              <Info/> This QR code will redirect users to the order page after they login.
            </p>
          </div>
          <Button
            onClick={generateQRCode}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold border-2 border-green-600 hover:border-green-700 transition-all"
            size="lg"
          >
            Generate QR Code
          </Button>
          {qrValue && (
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center p-6 bg-yendine-green/40 rounded-lg border-2 border-gray-400">
                <div ref={qrRef} className="bg-white p-4 rounded-lg">
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
                <Label className="text-yellow-100 font-bold">Generated Link</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="text-xs bg-yendine-green/40 border-2 border-gray-400 text-black"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="border-2 bg-quicktap-green border-gray-400 text-gray-600 hover:bg-gray-700 hover:border-gray-300 transition-all font-bold"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
              {/* Download Button */}
              <Button
                onClick={downloadQRCode}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold border-2 border-green-600 hover:border-green-700 transition-all"
              >
                <Download size={18} className="mr-2" />
                Download QR Code
              </Button>
            </div>
          )}
          {/* Close Button */}
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-2 border-gray-400 text-gray-300 hover:bg-gray-700 hover:border-gray-300 font-bold transition-all"
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
