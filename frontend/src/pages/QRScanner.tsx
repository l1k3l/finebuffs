import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState('');

  useEffect(() => {
    // Cleanup scanner when component unmounts
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.clear();
          }
        } catch (error) {
          console.log('Scanner cleanup error:', error);
        }
      }
    };
  }, []);

  const startScanner = () => {
    setError('');
    setIsScanning(true);

    // Wait for DOM element to be available
    setTimeout(() => {
      try {
        const element = document.getElementById('qr-reader');
        if (!element) {
          setError('QR scanner element not found. Please try again.');
          setIsScanning(false);
          return;
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          config,
          false // verbose logging
        );

        scanner.render(
          (decodedText: string) => {
            // Success callback
            handleScanSuccess(decodedText);
            try {
              scanner.clear();
            } catch (e) {
              console.log('Error clearing scanner:', e);
            }
            setIsScanning(false);
          },
          (errorMessage: string) => {
            // Error callback - we can ignore these as they happen frequently during scanning
            // console.log('Scan error:', errorMessage);
          }
        );

        scannerRef.current = scanner;
      } catch (err: any) {
        setError(`Failed to start scanner: ${err.message}`);
        setIsScanning(false);
      }
    }, 100); // Small delay to ensure DOM is ready
  };

  const handleScanSuccess = (decodedText: string) => {
    setScanResult(decodedText);

    // Check if the scanned text is a URL to a product page
    try {
      const url = new URL(decodedText);
      const pathname = url.pathname;

      // Look for product ID in the URL (e.g., /product/123)
      const productMatch = pathname.match(/\/product\/([a-f0-9-]+)/);
      if (productMatch) {
        const productId = productMatch[1];
        // Navigate to the product detail page
        navigate(`/product/${productId}`);
        return;
      }
    } catch (error) {
      // Not a valid URL, treat as product ID or SKU
    }

    // If it's not a URL, try to use it as a product ID or SKU
    // For now, just show the result and let user decide
    setError(`Scanned: ${decodedText}. This doesn't appear to be a product QR code from this system.`);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.log('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
    setError('');
  };

  const restartScanner = () => {
    stopScanner();
    setTimeout(() => {
      startScanner();
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="mt-2 text-sm text-gray-600">
          Scan a product QR code to quickly access and update inventory
        </p>
      </div>

      {/* Scanner Container */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          {isScanning ? (
            <div>
              <div className="mb-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  📱 Scanner Active
                </div>
              </div>
              <div id="qr-reader" className="mx-auto"></div>
              <div className="mt-4 space-x-3">
                <button
                  onClick={stopScanner}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Stop Scanner
                </button>
                <button
                  onClick={restartScanner}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-indigo-700"
                >
                  Restart Scanner
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Scan</h3>
              <p className="text-gray-500 mb-6">
                Click the button below to start scanning QR codes
              </p>
              <button
                onClick={startScanner}
                className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-600 hover:bg-indigo-700"
              >
                Start Scanner
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              ⚠️
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Result</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-sm break-all">
            {scanResult}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📋 How to Use</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="font-medium mr-2">1.</span>
            <span>Click "Start Scanner" to activate your camera</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">2.</span>
            <span>Point your camera at a product QR code</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">3.</span>
            <span>The scanner will automatically detect and process the code</span>
          </div>
          <div className="flex items-start">
            <span className="font-medium mr-2">4.</span>
            <span>You'll be redirected to the product page for stock updates</span>
          </div>
        </div>
      </div>

      {/* Browser Compatibility Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            ℹ️
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This scanner works best in Safari on iOS (15.1+) and Chrome/Edge on desktop.
              Make sure to grant camera permissions when prompted. For optimal performance, use this feature
              in regular Safari rather than a PWA/home screen app.
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Options */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Alternative Options</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
            <div>
              <h4 className="font-medium text-gray-900">Use iPhone Camera App</h4>
              <p className="text-sm text-gray-500">Open iPhone Camera and point at QR code</p>
            </div>
            <span className="text-2xl">📷</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
            <div>
              <h4 className="font-medium text-gray-900">Browse Products</h4>
              <p className="text-sm text-gray-500">Manually find and update products</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="text-brand-600 hover:text-indigo-500 text-sm font-medium"
            >
              View Products →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;