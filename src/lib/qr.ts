import QRCode from 'qrcode';

export interface QROptions {
  url: string;
  size?: number;
  darkColor?: string;
  lightColor?: string;
}

export function getMenuUrl(slug = 'prime-cafe'): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/menu/${slug}`;
  }
  return `https://primecafe.et/menu/${slug}`;
}

/**
 * Generates a high-resolution QR code data URL (min 1024x1024px)
 * Encodes strictly the public menu URL, never menu data.
 */
export async function generateQRCodeDataUrl(options: QROptions): Promise<string> {
  const {
    url,
    size = 1024,
    darkColor = '#2B1A12', // Deep Buna roasted brown
    lightColor = '#EFEBE9', // Warm cream background
  } = options;

  return QRCode.toDataURL(url, {
    width: size,
    margin: 3,
    errorCorrectionLevel: 'M',
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Downloads the high-resolution QR code as a PNG file.
 */
export async function downloadQRPNG(
  slug = 'prime-cafe',
  cafeName = 'Prime Cafe',
  darkColor = '#2B1A12',
  lightColor = '#EFEBE9'
): Promise<void> {
  const url = getMenuUrl(slug);
  const dataUrl = await generateQRCodeDataUrl({
    url,
    size: 1200,
    darkColor,
    lightColor,
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${slug}-qr-menu-1200px.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
