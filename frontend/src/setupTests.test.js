import { act } from "@testing-library/react";

describe("setupTests.js environment mocks", () => {
    test("AudioContext and related oscillator/gain mocks exist and provide expected API", () => {
        expect(typeof window.AudioContext).toBe("function");
        const ac = new window.AudioContext();
        expect(typeof ac.currentTime).toBe("number");
        expect(ac.destination).toBeDefined();

        const osc = ac.createOscillator();
        expect(typeof osc.frequency.setValueAtTime).toBe("function");
        expect(typeof osc.start).toBe("function");
        expect(typeof osc.stop).toBe("function");

        const gain = ac.createGain();
        expect(typeof gain.gain.setValueAtTime).toBe("function");
        expect(typeof gain.connect).toBe("function");
    });

    test("SpeechRecognition mock delivers result and end", () => {
        jest.useFakeTimers();
        const onstart = jest.fn();
        const onresult = jest.fn();
        const onspeechend = jest.fn();
        const onend = jest.fn();

        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        expect(typeof Recognition).toBe("function");

        const r = new Recognition();
        r.onstart = onstart;
        r.onresult = onresult;
        r.onspeechend = onspeechend;
        r.onend = onend;

        act(() => r.start());
        // advance the timer used by the mock to simulate async result
        jest.advanceTimersByTime(50);

        expect(onstart).toHaveBeenCalled();
        expect(onresult).toHaveBeenCalled();
        const resultArg = onresult.mock.calls[0][0];
        expect(resultArg.results[0][0].transcript).toMatch(/Jazz Night|Book two tickets|Hello/i);
        expect(onspeechend).toHaveBeenCalled();
        expect(onend).toHaveBeenCalled();

        jest.useRealTimers();
    });

    test("other small env mocks", () => {
        expect(typeof Element.prototype.scrollIntoView).toBe("function");
        expect(typeof window.performance.now).toBe("function");
    });
});
// Additional tests appended to setupTests.test.js

test("AudioContext.close resolves and createBufferSource API exists", async () => {
    const ctx = new window.AudioContext();
    // close should return a Promise that resolves
    await expect(ctx.close()).resolves.toBeUndefined();

    const src = ctx.createBufferSource();
    expect(src).toBeDefined();
    expect(typeof src.connect).toBe("function");
    expect(typeof src.start).toBe("function");
    expect(typeof src.stop).toBe("function");

    // safe-call the methods to ensure no throw
    expect(() => { src.connect(); src.start(); src.stop(); }).not.toThrow();
});

test("MockAudioParam oscillator/gain methods callable", () => {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    expect(osc).toBeDefined();
    expect(gain).toBeDefined();

    // frequency and gain should expose setValueAtTime and linearRampToValueAtTime where applicable
    expect(typeof osc.frequency.setValueAtTime).toBe("function");
    expect(typeof osc.frequency.linearRampToValueAtTime).toBe("function");
    expect(typeof gain.gain.setValueAtTime).toBe("function");

    // calling methods should not throw
    expect(() => {
        osc.frequency.setValueAtTime(440, 0);
        osc.frequency.linearRampToValueAtTime(220, 1);
        gain.gain.setValueAtTime(0.5, 0);
    }).not.toThrow();
});

test("MockRecognition lifecycle: start triggers onstart/onresult/onspeechend/onend; stop/abort trigger onend", () => {
    jest.useFakeTimers();

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    expect(typeof Recognition).toBe("function");

    const r = new Recognition();
    const onstart = jest.fn();
    const onresult = jest.fn();
    const onspeechend = jest.fn();
    const onend = jest.fn();

    r.onstart = onstart;
    r.onresult = onresult;
    r.onspeechend = onspeechend;
    r.onend = onend;

    act(() => r.start());
    // start should have synchronously invoked onstart
    expect(onstart).toHaveBeenCalled();

    // advance timers to allow async result/end callbacks from the mock
    act(() => jest.advanceTimersByTime(50));

    expect(onresult).toHaveBeenCalled();
    expect(onspeechend).toHaveBeenCalled();
    expect(onend).toHaveBeenCalled();

    // Test stop triggers onend synchronously for a fresh recognition
    const r2 = new Recognition();
    const onend2 = jest.fn();
    r2.onend = onend2;
    act(() => r2.stop());
    expect(onend2).toHaveBeenCalled();

    // Test abort triggers onend synchronously for a fresh recognition
    const r3 = new Recognition();
    const onend3 = jest.fn();
    r3.onend = onend3;
    act(() => r3.abort());
    expect(onend3).toHaveBeenCalled();

    jest.useRealTimers();
});

test("performance.now returns increasing numbers", () => {
    expect(typeof window.performance.now).toBe("function");
    const t1 = window.performance.now();
    const t2 = window.performance.now();
    expect(typeof t1).toBe("number");
    expect(typeof t2).toBe("number");
    expect(t2).toBeGreaterThanOrEqual(t1);
});

test("Element.prototype.scrollIntoView is callable and records calls", () => {
    // ensure it's a function
    expect(typeof Element.prototype.scrollIntoView).toBe("function");

    // If it's a jest mock, assert mock.calls works; otherwise call and ensure no throw
    const el = document.createElement("div");
    if (typeof Element.prototype.scrollIntoView.mock === "object") {
        el.scrollIntoView();
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
        Element.prototype.scrollIntoView.mockClear && Element.prototype.scrollIntoView.mockClear();
    } else {
        expect(() => el.scrollIntoView()).not.toThrow();
    }
});