import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#0B1E36', // Deep government navy QR dots
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Failed to generate QR Code data URL:', error);
    throw error;
  }
}

export async function generateQrBuffer(text: string): Promise<Buffer> {
  return await QRCode.toBuffer(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 200,
    color: {
      dark: '#0B1E36',
      light: '#FFFFFF'
    }
  });
}

