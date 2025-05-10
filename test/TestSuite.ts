export class TestSuite {
	tests: Test[];

	constructor(tests: Test[]) {
		this.tests = tests;
	}

	run() {
		let successCount = 0;
		for (const test of this.tests) {
			console.log(`Running test ${test.name}...`);
			try {
				test.run();
				successCount++;
			} catch(exception) {
				console.error(exception);
			}
		}
		console.log(`\nSuccessfully ran ${successCount} / ${this.tests.length} tests.\n`);
	}
}

export class Test {
	name: string;
	test: () => void;

	constructor(name: string, test: () => void) {
		this.name = name;
		this.test = test;
	}

	run() {
		this.test();
	}
}

export function assert(value: boolean) {
	if (!value)
		throw new Error(`Fail: ${String(value)}`);
}

export function assertEquals(value: unknown, expected: unknown) {
	if (value !== expected)
		throw new Error(`Fail: Expected ${String(expected)}, was ${String(value)}`);
}

export function assertArrayEquals(array: Array<unknown>, expectedArray: Array<unknown>) {
	assertEquals(array.length, expectedArray.length);
	for (let i = 0; i < expectedArray.length; i++) {
		assertEquals(array[i], expectedArray[i]);
	}
}

export function assertArrayDeepEquals(array: Array<unknown>, expectedArray: Array<unknown>) {
	assertEquals(array.length, expectedArray.length);
	for (let i = 0; i < expectedArray.length; i++) {
		const value = array[i], expected = expectedArray[i];
		if (value instanceof Array && expected instanceof Array) {
			assertArrayDeepEquals(value, expected);
		} else {
			assertEquals(value, expected);
		}
	}
}
