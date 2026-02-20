'use strict';

// Jest-compatible CJS stub for qrcode
const toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode');
const toString = jest.fn().mockResolvedValue('<svg>mockQR</svg>');

module.exports = {
  toDataURL,
  toString,
};
