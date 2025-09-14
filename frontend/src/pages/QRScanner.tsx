import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [autoStarted, setAutoStarted] = useState(false);
  const autoStartRef = useRef(false); // Use ref to prevent double execution

  // Auto-start scanner when component mounts
  useEffect(() => {
    if (!autoStartRef.current && !autoStarted && !isScanning && !scannerRef.current) {
      autoStartRef.current = true; // Immediately mark as started to prevent double execution

      const autoStart = async () => {
        // Small delay to ensure component is fully mounted
        await new Promise(resolve => setTimeout(resolve, 500));
        await startScanner();
        setAutoStarted(true);

        // Auto-scroll to show the full scanner view
        setTimeout(() => {
          const scannerElement = document.getElementById('qr-reader');
          if (scannerElement) {
            scannerElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 100); // Wait for scanner to initialize
      };
      autoStart();
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Cleanup scanner when component unmounts
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(() => {
            // Ignore cleanup errors
          });
        } catch (error) {
          console.log('Scanner cleanup error:', error);
        }
      }
    };
  }, []);

  const startScanner = async () => {
    setError('');
    setIsScanning(true);
    setScanResult('');

    // Show requesting access message
    setError('📱 Requesting camera access... Please allow camera permissions when prompted.');

    // Wait for the DOM element to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const scanner = new Html5Qrcode('qr-reader');

      // Camera configuration
      const cameraConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Try to use environment facing camera first
      try {
        await scanner.start(
          { facingMode: "environment" },
          cameraConfig,
          (decodedText: string) => {
            // Success callback
            handleScanSuccess(decodedText);
            scanner.stop().then(() => {
              scanner.clear();
              setIsScanning(false);
            }).catch(() => {
              setIsScanning(false);
            });
          },
          () => {
            // Error callback - ignore frequent scanning errors
          }
        );
      } catch (envError) {
        console.log('Environment camera failed, trying camera list...', envError);

        // Fallback to camera selection by ID
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          throw new Error('No cameras found. Please check camera permissions.');
        }

        let cameraId = cameras[0].id; // Default to first camera

        // Look for rear camera (environment facing)
        const rearCamera = cameras.find(camera => {
          if (!camera.label) return false;
          const label = camera.label.toLowerCase();
          return (
            label.includes('back') ||
            label.includes('rear') ||
            label.includes('environment') ||
            label.includes('facing back')
          );
        });

        if (rearCamera) {
          cameraId = rearCamera.id;
          console.log('Selected rear camera:', rearCamera.label);
        } else {
          console.log('Using default camera:', cameras[0].label || 'Unknown camera');
        }

        // Start scanning with selected camera ID
        await scanner.start(
          cameraId,
          cameraConfig,
          (decodedText: string) => {
            // Success callback
            handleScanSuccess(decodedText);
            scanner.stop().then(() => {
              scanner.clear();
              setIsScanning(false);
            }).catch(() => {
              setIsScanning(false);
            });
          },
          () => {
            // Error callback - ignore frequent scanning errors
          }
        );
      }

      scannerRef.current = scanner;
      setError(''); // Clear requesting access message

    } catch (err: any) {
      console.error('Scanner error:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error';

      if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed') || errorMessage.includes('permission')) {
        setError('❌ Camera permission denied. Please allow camera access and try again.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('no camera')) {
        setError('❌ No camera found. Please check if your device has a camera.');
      } else {
        setError(`Failed to start scanner: ${errorMessage}`);
      }
      setIsScanning(false);
    }
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

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.log('Error stopping scanner:', error);
        scannerRef.current = null;
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
              <div className="mt-4">
                <button
                  onClick={stopScanner}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700"
                >
                  Stop Scanner
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