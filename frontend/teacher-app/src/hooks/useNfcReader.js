import { useCallback, useEffect, useRef, useState } from 'react';

export default function useNfcReader(onTag) {
  const onTagRef = useRef(onTag);
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);
  const webNfcAbortRef = useRef(null);
  const [connection, setConnection] = useState('Use the scan box or connect a reader');

  useEffect(() => {
    onTagRef.current = onTag;
  }, [onTag]);

  const readSerialPort = useCallback(async (port) => {
    const decoder = new TextDecoder();
    let buffered = '';

    try {
      const reader = port.readable.getReader();
      serialReaderRef.current = reader;

      while (serialPortRef.current === port) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        const lines = buffered.split(/\r?\n/);
        buffered = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) await onTagRef.current(line.trim());
        }
      }
    } catch (error) {
      if (serialPortRef.current === port) {
        setConnection(`Reader disconnected: ${error.message}`);
      }
    } finally {
      serialReaderRef.current?.releaseLock();
      serialReaderRef.current = null;
    }
  }, []);

  const connectSerial = useCallback(async () => {
    if (!('serial' in navigator)) {
      throw new Error('This browser does not support USB serial readers');
    }

    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    serialPortRef.current = port;
    setConnection('USB serial reader connected');
    void readSerialPort(port);
  }, [readSerialPort]);

  const connectWebNfc = useCallback(async () => {
    if (!('NDEFReader' in window)) {
      throw new Error('Web NFC is not available in this browser');
    }

    webNfcAbortRef.current?.abort();
    const controller = new AbortController();
    const reader = new window.NDEFReader();
    webNfcAbortRef.current = controller;

    await reader.scan({ signal: controller.signal });
    reader.addEventListener('reading', (event) => {
      if (event.serialNumber) void onTagRef.current(event.serialNumber);
    });
    setConnection('Web NFC reader connected');
  }, []);

  useEffect(() => () => {
    const port = serialPortRef.current;
    webNfcAbortRef.current?.abort();
    serialPortRef.current = null;
    void (async () => {
      try {
        await serialReaderRef.current?.cancel();
        await port?.close();
      } catch {
        // The browser has already released or disconnected this reader.
      }
    })();
  }, []);

  return {
    connection,
    connectSerial,
    connectWebNfc,
    serialSupported: 'serial' in navigator,
    webNfcSupported: 'NDEFReader' in window
  };
}
