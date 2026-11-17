// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const { webcrypto } = require("crypto");

if (typeof window.crypto?.getRandomValues !== "function") {
    Object.defineProperty(window, "crypto", {
        configurable: true,
        value: webcrypto
    });
}

