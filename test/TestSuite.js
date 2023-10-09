export class TestSuite {
	tests;

	constructor(tests) {
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
	name;
	test;

	constructor(name, test) {
		this.name = name;
		this.test = test;
	}

	run() {
		this.test();
	}
}

export function assert(value) {
	if (!value)
		throw new Error(`Fail: ${String(value)}`);
}

export function assertEquals(value, expected) {
	if (value !== expected)
		throw new Error(`Fail: Expected ${String(expected)}, was ${String(value)}`);
}

export function assertArrayEquals(array, expected) {
	assertEquals(array.length, expected.length);
	for (let i = 0; i < expected.length; i++) {
		assertEquals(array[i], expected[i]);
	}
}

export function assertArrayDeepEquals(array, expected) {
	assertEquals(array.length, expected.length);
	for (let i = 0; i < expected.length; i++) {
		if (array[i] instanceof Array && expected[i] instanceof Array) {
			assertArrayDeepEquals(array[i], expected[i]);
		} else {
			assertEquals(array[i], expected[i]);
		}
	}
}
