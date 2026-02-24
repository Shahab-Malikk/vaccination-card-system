const QRCode = require("qrcode");

/**
 * Generate QR code as a Base64 data URL.
 * Encodes the public view URL with the record ID.
 *
 * @param {number|string} recordId - The unique database record ID
 * @returns {Promise<string>} - Base64 data URL (data:image/png;base64,...)
 */
const generateQR = async (recordId) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const viewUrl = `${frontendUrl}/view?id=${recordId}`;

  const qrDataUrl = await QRCode.toDataURL(viewUrl, {
    errorCorrectionLevel: "M", // Medium correction level
    type: "image/png",
    width: 200, // 200x200 pixels
    margin: 2, // Small quiet zone
    color: {
      dark: "#1a1a2e", // Dark navy dots
      light: "#ffffff", // White background
    },
  });

  return qrDataUrl;
};

module.exports = generateQR;
