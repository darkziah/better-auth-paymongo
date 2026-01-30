import { describe, it, expect } from "bun:test";
import { paymongoClient } from "../client";

describe("PayMongo Client Plugin", () => {
	// ============================================================
	// Factory Function Tests
	// ============================================================
	describe("paymongoClient() factory", () => {
		it("should return client plugin with id 'paymongo'", () => {
			const client = paymongoClient();
			expect(client.id).toBe("paymongo");
		});

		it("should have $InferServerPlugin property", () => {
			const client = paymongoClient();
			expect(client.$InferServerPlugin).toBeDefined();
			expect(typeof client.$InferServerPlugin).toBe("object");
		});

		it("should have getAtoms function", () => {
			const client = paymongoClient();
			expect(client.getAtoms).toBeDefined();
			expect(typeof client.getAtoms).toBe("function");
		});
	});

	// ============================================================
	// $subscriptionSignal Atom Tests
	// ============================================================
	describe("$subscriptionSignal atom", () => {
		it("should be accessible via getAtoms()", () => {
			const client = paymongoClient();
			const atoms = client.getAtoms();
			expect(atoms.$subscriptionSignal).toBeDefined();
		});

		it("should have initial value of false", () => {
			const client = paymongoClient();
			const atoms = client.getAtoms();
			expect(atoms.$subscriptionSignal.get()).toBe(false);
		});

		it("should allow setting value to true", () => {
			const client = paymongoClient();
			const atoms = client.getAtoms();
			atoms.$subscriptionSignal.set(true);
			expect(atoms.$subscriptionSignal.get()).toBe(true);
		});

		it("should allow toggling between true and false", () => {
			const client = paymongoClient();
			const atoms = client.getAtoms();
			
			atoms.$subscriptionSignal.set(true);
			expect(atoms.$subscriptionSignal.get()).toBe(true);
			
			atoms.$subscriptionSignal.set(false);
			expect(atoms.$subscriptionSignal.get()).toBe(false);
		});
	});

	// ============================================================
	// pathMethods Tests
	// ============================================================
	describe("pathMethods", () => {
		it("should define all 5 paymongo endpoints", () => {
			const client = paymongoClient();
			const paths = Object.keys(client.pathMethods);
			
			expect(paths.length).toBe(5);
			expect(paths).toContain("/paymongo/check");
			expect(paths).toContain("/paymongo/attach");
			expect(paths).toContain("/paymongo/track");
			expect(paths).toContain("/paymongo/verify");
			expect(paths).toContain("/paymongo/set-plan");
		});

		it("should use GET method for /paymongo/check", () => {
			const client = paymongoClient();
			expect(client.pathMethods["/paymongo/check"]).toBe("GET");
		});

		it("should use POST method for /paymongo/attach", () => {
			const client = paymongoClient();
			expect(client.pathMethods["/paymongo/attach"]).toBe("POST");
		});

		it("should use POST method for /paymongo/track", () => {
			const client = paymongoClient();
			expect(client.pathMethods["/paymongo/track"]).toBe("POST");
		});

		it("should use POST method for /paymongo/verify", () => {
			const client = paymongoClient();
			expect(client.pathMethods["/paymongo/verify"]).toBe("POST");
		});

		it("should use POST method for /paymongo/set-plan", () => {
			const client = paymongoClient();
			expect(client.pathMethods["/paymongo/set-plan"]).toBe("POST");
		});
	});

	// ============================================================
	// atomListeners Tests
	// ============================================================
	describe("atomListeners", () => {
		it("should have exactly one listener", () => {
			const client = paymongoClient();
			expect(client.atomListeners).toBeDefined();
			expect(client.atomListeners.length).toBe(1);
		});

		it("should have listener with matcher function", () => {
			const client = paymongoClient();
			const listener = client.atomListeners[0];
			
			expect(listener.matcher).toBeDefined();
			expect(typeof listener.matcher).toBe("function");
		});

		it("should have listener referencing $subscriptionSignal", () => {
			const client = paymongoClient();
			const listener = client.atomListeners[0];
			
			expect(listener.signal).toBe("$subscriptionSignal");
		});

		it("should match paths starting with /paymongo/", () => {
			const client = paymongoClient();
			const matcher = client.atomListeners[0].matcher;
			
			expect(matcher("/paymongo/check")).toBe(true);
			expect(matcher("/paymongo/attach")).toBe(true);
			expect(matcher("/paymongo/track")).toBe(true);
			expect(matcher("/paymongo/verify")).toBe(true);
			expect(matcher("/paymongo/set-plan")).toBe(true);
		});

		it("should not match non-paymongo paths", () => {
			const client = paymongoClient();
			const matcher = client.atomListeners[0].matcher;
			
			expect(matcher("/auth/signin")).toBe(false);
			expect(matcher("/api/users")).toBe(false);
			expect(matcher("/paymongocheck")).toBe(false); // Missing /
			expect(matcher("paymongo/check")).toBe(false); // Missing leading /
		});

		it("should match nested paymongo paths", () => {
			const client = paymongoClient();
			const matcher = client.atomListeners[0].matcher;
			
			expect(matcher("/paymongo/nested/path")).toBe(true);
			expect(matcher("/paymongo/v2/check")).toBe(true);
		});
	});
});
