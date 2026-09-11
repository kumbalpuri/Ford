import QRCode from 'qrcode';
import { MotherBox } from '../types';

export interface QROptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate a high-resolution QR code data URL (PNG)
 */
export async function generateQRDataUrl(text: string, options?: QROptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width ?? 280,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.color?.dark ?? '#0f172a',
        light: options?.color?.light ?? '#ffffff'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Structured payload for individual Finished Good serialized item QR
 */
export interface SerialQRPayloadParams {
  serialNumber: string;
  partNumber: string;
  productName: string;
  productionDate: string;
  shift?: string;
  boxId?: string;
}

export function generateSerialQRPayload(params: SerialQRPayloadParams): string {
  return JSON.stringify({
    type: 'FG_UNIT',
    sn: params.serialNumber,
    pn: params.partNumber,
    name: params.productName,
    date: params.productionDate,
    shift: params.shift || 'Shift A',
    box: params.boxId || null,
    std: 'IATF-16949'
  });
}

/**
 * Structured payload for Box-Level Mother QR Code
 */
export function generateMotherBoxQRPayload(box: MotherBox): string {
  return JSON.stringify({
    type: 'MOTHER_BOX',
    boxId: box.id,
    pn: box.partNumber,
    name: box.productName,
    cap: box.boxCapacity,
    qty: box.itemSerials.length,
    date: box.productionDate,
    packedAt: box.packedAt,
    packedBy: box.packedBy,
    serials: box.itemSerials,
    std: 'IATF-16949'
  });
}

/**
 * Printable data model for an individual unit serial label sticker
 */
export interface UnitSerialLabelData {
  index: number;
  serialNumber: string;
  partNumber: string;
  productName: string;
  productionDate: string;
  productionShift: string;
  boxId?: string;
  qrDataUrl: string;
}

/**
 * Complete Printable Package containing both Mother QR labels and all unique serial ID labels
 */
export interface MotherBoxLabelPackage {
  box: MotherBox;
  motherQrDataUrl: string;
  unitLabels: UnitSerialLabelData[];
  generatedAt: string;
}

/**
 * Async generator that creates QR codes for the Mother Box AND all enclosed unique serial IDs
 */
export async function generateCompleteBoxLabelPackage(
  box: MotherBox,
  shift: string = 'Shift A'
): Promise<MotherBoxLabelPackage> {
  const motherPayload = generateMotherBoxQRPayload(box);
  const motherQrDataUrl = await generateQRDataUrl(motherPayload, {
    width: 320,
    errorCorrectionLevel: 'M'
  });

  // Generate QR data URL for each unique serial ID concurrently
  const unitLabels = await Promise.all(
    box.itemSerials.map(async (serial, idx) => {
      const serialPayload = generateSerialQRPayload({
        serialNumber: serial,
        partNumber: box.partNumber,
        productName: box.productName,
        productionDate: box.productionDate,
        shift,
        boxId: box.id
      });

      const qrDataUrl = await generateQRDataUrl(serialPayload, {
        width: 180,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      return {
        index: idx + 1,
        serialNumber: serial,
        partNumber: box.partNumber,
        productName: box.productName,
        productionDate: box.productionDate,
        productionShift: shift,
        boxId: box.id,
        qrDataUrl
      };
    })
  );

  return {
    box,
    motherQrDataUrl,
    unitLabels,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate a sequence of realistic automotive unique serial IDs
 */
export function generateUniqueSerialBatch(
  partNumber: string,
  dateStr: string,
  count: number,
  startSeq?: number
): string[] {
  const cleanDate = dateStr.replace(/-/g, '');
  const prefix = partNumber.split('-')[1] || 'PART';
  const baseSeq = startSeq ?? Math.floor(100 + Math.random() * 800);

  return Array.from({ length: count }, (_, idx) => {
    const seqNum = String(baseSeq + idx).padStart(3, '0');
    return `FG-${prefix}-${cleanDate}-${seqNum}`;
  });
}

/**
 * Generate a single realistic automotive FG serial
 */
export function generateRealisticFGSerial(partNumber: string, dateStr: string): string {
  const [serial] = generateUniqueSerialBatch(partNumber, dateStr, 1);
  return serial;
}

/**
 * Download a QR Data URL as a PNG file
 */
export function downloadDataUrlAsFile(dataUrl: string, filename: string) {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Play standard factory barcode scanner audio feedback
 */
export function playScanBeep(isSuccess = true) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Audio might be muted or restricted
  }
}

/**
 * Play a distinctive 3-tone chime when box packing capacity is reached
 */
export function playCapacityReachedChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Ascending celebratory industrial chime: C5 (523Hz), E5 (659Hz), G5 (784Hz)
    playTone(523.25, 0.0, 0.14);
    playTone(659.25, 0.12, 0.16);
    playTone(783.99, 0.26, 0.3);
  } catch {
    // Ignore audio errors
  }
}
