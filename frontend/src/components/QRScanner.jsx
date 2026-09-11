import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

let uidCounter = 0;

// A self-contained "enchanted mirror" QR scanner. Renders a start button;
// on click it tries the camera, decodes exactly one code, then stops itself.
// If the camera is unavailable/denied, it shows a message and never throws —
// manual entry (rendered alongside this by the parent) always still works.
export default function QRScanner({ label = 'Open Enchanted Mirror', onDecode }) {
  const [divId] = useState(() => `reader-${++uidCounter}`);
  const [status, setStatus] = useState('Tap to scan a QR tag.');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, []);

  function stop() {
    if (scannerRef.current) {
      const s = scannerRef.current;
      scannerRef.current = null;
      s.stop().then(() => s.clear()).catch(() => {});
    }
    setScanning(false);
  }

  async function start() {
    stop();
    setStatus('🕯️ Awakening the enchanted mirror…');
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          setStatus('✨ Scanned: ' + decodedText);
          onDecode(decodedText);
          stop();
        },
        () => {} // per-frame no-QR noise, ignored
      );
      setStatus('👁️ Point the mirror at a QR tag…');
    } catch (err) {
      setStatus('⚠️ The mirror would not open (camera unavailable). Use manual entry below instead.');
      setScanning(false);
      console.warn('camera error', err);
    }
  }

  return (
    <>
      <div id={divId} style={{ width: '100%', maxWidth: 320, margin: '0 auto', borderRadius: 6, overflow: 'hidden' }}></div>
      <div className="scan-result">{status}</div>
      <button type="button" className="btn small" onClick={start} disabled={scanning}>
        🪞 {label}
      </button>
    </>
  );
}
