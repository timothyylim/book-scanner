import { BarcodeDetector } from "barcode-detector/pure";

export type ScanCallback = (rawValue: string) => void;

export class BarcodeScanner {
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private detector: BarcodeDetector | null = null;
  private animFrameId: number | null = null;
  private scanning = false;

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  async start(onDetected: ScanCallback): Promise<void> {
    this.detector = new BarcodeDetector({ formats: ["ean_13"] });

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    this.video.srcObject = this.stream;
    await this.video.play();
    this.scanning = true;
    this.scanLoop(onDetected);
  }

  private async scanLoop(onDetected: ScanCallback): Promise<void> {
    if (!this.scanning || !this.detector) return;

    try {
      const barcodes = await this.detector.detect(this.video);
      for (const barcode of barcodes) {
        if (barcode.rawValue) {
          this.scanning = false;
          onDetected(barcode.rawValue);
          return;
        }
      }
    } catch {
      // Detection can fail on individual frames — ignore and retry
    }

    this.animFrameId = requestAnimationFrame(() => this.scanLoop(onDetected));
  }

  stop(): void {
    this.scanning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
  }

  isScanning(): boolean {
    return this.scanning;
  }
}
