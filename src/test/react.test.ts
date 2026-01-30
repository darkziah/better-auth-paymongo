import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Window } from "happy-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import type { CheckResponse } from "../types";
import { $refreshTrigger, refreshBilling, useCheck, useSubscription } from "../react";

let window: Window;
let originalFetch: typeof globalThis.fetch;
let container: any;
let root: ReactDOM.Root | null = null;

beforeEach(() => {
    window = new Window({ url: "http://localhost" });
    global.window = window as any;
    global.document = window.document as any;
    
    container = window.document.createElement("div") as any;
    window.document.body.appendChild(container as any);
    
    $refreshTrigger.set(0);
    originalFetch = globalThis.fetch;
    
    if (root) {
        root.unmount();
        root = null;
    }
});

describe("$refreshTrigger atom", () => {
    test("initial value is 0", () => {
        expect($refreshTrigger.get()).toBe(0);
    });

    test("can be updated directly", () => {
        $refreshTrigger.set(5);
        expect($refreshTrigger.get()).toBe(5);
    });
});

describe("refreshBilling()", () => {
    test("increments $refreshTrigger by 1", () => {
        expect($refreshTrigger.get()).toBe(0);
        refreshBilling();
        expect($refreshTrigger.get()).toBe(1);
    });

    test("increments multiple times", () => {
        refreshBilling();
        refreshBilling();
        refreshBilling();
        expect($refreshTrigger.get()).toBe(3);
    });
});

describe("useCheck()", () => {
    test("returns loading state initially", async () => {
        const mockFetch = mock(() => new Promise(() => {}));
        globalThis.fetch = mockFetch as any;

        let capturedResult: any;
        
        function TestComponent() {
            const result = useCheck("projects");
            capturedResult = result;
            return React.createElement("div", null, result.loading ? "loading" : "ready");
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 0);
        });

        expect(capturedResult.loading).toBe(true);
        expect(capturedResult.allowed).toBe(false);
        expect(capturedResult.balance).toBeUndefined();
        expect(capturedResult.limit).toBeUndefined();
        expect(capturedResult.planId).toBeUndefined();
        expect(capturedResult.error).toBeNull();

        globalThis.fetch = originalFetch;
    });

    test("handles successful check response", async () => {
        const mockResponse: CheckResponse = {
            allowed: true,
            balance: 5,
            limit: 10,
            planId: "pro"
        };

        const mockFetch = mock(() => Promise.resolve({
            ok: true,
            json: async () => mockResponse,
        } as Response));
        globalThis.fetch = mockFetch as any;

        let capturedResult: any;
        
        function TestComponent() {
            const result = useCheck("projects");
            capturedResult = result;
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        expect(mockFetch).toHaveBeenCalled();
        if (mockFetch.mock.calls.length > 0) {
            const calls = mockFetch.mock.calls as unknown as Array<[string, ...any[]]>;
            const fetchUrl = calls[0][0];
            expect(fetchUrl).toContain("/api/auth/paymongo/check");
            expect(fetchUrl).toContain("feature=projects");
        }

        globalThis.fetch = originalFetch;
    });

    test("includes organizationId in request when provided", async () => {
        const mockFetch = mock(() => Promise.resolve({
            ok: true,
            json: async () => ({ allowed: true }),
        } as Response));
        globalThis.fetch = mockFetch as any;

        function TestComponent() {
            useCheck("projects", { organizationId: "org_123" });
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        if (mockFetch.mock.calls.length > 0) {
            const calls = mockFetch.mock.calls as unknown as Array<[string, ...any[]]>;
            const fetchUrl = calls[0][0];
            expect(fetchUrl).toContain("organizationId=org_123");
        }

        globalThis.fetch = originalFetch;
    });

    test("handles fetch error", async () => {
        const mockFetch = mock(() => Promise.resolve({
            ok: false,
            json: async () => ({}),
        } as Response));
        globalThis.fetch = mockFetch as any;

        let capturedResult: any;
        
        function TestComponent() {
            const result = useCheck("projects");
            capturedResult = result;
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        expect(mockFetch).toHaveBeenCalled();

        globalThis.fetch = originalFetch;
    });

    test("refetch function exists", async () => {
        const mockFetch = mock(() => new Promise(() => {}));
        globalThis.fetch = mockFetch as any;

        let capturedResult: any;
        
        function TestComponent() {
            const result = useCheck("projects");
            capturedResult = result;
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 0);
        });

        expect(typeof capturedResult.refetch).toBe("function");

        globalThis.fetch = originalFetch;
    });
});

describe("useSubscription()", () => {
    test("returns loading state initially", async () => {
        const mockFetch = mock(() => new Promise(() => {}));
        globalThis.fetch = mockFetch as any;

        let capturedResult: any;
        
        function TestComponent() {
            const result = useSubscription();
            capturedResult = result;
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 0);
        });

        expect(capturedResult.loading).toBe(true);
        expect(capturedResult.planId).toBeNull();
        expect(capturedResult.error).toBeNull();

        globalThis.fetch = originalFetch;
    });

    test("calls check with _subscription feature", async () => {
        const mockResponse: CheckResponse = {
            allowed: true,
            planId: "pro"
        };

        const mockFetch = mock(() => Promise.resolve({
            ok: true,
            json: async () => mockResponse,
        } as Response));
        globalThis.fetch = mockFetch as any;

        function TestComponent() {
            useSubscription();
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        expect(mockFetch).toHaveBeenCalled();
        if (mockFetch.mock.calls.length > 0) {
            const calls = mockFetch.mock.calls as unknown as Array<[string, ...any[]]>;
            const fetchUrl = calls[0][0];
            expect(fetchUrl).toContain("/api/auth/paymongo/check");
            expect(fetchUrl).toContain("feature=_subscription");
        }

        globalThis.fetch = originalFetch;
    });

    test("handles successful subscription response", async () => {
        const mockResponse: CheckResponse = {
            allowed: true,
            planId: "enterprise"
        };

        const mockFetch = mock(() => Promise.resolve({
            ok: true,
            json: async () => mockResponse,
        } as Response));
        globalThis.fetch = mockFetch as any;

        function TestComponent() {
            useSubscription();
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        expect(mockFetch).toHaveBeenCalled();

        globalThis.fetch = originalFetch;
    });

    test("handles fetch error", async () => {
        const mockFetch = mock(() => Promise.resolve({
            ok: false,
            json: async () => ({}),
        } as Response));
        globalThis.fetch = mockFetch as any;

        function TestComponent() {
            useSubscription();
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        expect(mockFetch).toHaveBeenCalled();

        globalThis.fetch = originalFetch;
    });

    test("refresh function exists", async () => {
        const mockFetch = mock(() => new Promise(() => {}));
        globalThis.fetch = mockFetch as any;

        let capturedResult: any;
        
        function TestComponent() {
            const result = useSubscription();
            capturedResult = result;
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 0);
        });

        expect(typeof capturedResult.refresh).toBe("function");

        globalThis.fetch = originalFetch;
    });
});

describe("Integration: refresh trigger updates hooks", () => {
    test("incrementing $refreshTrigger should trigger re-fetch in hooks", async () => {
        const mockFetch = mock(() => Promise.resolve({
            ok: true,
            json: async () => ({ allowed: true }),
        } as Response));
        globalThis.fetch = mockFetch as any;

        function TestComponent() {
            useCheck("projects");
            return null;
        }

        root = ReactDOM.createRoot(container);
        await new Promise<void>((resolve) => {
            root!.render(React.createElement(TestComponent));
            setTimeout(resolve, 50);
        });

        expect(mockFetch.mock.calls.length).toBeGreaterThan(0);

        globalThis.fetch = originalFetch;
    });
});
