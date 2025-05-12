import { SLSTree } from "./SLSTree.js";

/**
 * A context-free grammar consisting of production rules of the form A → α,
 * which map single non-terminal symbols (A) to an expansion of symbols α either
 * terminal or non-terminal.
 *
 * Specifically, in this implementation each non-terminal can have at most one
 * production rule. Production rules are allowed to be recursive.
 *
 * The left-hand side is referred to as the non-terminal, and the right-hand
 * side is referred to as the expansion.
 */
export class Grammar {
	rules;

	/**
	 * Default start symbol.
	 * @readonly
	 */
	static start = Symbol("S");

	/**
	 * Construct a grammar given a map of production rules. The expansions must be arrays.
	 * @param rules A map or iterable pairs of non-terminals and their expansions.
	 */
	constructor(rules = new Map()) {
		this.rules = rules instanceof Map ? rules : new Map(rules);
	}

	/**
	 * Check if the grammar has a production rule with the given non-terminal.
	 * @param nonTerminal Non-terminal to test.
	 * @returns Whether the rule exists.
	 */
	has(nonTerminal) {
		return this.rules.has(nonTerminal);
	}

	/**
	 * Get the expansion of the production rule with the given non-terminal.
	 * @param nonTerminal Non-terminal to get.
	 * @returns The expansion of the rule.
	 */
	get(nonTerminal) {
		return this.rules.get(nonTerminal);
	}

	/**
	 * Iterate over each production rule in the grammar.
	 * @param consumer Consumer function which takes the non-terminal and expansion.
	 */
	forEach(consumer) {
		this.rules.forEach((expansion, nonTerminal) => consumer(expansion, nonTerminal, this));
	}

	/**
	 * Get iterator over the non-terminals of the production rules.
	 * @returns Non-terminal iterator.
	 */
	keys() {
		return this.rules.keys();
	}

	/**
	 * Get iterator over the expansions of the production rules.
	 * @returns Expansion iterator.
	 */
	values() {
		return this.rules.values();
	}

	/**
	 * Get iterator over the [non-terminals, expansion] pairs of the production rules.
	 * @returns Non-terminal and expansion pair iterator.
	 */
	entries() {
		return this.rules.entries();
	}

	/**
	 * Get iterator over the [non-terminals, expansion] pairs of the production rules.
	 * @returns Non-terminal and expansion pair iterator.
	 */
	[Symbol.iterator]() {
		return this.rules[Symbol.iterator]();
	}

	/**
	 * The number of production rules in this grammar.
	 * @returns Rule count.
	 */
	get size() {
		return this.rules.size;
	}

	/**
	 * Get the number of production rules in this grammar.
	 * @returns Rule count.
	 */
	getRuleCount() {
		return this.rules.size;
	}

	/**
	 * Get the size of the grammar, that is, the sum of the production rules’ expansion size.
	 * @returns Size of the grammar.
	 */
	getSize() {
		return this.reduce((size, expansion) => size + expansion.length, 0);
	}

	/**
	 * Get the set of non-terminals in the grammar.
	 * @returns Set of non-terminals.
	 */
	getNonTerminals() {
		return new Set(this.rules.keys());
	}

	/**
	 * Get an iterable which yields terminals by traversing the grammar.
	 * @param start Start symbol. Defaults to {@link Grammar.start}.
	 * @returns Terminal iterable.
	 */
	terminals(start = Grammar.start) {
		return new TerminalsIterable(this.rules, start);
	}

	/**
	 * Get an iterable which yields non-terminals in pre-order by traversing the grammar.
	 * @param start Start symbol. Defaults to {@link Grammar.start}.
	 * @returns Non-terminal iterable.
	 */
	preorder(start = Grammar.start) {
		return new PreorderIterable(this.rules, start);
	}

	/**
	 * Get an iterable which yields non-terminals in post-order by traversing the grammar.
	 * @param start Start symbol. Defaults to {@link Grammar.start}.
	 * @returns Non-terminal iterable.
	 */
	postorder(start = Grammar.start) {
		return new PostorderIterable(this.rules, start);
	}

	/**
	 * Map the expansions of the grammar production rules to new ones.
	 * @param mapFunction Function receiving the rule non-terminal and expansion, producing a new expansion.
	 * @returns Mapped grammar.
	 */
	map(mapFunction) {
		const rules = new Map();
		for (const [nonTerminal, expansion] of this.rules) {
			rules.set(nonTerminal, mapFunction(expansion, nonTerminal, this));
		}
		return new Grammar(rules);
	}

	/**
	 * Filter grammar production rules by predicate.
	 * @param predicate Predicate receiving the rule non-terminal and expansion.
	 * @returns Filtered grammar.
	 */
	filter(predicate) {
		const rules = new Map();
		for (const [nonTerminal, expansion] of this.rules) {
			if (predicate(expansion, nonTerminal, this)) {
				rules.set(nonTerminal, expansion);
			}
		}
		return new Grammar(rules);
	}

	/**
	 * Reduce over grammar production rules.
	 * @param combine Combiner receiving the accumulator, rule non-terminal and expansion.
	 * @param accumulator The initial value for the accumulator.
	 * @returns Reduced value.
	 */
	reduce(combine, accumulator) {
		for (const [nonTerminal, expansion] of this.rules) {
			accumulator = combine(accumulator, expansion, nonTerminal, this);
		}
		return accumulator;
	}

	/**
	 * Check if some production rules satisfy the predicate. Short-circuits.
	 * @param predicate Predicate receiving the rule non-terminal and expansion.
	 * @returns Whether any rule satisfies the predicate.
	 */
	some(predicate) {
		for (const [nonTerminal, expansion] of this.rules) {
			if (predicate(expansion, nonTerminal, this)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if every production rule satisfies the predicate. Short-circuits.
	 * @param predicate Predicate receiving the rule non-terminal and expansion.
	 * @returns Whether all rules satisfy the predicate.
	 */
	every(predicate) {
		for (const [nonTerminal, expansion] of this.rules) {
			if (!predicate(expansion, nonTerminal, this)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Get the union of this grammar with another grammar.
	 * When both have the same non-terminal, keeps the one from this grammar.
	 * @param other The other grammar.
	 * @returns Combined grammar.
	 */
	union(other) {
		const rules = new Map(this.rules);
		for (const [nonTerminal, expansion] of other) {
			if (!rules.has(nonTerminal)) {
				rules.set(nonTerminal, expansion);
			}
		}
		return new Grammar(rules);
	}

	/**
	 * Get the intersection of this grammar with another grammar.
	 * @param other The other grammar.
	 * @returns Intersected grammar.
	 */
	intersection(other) {
		const rules = new Map();
		for (const nonTerminal of other.keys()) {
			if (this.rules.has(nonTerminal)) {
				rules.set(nonTerminal, this.rules.get(nonTerminal));
			}
		}
		return new Grammar(rules);
	}

	/**
	 * Get the difference of this grammar with another grammar.
	 * @param other The other grammar.
	 * @returns Difference grammar.
	 */
	difference(other) {
		const rules = new Map(this.rules);
		for (const nonTerminal of other.keys()) {
			rules.delete(nonTerminal);
		}
		return new Grammar(rules);
	}

	/**
	 * Get the symmetric difference of this grammar with another grammar.
	 * @param other The other grammar.
	 * @returns Symmetric difference grammar.
	 */
	symmetricDifference(other) {
		const rules = new Map(this.rules);
		for (const [nonTerminal, expansion] of other) {
			if (rules.has(nonTerminal)) {
				rules.delete(nonTerminal);
			} else {
				rules.set(nonTerminal, expansion);
			}
		}
		return new Grammar(rules);
	}

	/**
	 * Check if this grammar is a subset of another grammar.
	 * @param other The other grammar.
	 * @returns Is subset.
	 */
	isSubsetOf(other) {
		for (const nonTerminal of this.keys()) {
			if (!other.has(nonTerminal)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Check if this grammar is a superset of another grammar.
	 * @param other The other grammar.
	 * @returns Is superset.
	 */
	isSupersetOf(other) {
		for (const nonTerminal of other.keys()) {
			if (!this.rules.has(nonTerminal)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Check if this grammar is disjoint from another grammar.
	 * @param other The other grammar.
	 * @returns Is disjoint.
	 */
	isDisjointFrom(other) {
		for (const nonTerminal of other.keys()) {
			if (this.rules.has(nonTerminal)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Compress the grammar using Longest-First Substitution (LFS2), which
	 * iteratively finds the longest repeated subsequences in the production
	 * rules, and substitutes them by a new production rule, thus reducing the
	 * size of the grammar. Runs in O(n) time.
	 *
	 * This process can also be referred to as “outlining”.
	 *
	 * @param [options] Options to configure the compression.
	 * @param [options.minimumLength=2] Minimum length to compress to, no less than 1. Defaults to 2.
	 * @param [options.createNonTerminal=Symbol] Function to generate a new non-terminal. Defaults to creating symbols.
	 * @returns Compressed grammar.
	 */
	compress(options) {
		const tree = new SLSTree();
		tree.addRules(this.rules);
		tree.compress(options?.minimumLength, options?.createNonTerminal);
		return new Grammar(tree.getRules());
	}

	/**
	 * Inline production rules into their parent based on a predicate.
	 * @param predicate Predicate receiving the rule non-terminal and expansion.
	 * @param start Start symbol. Defaults to {@link Grammar.start}.
	 * @returns Inlined grammar.
	 */
	inline(predicate, start = Grammar.start) {
		const rules = new Map();
		const substitutions = new Map();
		const postorder = this.postorder(start);
		for (const nonTerminal of postorder) {
			const expansions = [];
			for (const symbol of postorder.expansion) {
				if (!substitutions.has(symbol)) {
					if (rules.has(symbol)) {
						const expansion = rules.get(symbol);
						const inline = predicate(expansion, symbol, this);
						substitutions.set(symbol, inline ? expansion : [symbol]);
					} else {
						substitutions.set(symbol, [symbol]);
					}
				}
				expansions.push(substitutions.get(symbol));
			}
			rules.set(nonTerminal, expansions.flat())
		}
		for (const [nonTerminal, expansion] of this) {
			if (!rules.has(nonTerminal)) {
				rules.set(nonTerminal, expansion);
			}
		}
		return new Grammar(rules);
	}

	/**
	 * Inline unit production rules of the form A → B, where the expansion only
	 * consists of a single non-terminal.
	 * @returns Grammar with unit rules inlined.
	 */
	inlineUnitRules() {
		const unitMap = new Map();
		for (const [nonTerminal, expansion] of this.rules) {
			if (expansion.length == 1 && this.rules.has(expansion[0])) {
				unitMap.set(nonTerminal, expansion[0]);
			}
		}
		const unitMapRec = new Map();
		const substituteRec = (symbol, initial) => symbol != initial && unitMap.has(symbol) ? substituteRec(unitMap.get(symbol), initial) : symbol;
		for (const [nonTerminal, substitution] of unitMap) {
			unitMapRec.set(nonTerminal, substituteRec(substitution, nonTerminal));
		}
		return this.map((expansion, nonTerminal) => unitMapRec.has(nonTerminal) ? [unitMapRec.get(nonTerminal)] :
			expansion.map(symbol => unitMapRec.has(symbol) ? unitMapRec.get(symbol) : symbol));
	}

	/**
	 * Inline empty production rules of the form A → ε, where the expansion is empty.
	 * @returns Grammar with empty rules inlined.
	 */
	inlineEmptyRules() {
		return this.map(expansion => expansion.flatMap(
			symbol => !this.rules.has(symbol) || this.rules.get(symbol).length ? [symbol] : []));
	}

	/**
	 * Get the grammar containing only production rules reachable from the given set of start symbols.
	 * @param startSymbols Set of start symbols. Defaults to {@link Grammar.start}.
	 * @returns Grammar without unreachable rules.
	 */
	getReachableRules(startSymbols = new Set([Grammar.start])) {
		const rules = new Map();
		const visitRec = symbols => {
			for (const symbol of symbols) {
				if (!rules.has(symbol) && this.rules.has(symbol)) {
					const expansion = this.rules.get(symbol);
					rules.set(symbol, expansion);
					visitRec(expansion);
				}
			}
		}
		visitRec(startSymbols);
		return new Grammar(rules);
	}

	/**
	 * Get a map of all symbols to the production rules where they occur.
	 * @returns Map of symbols to a set of non-terminals.
	 */
	getOccurrences() {
		const occurrences = new Map();
		for (const [nonTerminal, expansion] of this.rules) {
			for (const symbol of expansion) {
				if (!occurrences.has(symbol)) {
					occurrences.set(symbol, new Set());
				}
				occurrences.get(symbol).add(nonTerminal);
			}
		}
		return occurrences;
	}

	/**
	 * Get a map of symbol occurrence counts.
	 * @returns Map of symbols to occurrence counts.
	 */
	getOccurrenceCounts() {
		const counts = new Map();
		for (const expansion of this.rules.values()) {
			for (const symbol of expansion) {
				counts.set(symbol, counts.has(symbol) ? counts.get(symbol) + 1 : 1);
			}
		}
		return counts;
	}

	/**
	 * Get the set of non-terminals which recur.
	 * @param start Start symbol. Defaults to {@link Grammar.start}.
	 * @returns Recursive non-terminals.
	 */
	getRecursiveRules(start = Grammar.start) {
		const recursive = new Set();
		const findRecursiveRec = (nonTerminal, parents) => {
			if (parents.has(nonTerminal)) {
				for (const parent of parents) {
					recursive.add(parent);
				}
				recursive.add(nonTerminal);
			} else if (this.rules.has(nonTerminal)) {
				parents.add(nonTerminal);
				for (const symbol of this.rules.get(nonTerminal)) {
					if (this.rules.has(symbol) && !recursive.has(symbol)) {
						findRecursiveRec(symbol, parents);
					}
				}
				parents.delete(nonTerminal);
			}
		};
		findRecursiveRec(start, new Set());
		return recursive;
	}
}

class GrammarIterableBase {
	rules;
	visited;
	nonTerminalStack;
	expansionStack;
	indexStack;
	nonTerminal;
	expansion;
	index;

	constructor(rules, start) {
		if (!rules.has(start)) {
			throw new Error("Not a non-terminal.");
		}
		this.rules = rules;
		this.visited = new Set();
		this.nonTerminalStack = [];
		this.expansionStack = [];
		this.indexStack = [];
		this.enter(start, true);
	}

	enter(nonTerminal, jump = false) {
		if (!jump) {
			this.nonTerminalStack.push(this.nonTerminal);
			this.expansionStack.push(this.expansion);
			this.indexStack.push(this.index);
		}
		this.nonTerminal = nonTerminal;
		this.expansion = this.rules.get(nonTerminal);
		this.index = 0;
		this.visited.add(nonTerminal);
	}

	exit() {
		this.nonTerminal = this.nonTerminalStack.pop();
		this.expansion = this.expansionStack.pop();
		this.index = this.indexStack.pop();
	}
}

export class TerminalsIterable extends GrammarIterableBase {
	*[Symbol.iterator]() {
		while (true) {
			if (this.index < this.expansion.length) {
				const symbol = this.expansion[this.index];
				this.index++;
				if (this.rules.has(symbol)) {
					this.enter(symbol, this.index >= this.expansion.length);
				} else {
					yield symbol;
				}
			} else if (this.nonTerminalStack.length > 0) {
				this.exit();
			} else {
				break;
			}
		}
	}
}

export class PreorderIterable extends GrammarIterableBase {
	*[Symbol.iterator]() {
		yield this.nonTerminal;
		while (true) {
			if (this.index < this.expansion.length) {
				const symbol = this.expansion[this.index];
				this.index++;
				if (this.rules.has(symbol) && !this.visited.has(symbol)) {
					this.enter(symbol);
					yield this.nonTerminal;
				}
			} else if (this.nonTerminalStack.length > 0) {
				this.exit();
			} else {
				break;
			}
		}
	}
}

export class PostorderIterable extends GrammarIterableBase {
	*[Symbol.iterator]() {
		while (true) {
			if (this.index < this.expansion.length) {
				const symbol = this.expansion[this.index];
				this.index++;
				if (this.rules.has(symbol) && !this.visited.has(symbol)) {
					this.enter(symbol);
				}
			} else if (this.nonTerminalStack.length > 0) {
				yield this.nonTerminal;
				this.exit();
			} else {
				break;
			}
		}
		yield this.nonTerminal;
	}
}
