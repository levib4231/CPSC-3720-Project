// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock scrollIntoView for testing (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Robust AudioContext + SpeechRecognition mocks for Jest/jsdom

class MockAudioParam {
  constructor(value = 0) {
    this.value = value;
  }
  setValueAtTime() {}
  linearRampToValueAtTime() {}
}

class MockOscillator {
  constructor() {
    this.type = "sine";
    this.frequency = new MockAudioParam(440);
  }
  connect() {}
  start() {}
  stop() {}
}

class MockGain {
  constructor() {
    this.gain = new MockAudioParam(1);
  }
  connect() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return new MockOscillator();
  }
  createGain() {
    return new MockGain();
  }
  createBufferSource() {
    return { connect: () => {}, start: () => {}, stop: () => {} };
  }
  // match real AudioContext.close() which returns a Promise
  close() {
    return Promise.resolve();
  }
}

window.AudioContext = window.AudioContext || MockAudioContext;
window.webkitAudioContext = window.webkitAudioContext || MockAudioContext;

// SpeechRecognition mock producing array-like results and resultIndex
class MockRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = "en-US";
    this.onstart = null;
    this.onresult = null;
    this.onspeechend = null;
    this.onend = null;
    this.onerror = null;
    this._stopped = false;
  }

  start() {
    if (typeof this.onstart === "function") this.onstart();

    setTimeout(() => {
      if (this._stopped) return;
      if (typeof this.onresult === "function") {
        const transcript = "Book two tickets for Jazz Night";
        const alt = { transcript, confidence: 0.95 };
        const result0 = Object.assign([alt], { length: 1, isFinal: true });
        const results = Object.assign([result0], { length: 1 });
        const event = { resultIndex: 0, results };
        this.onresult(event);
      }
      if (typeof this.onspeechend === "function") this.onspeechend();
      if (typeof this.onend === "function") this.onend();
    }, 20);
  }

  stop() {
    this._stopped = true;
    if (typeof this.onend === "function") this.onend();
  }

  abort() {
    this._stopped = true;
    if (typeof this.onend === "function") this.onend();
  }
}

window.SpeechRecognition = window.SpeechRecognition || MockRecognition;
window.webkitSpeechRecognition = window.webkitSpeechRecognition || MockRecognition;

// small DOM / perf fallbacks
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};
if (!window.performance) window.performance = { now: () => Date.now() };
