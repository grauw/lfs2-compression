import { SuffixTree } from "../lib/SuffixTree.js";
import { Test, TestSuite, assert, assertEquals, assertArrayEquals } from "./TestSuite.js";

export default new TestSuite([
	new Test("Empty sequence", () => {
		const tree = makeSuffixTree("", {});
		assertSuffixTree(tree, {});
	}),
	new Test("Single symbol", () => {
		const tree = makeSuffixTree("a");
		assertSuffixTree(tree, { a: {} });
	}),
	new Test("Distinct symbols", () => {
		const tree = makeSuffixTree("abc");
		assertSuffixTree(tree, { abc: {}, bc: {}, c: {} });
	}),
	new Test("Identical symbols", () => {
		const tree = makeSuffixTree("aaa");
		assertSuffixTree(tree, { aaa: {} });
	}),
	new Test("Identical symbols + terminator", () => {
		const tree = makeSuffixTree("aaa$");
		assertSuffixTree(tree, { a: { a: { a$: {}, $: {} }, $: {} }, $: {} });
	}),
	new Test("Repeated symbols", () => {
		const tree = makeSuffixTree("abab");
		assertSuffixTree(tree, { abab: {}, bab: {} });
	}),
	new Test("Repeated symbols + terminator", () => {
		const tree = makeSuffixTree("abab$");
		assertSuffixTree(tree, { ab: { ab$: {}, $: {} }, b: { ab$: {}, $: {} }, $: {} });
	}),
	new Test("Complex test", () => {
		const tree = makeSuffixTree("abcdefabxybcdmnabcdex$");
		assertSuffixTree(tree, {
			ab: { cde: { fabxybcdmnabcdex$: {}, x$: {} }, xybcdmnabcdex$: {} },
			b: { cd: { e: { fabxybcdmnabcdex$: {}, x$: {} }, mnabcdex$: {} }, xybcdmnabcdex$: {} },
			cd: { e: { fabxybcdmnabcdex$: {}, x$: {} }, mnabcdex$: {} },
			d: { e: { fabxybcdmnabcdex$: {}, x$: {} }, mnabcdex$: {} },
			e: { fabxybcdmnabcdex$: {}, x$: {} },
			fabxybcdmnabcdex$: {},
			ybcdmnabcdex$: {},
			x: { ybcdmnabcdex$: {}, $: {} },
			mnabcdex$: {},
			nabcdex$: {},
			$: {}
		});
	}),
	new Test("Palindrome", () => {
		const tree = makeSuffixTree("racecar$");
		assertSuffixTree(tree, { r: { acecar$: {}, $: {} }, a: { cecar$: {}, r$: {} }, c: { ecar$: {}, ar$: {} }, ecar$: {}, $: {} });
	}),
	new Test("Overlapping", () => {
		const tree = makeSuffixTree("abcabcabcabcabcabc$");
		const s = { abc: { abc: { abc: { abc: { abc$: {}, $: {} }, $: {} }, $: {} }, $: {} }, $: {} };
		assertSuffixTree(tree, { abc: s, bc: s, c: s, $: {} });
	}),
	new Test("Repeated substring with variation", () => {
		const tree = makeSuffixTree("abcdeabcdfabcg$");
		assertSuffixTree(tree, {
			abc: { d: { eabcdfabcg$: {}, fabcg$: {} }, g$: {} },
			bc: { d: { eabcdfabcg$: {}, fabcg$: {} }, g$: {} },
			c: { d: { eabcdfabcg$: {}, fabcg$: {} }, g$: {} },
			d: { eabcdfabcg$: {}, fabcg$: {} },
			eabcdfabcg$: {},
			fabcg$: {},
			g$: {},
			$: {},
		});
	}),
	new Test("DNA sequence", () => {
		const tree = makeSuffixTree("ATCGTAGCTAGCTAGCGTAGCTA$");
		assertSuffixTree(tree, {
			A: { TCGTAGCTAGCTAGCGTAGCTA$: {}, GC: { TA: { GC: { TAGCGTAGCTA$: {}, GTAGCTA$: {} }, $: {} }, GTAGCTA$: {} }, $: {} },
			T: { CGTAGCTAGCTAGCGTAGCTA$: {}, A: { GC: { TA: { GC: { TAGCGTAGCTA$: {}, GTAGCTA$: {} }, $: {} }, GTAGCTA$: {} }, $: {} } },
			C: { GTAGCTA: { GCTAGCGTAGCTA$: {}, $: {} }, TA: { GC: { TAGCGTAGCTA$: {}, GTAGCTA$: {} }, $: {} } },
			G: { TAGCTA: { GCTAGCGTAGCTA$: {}, $: {} }, C: { TA: { GC: { TAGCGTAGCTA$: {}, GTAGCTA$: {} }, $: {} }, GTAGCTA$: {} } },
			$: {}
		});
	}),
	new Test("Adding suffix to existing tree", () => {
		const tree = makeSuffixTree();
		tree.add("abc".split(""));
		tree.add("def".split(""));
		tree.add("abc".split(""));
		assertSuffixTree(tree, {
			abcdefabc: {},
			bcdefabc: {},
			cdefabc: {},
			defabc: {},
			efabc: {},
			fabc: {}
		});
	}),
	new Test("Generalized suffix tree", () => {
		const tree = makeSuffixTree();
		tree.add("abc_".split(""));
		tree.add("defX".split(""));
		tree.add("abc$".split(""));
		assertSuffixTree(tree, {
			abc: { _defXabc$: {}, $: {} },
			bc: { _defXabc$: {}, $: {} },
			c: { _defXabc$: {}, $: {} },
			_defXabc$: {},
			defXabc$: {},
			efXabc$: {},
			fXabc$: {},
			Xabc$: {},
			$: {}
		});
	}),
	new Test("Non string symbols", () => {
		const tree = makeSuffixTree([-1, 0, 1, 2]);
		assertSuffixTree(tree, [
			[[-1, 0, 1, 2], []],
			[[0, 1, 2], []],
			[[1, 2], []],
			[[2], []]
		]);
	}),
	new Test("Mixed type symbols", () => {
		const tree = makeSuffixTree(["a", 1, "b", 2]);
		assertSuffixTree(tree, [
			[["a", 1, "b", 2], []],
			[[1, "b", 2], []],
			[["b", 2], []],
			[[2], []]
		]);
	}),
]);

function makeSuffixTree(string = []) {
	const tree = new SuffixTree();
	tree.add(typeof string == "string" ? string.split("") : string);
	assertSuffixLink(tree);
	return tree;
}

function assertSuffixTree(tree, expected, node = tree.root) {
	const expectedMap = new Map(expected instanceof Array ? expected : Object.entries(expected));
	const path = tree.getPath(node);
	if (node.leaf) {
		assertEquals(0, expectedMap.size);
	} else {
		assertEquals(node.edges.size, expectedMap.size);
		for (const key of expectedMap.keys()) {
			assert(node.edges.has(key[0]));
			const edge = node.edges.get(key[0]);
			assertArrayEquals(tree.slice(edge.start, node.length), path);
			assertEquals(Math.min(edge.length, tree.length - edge.start), node.length + key.length);
			for (let i = 0; i < key.length; i++) {
				assertEquals(tree.at(edge.start + node.length + i), key[i]);
			}
			assertSuffixTree(tree, expectedMap.get(key), edge);
		}
	}
}

function assertSuffixLink(tree, node = tree.root) {
	const path = tree.getPath(node);
	if (node.root || node.leaf) {
		assertEquals(node.suffixLink, null);
	} else if (node.internal) {
		const point = tree.createRootPoint();
		assert(tree.search(point, path.slice(1)));
		assertEquals(point.length, point.node.length);
		assertEquals(node.suffixLink, point.node);
	} else {
		assert(false);
	}
	if (!node.leaf) {
		for (const key of node.edges.keys()) {
			assertSuffixLink(tree, node.edges.get(key));
		}
	}
}
