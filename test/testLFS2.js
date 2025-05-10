import fs from "fs";
import { Grammar } from "../lib/Grammar.js";
import { Test, TestSuite, assert, assertEquals, assertArrayEquals } from "./TestSuite.ts";

export default new TestSuite([
	new Test("Simple string", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "abcababc".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 3);
		assertEquals(compressedGrammar.getSize(), 7);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Longer string", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "bananasbanananananananananabananas".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 6);
		assertEquals(compressedGrammar.getSize(), 17);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Complex test", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "abcdefabxybcdmnabcdex".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 3);
		assertEquals(compressedGrammar.getSize(), 17);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Palindrome", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "racecar".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 1);
		assertEquals(compressedGrammar.getSize(), 7);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Overlapping", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "abcabcabcabcabcabc".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 3);
		assertEquals(compressedGrammar.getSize(), 8);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Repeated substring with variation", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "abcdeabcdfabcg".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 3);
		assertEquals(compressedGrammar.getSize(), 11);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("DNA sequence", () => {
		const grammar = new Grammar(new Map([[Grammar.start, "ATCGTAGCTAGCTAGCGTAGCTA".split("")]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 4);
		assertEquals(compressedGrammar.getSize(), 15);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Lorem ipsum", () => {
		const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".split("");
		const grammar = new Grammar(new Map([[Grammar.start, loremIpsum]]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 64);
		assertEquals(compressedGrammar.getSize(), 354);

		assertArrayEquals([...compressedGrammar.terminals()], loremIpsum);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Overlapping", () => {
		const grammar = new Grammar(new Map([
			[Grammar.start, "adeafgahiajkalmnjkahiafgadeabcadeafgahiajkalmX".split("")],
			["X", "abcadeafgahiajkalmnjkahiafgadeabcadeafgahiajkalmnjkahiafgadeabcadeafgahiajkalm".split("")]
		]));
		const compressedGrammar = grammar.compress();

		assertEquals(compressedGrammar.getRuleCount(), 10);
		assertEquals(compressedGrammar.getSize(), 36);

		assertArrayEquals([...compressedGrammar.terminals()], [...grammar.terminals()]);
		assertLongestFirst(compressedGrammar);
	}),
	new Test("Canterbury: text (149 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/alice29.txt");
		assertEquals(compressedGrammar.getRuleCount(), 10640);
		assertEquals(compressedGrammar.getSize(), 44859);
	}),
	new Test("Canterbury: play (122 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/asyoulik.txt");
		assertEquals(compressedGrammar.getRuleCount(), 9475);
		assertEquals(compressedGrammar.getSize(), 41339);
	}),
	new Test("Canterbury: html (24 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/cp.html");
		assertEquals(compressedGrammar.getRuleCount(), 1696);
		assertEquals(compressedGrammar.getSize(), 7904);
	}),
	new Test("Canterbury: Csrc (11 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/fields.c");
		assertEquals(compressedGrammar.getRuleCount(), 759);
		assertEquals(compressedGrammar.getSize(), 3294);
	}),
	new Test("Canterbury: list (4 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/grammar.lsp");
		assertEquals(compressedGrammar.getRuleCount(), 315);
		assertEquals(compressedGrammar.getSize(), 1436);
	}),
	new Test("Canterbury: Excl (1006 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/kennedy.xls");
		assertEquals(compressedGrammar.getRuleCount(), 3228);
		assertEquals(compressedGrammar.getSize(), 166561);
	}),
	new Test("Canterbury: tech (417 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/lcet10.txt");
		assertEquals(compressedGrammar.getRuleCount(), 24629);
		assertEquals(compressedGrammar.getSize(), 103086);
	}),
	new Test("Canterbury: poem (471 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/plrabn12.txt");
		assertEquals(compressedGrammar.getRuleCount(), 32638);
		assertEquals(compressedGrammar.getSize(), 142962);
	}),
	new Test("Canterbury: fax (501 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/ptt5");
		assertEquals(compressedGrammar.getRuleCount(), 9322);
		assertEquals(compressedGrammar.getSize(), 46643);
	}),
	new Test("Canterbury: SPRC (37 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/sum");
		assertEquals(compressedGrammar.getRuleCount(), 2099);
		assertEquals(compressedGrammar.getSize(), 11813);
	}),
	new Test("Canterbury: man (4 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/canterbury/xargs.1");
		assertEquals(compressedGrammar.getRuleCount(), 402);
		assertEquals(compressedGrammar.getSize(), 1883);
	}),

	new Test("Calgary: bib (109 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/bib");
		assertEquals(compressedGrammar.getRuleCount(), 6632);
		assertEquals(compressedGrammar.getSize(), 29135);
	}),
	new Test("Calgary: book1 (751 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/book1");
		assertEquals(compressedGrammar.getRuleCount(), 49828);
		assertEquals(compressedGrammar.getSize(), 217417);
	}),
	new Test("Calgary: book2 (597 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/book2");
		assertEquals(compressedGrammar.getRuleCount(), 34577);
		assertEquals(compressedGrammar.getSize(), 147319);
	}),
	new Test("Calgary: geo (100 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/geo");
		assertEquals(compressedGrammar.getRuleCount(), 7012);
		assertEquals(compressedGrammar.getSize(), 53367);
	}),
	new Test("Calgary: news (368 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/news");
		assertEquals(compressedGrammar.getRuleCount(), 23156);
		assertEquals(compressedGrammar.getSize(), 104102);
	}),
	new Test("Calgary: obj1 (21 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/obj1");
		assertEquals(compressedGrammar.getRuleCount(), 1428);
		assertEquals(compressedGrammar.getSize(), 9571);
	}),
	new Test("Calgary: obj2 (241 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/obj2");
		assertEquals(compressedGrammar.getRuleCount(), 13077);
		assertEquals(compressedGrammar.getSize(), 66847);
	}),
	new Test("Calgary: paper1 (52 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/paper1");
		assertEquals(compressedGrammar.getRuleCount(), 4029);
		assertEquals(compressedGrammar.getSize(), 17203);
	}),
	new Test("Calgary: paper2 (80 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/paper2");
		assertEquals(compressedGrammar.getRuleCount(), 6133);
		assertEquals(compressedGrammar.getSize(), 26056);
	}),
	new Test("Calgary: pic (501 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/pic");
		assertEquals(compressedGrammar.getRuleCount(), 9322);
		assertEquals(compressedGrammar.getSize(), 46643);
	}),
	new Test("Calgary: progc (39 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/progc");
		assertEquals(compressedGrammar.getRuleCount(), 2908);
		assertEquals(compressedGrammar.getSize(), 12758);
	}),
	new Test("Calgary: progl (70 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/progl");
		assertEquals(compressedGrammar.getRuleCount(), 3725);
		assertEquals(compressedGrammar.getSize(), 15432);
	}),
	new Test("Calgary: progp (48 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/progp");
		assertEquals(compressedGrammar.getRuleCount(), 2535);
		assertEquals(compressedGrammar.getSize(), 10707);
	}),
	new Test("Calgary: trans (91 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/calgary/trans");
		assertEquals(compressedGrammar.getRuleCount(), 4043);
		assertEquals(compressedGrammar.getSize(), 17146);
	}),

	new Test("Artificial: a (0 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/artificial/a.txt");
		assertEquals(compressedGrammar.getRuleCount(), 1);
		assertEquals(compressedGrammar.getSize(), 1);
	}),
	new Test("Artificial: aaa (98 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/artificial/aaa.txt");
		assertEquals(compressedGrammar.getRuleCount(), 16);
		assertEquals(compressedGrammar.getSize(), 37);
	}),
	new Test("Artificial: alphabet (98 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/artificial/alphabet.txt");
		assertEquals(compressedGrammar.getRuleCount(), 13);
		assertEquals(compressedGrammar.getSize(), 55);
	}),
	new Test("Artificial: random (98 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/artificial/random.txt");
		assertEquals(compressedGrammar.getRuleCount(), 10773);
		assertEquals(compressedGrammar.getSize(), 69873);
	}),

	new Test("Miscellaneous: pi (977 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/miscellaneous/pi.txt");
		assertEquals(compressedGrammar.getRuleCount(), 88596);
		assertEquals(compressedGrammar.getSize(), 405070);
	}),

	new Test("Large: E.coli (4530 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/large/E.coli");
		assertEquals(compressedGrammar.getRuleCount(), 270808);
		assertEquals(compressedGrammar.getSize(), 1123841);
	}),
	new Test("Large: bible (3953 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/large/bible.txt");
		assertEquals(compressedGrammar.getRuleCount(), 172633);
		assertEquals(compressedGrammar.getSize(), 716273);
	}),
	new Test("Large: world (2415 kB)", () => {
		const compressedGrammar = assertLFSCompression("res/large/world192.txt");
		assertEquals(compressedGrammar.getRuleCount(), 88996);
		assertEquals(compressedGrammar.getSize(), 382164);
	})
]);

function assertLFSCompression(path) {
	const data = [...fs.readFileSync(path)];
	const grammar = new Grammar(new Map([[Grammar.start, data]]));
	const compressedGrammar = grammar.compress();

	console.log(`Compression: ${grammar.getRuleCount()} => ${compressedGrammar.getRuleCount()} rules, max depth: ${getMaxDepth(compressedGrammar)}`);
	console.log(`Compression: ${grammar.getSize()} => ${compressedGrammar.getSize()} symbols (${(compressedGrammar.getSize() / grammar.getSize()).toFixed(2)})`);

	assertArrayEquals([...compressedGrammar.terminals()], data);
	assertLongestFirst(compressedGrammar);

	return compressedGrammar;
}

function assertLongestFirst(grammar) {
	const rules = grammar.rules;
	const sizeCache = new Map();
	const [[start]] = rules;
	getDeepSize(rules, start, sizeCache);
	let previousSize = Infinity;
	for (const head of rules.keys()) {
		const size = sizeCache.get(head);
		assert(size !== undefined);
		assert(size <= previousSize);
		previousSize = size;
	}
}

function getDeepSize(rules, symbol, sizeCache = new Map()) {
	if (!sizeCache.has(symbol)) {
		if (rules.has(symbol)) {
			const body = rules.get(symbol);
			const size = body.reduce((accu, symbol) => accu + getDeepSize(rules, symbol, sizeCache), 0);
			sizeCache.set(symbol, size);
		} else {
			sizeCache.set(symbol, 1);
		}
	}
	return sizeCache.get(symbol);
}

/**
 * Reduce (fold) the grammar in a top-left fashion.
 * @param combineDepth Depth-wise combinator function.
 * @param accuDepth Initial depth-wise accumulator.
 * @param combineBreadth Breadth-wise combinator function.
 * @param accuBreadth Initial breadth-wise accumulator.
 * @param start Start symbol. Defaults to {@link Grammar.start}.
 * @returns The folded reduction.
 */
function reduceTopLeft(grammar, combineDepth, accuDepth, combineBreadth, accuBreadth, start = Grammar.start) {
	const reduceTop = (reduceBreadth, accumulator, symbol) => {
		accumulator = combineDepth(accumulator, symbol);
		if (grammar.rules.has(symbol)) {
			accumulator = reduceBreadth(reduceTop, accumulator, grammar.rules.get(symbol));
		}
		return accumulator;
	};

	const reduceBottom = (reduceBreadth, accumulator, symbol) => {
		if (grammar.rules.has(symbol)) {
			accumulator = reduceBreadth(reduceBottom, accumulator, grammar.rules.get(symbol));
		}
		accumulator = combineDepth(accumulator, symbol);
		return accumulator;
	};

	const reduceLeft = (reduceDepth, accumulator, symbols) => {
		return symbols.reduce((accu, symbol) => combineBreadth(accu, reduceDepth(reduceLeft, accumulator, symbol)), accuBreadth);
	};

	const reduceRight = (reduceDepth, accumulator, symbols) => {
		return symbols.reduceRight((accu, symbol) => combineBreadth(accu, reduceDepth(reduceRight, accumulator, symbol)), accuBreadth);
	};

	return reduceTop(reduceLeft, accuDepth, start);
}

function getMaxDepth(grammar) {
	return reduceTopLeft(grammar,
		(accumulator, symbol) => accumulator + 1, 0,
		(accumulator, depth) => Math.max(accumulator, depth), -Infinity,
	);
}
