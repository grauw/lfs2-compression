import { Grammar } from "../lib/Grammar.js";
import { Test, TestSuite, assert, assertEquals, assertArrayEquals, assertArrayDeepEquals } from "./TestSuite.js";

export default new TestSuite([
	new Test("Empty grammar", () => {
		const grammar = new Grammar();
		assertEquals(grammar.getRuleCount(), 0);
		assertEquals(grammar.getSize(), 0);
	}),
	new Test("Single", () => {
		const grammar = new Grammar([[Grammar.start, ["b", "a", "n", "a", "n", "a"]]]);
		assertEquals(grammar.getRuleCount(), 1);
		assertEquals(grammar.getSize(), 6);
	}),
	new Test("Multiple nested", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]);
		assertEquals(grammar.getRuleCount(), 3);
		assertEquals(grammar.getSize(), 7);
	}),
	new Test("terminals", () => {
		const input = "banana".split("");
		const grammar = new Grammar([[Grammar.start, input]]);
		assertArrayEquals([...grammar.terminals()], input);
	}),
	new Test("preorder", () => {
		const [A, B, C, D] = [Symbol("A"), Symbol("B"), Symbol("C"), Symbol("D")];
		const grammar = new Grammar([
			[A, [1, D, B]],
			[B, [C, C]],
			[C, [D, 4]],
			[D, [3, C]]
		]);
		assertArrayEquals([...grammar.preorder(A)], [A, D, C, B]);
	}),
	new Test("postorder", () => {
		const [A, B, C, D] = [Symbol("A"), Symbol("B"), Symbol("C"), Symbol("D")];
		const grammar = new Grammar([
			[A, [1, D, B]],
			[B, [C, C]],
			[C, [D, 4]],
			[D, [3, C]]
		]);
		assertArrayEquals([...grammar.postorder(A)], [C, D, B, A]);
	}),
	new Test("map", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]).map((expansion, nonTerminal) => nonTerminal == C ? [] : expansion.map((value, index) => index != 1 ? value : 0));
		assertGrammarEquals(grammar, new Grammar([
			[A, [1, 0, 2]],
			[B, [C, 0]],
			[C, []]
		]));
	}),
	new Test("filter", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]).filter((expansion, nonTerminal) => nonTerminal != B && !expansion.includes(B));
		assertGrammarEquals(grammar, new Grammar([
			[C, [3, 4]]
		]));
	}),
	new Test("reduce", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]);
		const result = grammar.reduce((accumulator, expansion, nonTerminal) =>
			accumulator + (nonTerminal == B || expansion.includes(B) ? 2 : 1), 0);
		assertEquals(result, 5);
	}),
	new Test("some", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]);
		assert(grammar.some((expansion, nonTerminal) => nonTerminal == A && expansion.includes(2)));
		assert(!grammar.some((expansion, nonTerminal) => nonTerminal == C && expansion.includes(2)));
	}),
	new Test("every", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]);
		assert(grammar.every((expansion, nonTerminal) => nonTerminal == B || expansion.some(value => typeof value == "number")));
		assert(!grammar.every((expansion, nonTerminal) => nonTerminal == B && expansion.includes(C)));
	}),
	new Test("union", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]).union(new Grammar([
			[B, [5, 6]],
			[C, [7, 8]]
		]));
		assertGrammarEquals(grammar, new Grammar([
			[A, [1, 2]],
			[B, [3, 4]],
			[C, [7, 8]]
		]));
	}),
	new Test("intersection", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]).intersection(new Grammar([
			[B, [5, 6]],
			[C, [7, 8]]
		]));
		assertGrammarEquals(grammar, new Grammar([
			[B, [3, 4]]
		]));
	}),
	new Test("difference", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]).difference(new Grammar([
			[B, [5, 6]],
			[C, [7, 8]]
		]));
		assertGrammarEquals(grammar, new Grammar([
			[A, [1, 2]]
		]));
	}),
	new Test("symmetricDifference", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]).symmetricDifference(new Grammar([
			[B, [5, 6]],
			[C, [7, 8]]
		]));
		assertGrammarEquals(grammar, new Grammar([
			[A, [1, 2]],
			[C, [7, 8]]
		]));
	}),
	new Test("isSubsetOf", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]);
		assert(grammar.isSubsetOf(new Grammar([
			[A, [1, 2]],
			[B, [3, 4]],
			[C, [5, 6]]
		])));
		assert(!grammar.isSubsetOf(new Grammar([
			[A, [1, 2]]
		])));
	}),
	new Test("isSupersetOf", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]);
		assert(grammar.isSupersetOf(new Grammar([
			[A, [1, 2]]
		])));
		assert(!grammar.isSupersetOf(new Grammar([
			[A, [1, 2]],
			[B, [3, 4]],
			[C, [5, 6]]
		])));
	}),
	new Test("isDisjointFrom", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, 2]],
			[B, [3, 4]]
		]);
		assert(grammar.isDisjointFrom(new Grammar([
			[C, [5, 6]]
		])));
		assert(!grammar.isDisjointFrom(new Grammar([
			[B, [3, 4]],
			[C, [5, 6]]
		])));
	}),
	new Test("getReachableRules", () => {
		const [A, B, C, D] = [Symbol("A"), Symbol("B"), Symbol("C"), Symbol("D")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [3, B]],
			[C, [D, 4]],
			[D, [5, 6]]
		]).getReachableRules([A]);
		assertGrammarEquals(grammar, new Grammar([
			[A, [1, B, 2]],
			[B, [3, B]]
		]));
	}),
	new Test("inline", () => {
		const [A, B, C, D, E, F] = [Symbol("A"), Symbol("B"), Symbol("C"), Symbol("D"), Symbol("E"), Symbol("F")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [3, C]],
			[C, [4, D]],
			[D, [C, 5]],
			[E, [F, 6]],
			[F, [7, 8]]
		]).inline((nonTerminal, expansion) => true, A);
		assertGrammarEquals(grammar, new Grammar([
			[A, [1, 3, C, 2]],
			[B, [3, C]],
			[C, [4, C, 5]],
			[D, [C, 5]],
			[E, [F, 6]],
			[F, [7, 8]]
		]));
	}),
	new Test("inlineUnitRules", () => {
		const [A, B, C, D, E, F, G] = [Symbol("A"), Symbol("B"), Symbol("C"), Symbol("D"), Symbol("E"), Symbol("F"), Symbol("G")];
		const grammar = new Grammar([
			[A, [A, B, C, E, F, G, 2]],
			[B, [C]],
			[C, [D]],
			[D, [B]],
			[E, [F]],
			[F, [G]],
			[G, [1]]
		]).inlineUnitRules();
		assertGrammarEquals(grammar, new Grammar([
			[A, [A, B, C, G, G, G, 2]],
			[B, [B]],
			[C, [C]],
			[D, [D]],
			[E, [G]],
			[F, [G]],
			[G, [1]]
		]));
	}),
	new Test("inlineEmptyRules", () => {
		const [A, B, C, D] = [Symbol("A"), Symbol("B"), Symbol("C"), Symbol("D")];
		const grammar = new Grammar([
			[A, [A, B, C, D]],
			[B, [1, 2]],
			[C, [3]],
			[D, []],
		]).inlineEmptyRules();
		assertGrammarEquals(grammar, new Grammar([
			[A, [A, B, C]],
			[B, [1, 2]],
			[C, [3]],
			[D, []]
		]));
	}),
	new Test("getOccurrences", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [3, C]],
			[C, [C, B]]
		]);
		assertArrayDeepEquals([...grammar.getOccurrences()].map(([symbol, occurrences]) => [symbol, [...occurrences]]),
			[[1, [A]], [B, [A, C]], [2, [A]], [3, [B]], [C, [B, C]]]);
	}),
	new Test("getOccurrenceCounts", () => {
		const [A, B, C] = [Symbol("A"), Symbol("B"), Symbol("C")];
		const grammar = new Grammar([
			[A, [1, B, 2]],
			[B, [C, C]],
			[C, [3, 4]]
		]);
		assertArrayDeepEquals([...grammar.getOccurrenceCounts()],
			[[1, 1], [B, 1], [2, 1], [C, 2], [3, 1], [4, 1]]);
	}),
]);

function assertGrammarEquals(grammar, expected) {
	assertEquals(grammar.size, expected.size);
	for (const [nonTerminal, expansion] of expected) {
		assert(grammar.has(nonTerminal));
		assertArrayEquals(grammar.get(nonTerminal), expansion);
	}
}
