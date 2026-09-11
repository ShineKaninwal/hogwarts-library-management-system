const QRCode = require('qrcode');

// Generates a PNG data URL for the given text payload (e.g. "BOOK:B0001").
async function generateQrDataUrl(text) {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 240,
    color: { dark: '#2b2015', light: '#f4e9cf' }
  });
}

module.exports = { generateQrDataUrl };
