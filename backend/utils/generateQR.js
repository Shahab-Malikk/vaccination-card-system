const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");

const generateQR = async (uuid) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  // Sign JWT token with UUID inside — hides actual ID
  const token = jwt.sign({ uid: uuid }, process.env.JWT_SECRET, {
    expiresIn: "10y",
  });

  // /verify route reveals nothing about the system
  const viewUrl = `${frontendUrl}/verify?token=${token}`;

  console.log("QR URL generated:", viewUrl);

  const qrDataUrl = await QRCode.toDataURL(viewUrl, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 200,
    margin: 2,
    color: {
      dark: "#1a1a2e",
      light: "#ffffff",
    },
  });

  return qrDataUrl;
};

module.exports = generateQR;
