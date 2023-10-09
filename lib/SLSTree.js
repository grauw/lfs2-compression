import { SuffixTree, Node, Interval } from "./SuffixTree.js";

export const dead = Symbol("•");

export class SLSNode extends Node {
	minimum;
	maximum;
	cardinality;

	constructor(start, length) {
		super(start, length);
		this.minimum = this.leaf ? this.start : Infinity;
		this.maximum = this.leaf ? this.start : -Infinity;
		this.cardinality = this.leaf ? 1 : -1;
	}

	isRepeatingFactor() {
		if (this.leaf) {
			throw new Error("Already an arithmetic progression.");
		}
		let minimum = Infinity;
		let maximum = -Infinity;
		for (const edge of this.edges.values()) {
			if (!edge.leaf) {
				throw new Error("Child is not a progression.");
			}
			minimum = Math.min(minimum, edge.minimum);
			maximum = Math.max(maximum, edge.maximum);
		}
		return maximum - minimum >= this.length;
	}

	makeArithmeticProgression() {
		if (this.leaf) {
			throw new Error("Already an arithmetic progression.");
		}
		this.minimum = Infinity;
		this.maximum = -Infinity;
		this.cardinality = 0;
		for (const edge of this.edges.values()) {
			if (!edge.leaf) {
				throw new Error("Child is not a progression.");
			}
			this.minimum = Math.min(this.minimum, edge.minimum);
			this.maximum = Math.max(this.maximum, edge.maximum);
			this.cardinality += edge.cardinality;
		}
		this.edges = null;
		this.suffixLink = null;
		// any non-repeating factor forms a single arithmetic progression
		if (this.maximum - this.minimum >= this.length) {
			throw new Error("Not an arithmetic progression.");
		}
		this.length = Infinity;
		this.checkArithmeticProgression();
	}

	isInRange(position) {
		return position >= this.minimum && position <= this.maximum;
	}

	findFirstOccurrence(position) {
		if (!this.leaf) {
			throw new Error("Not an arithmetic progression.");
		}
		if (!this.isInRange(position)) {
			throw new Error("Position out of range.");
		}
		if (this.cardinality >= 2) {
			const d = (this.maximum - this.minimum) / (this.cardinality - 1);
			return Math.ceil((position - this.minimum) / d) * d + this.minimum;
		} else {
			return position;
		}
	}

	maintainArithmeticProgression(pos, length) {
		if (!this.leaf) {
			throw new Error("Not an arithmetic progression.");
		}
		if (pos > this.maximum || pos + length <= this.minimum) {
			return;  // throw?
		}
		if (this.cardinality == 1 && this.maximum == this.minimum) {
			this.cardinality = 0;
			this.minimum = Infinity;
			this.maximum = -Infinity;
		} else if (this.cardinality >= 2) {
			const d = (this.maximum - this.minimum) / (this.cardinality - 1);  // not what paper says
			if (!Number.isInteger((pos - this.minimum) / d)) {
				throw new Error("Position is not on the arithmetic progression.");
			}
			if (pos > this.minimum) {
				if (this.maximum - this.minimum > length) {
					throw new Error("Arithmetic progression range exceeds length.");
				}
				const newMaximum = pos - d;  // Math.floor((pos - 1 - this.minimum) / d) * d + this.minimum;
				this.maximum = Math.min(newMaximum, this.maximum);
			} else {
				const newMinimum = Math.ceil((pos + length - this.minimum) / d) * d + this.minimum;
				this.minimum = Math.min(newMinimum, this.maximum + d);
			}
			const newCardinality = (this.maximum - this.minimum) / d + 1;  // not what paper says
			if (newCardinality > this.cardinality) {
				throw new Error("New cardinality is increasing.");
			}
			this.cardinality = newCardinality;
			if (this.cardinality == 0) {
				this.minimum = Infinity;
				this.maximum = -Infinity;
			}
		}
		this.checkArithmeticProgression();
	}

	checkArithmeticProgression() {
		if (!this.leaf) {
			throw new Error("Not an arithmetic progression.");
		}
		if (!Number.isInteger(this.cardinality) || this.cardinality < 0 ||
			(this.cardinality == 0 && this.minimum <= this.maximum) ||
			(this.cardinality == 1 && this.minimum != this.maximum) ||
			(this.cardinality >= 2 && this.minimum >= this.maximum)) {
			throw new Error("Arithmetic progression not properly initialised.");
		}
		if (this.cardinality >= 2) {
			const d = (this.maximum - this.minimum) / (this.cardinality - 1);
			if (!Number.isInteger(d) || d <= 0) {
				throw new Error("D is not a positive integer.");
			}
		}
	}

	checkReferenceNode(length) {
		if (!this.leaf) {
			throw new Error("Not an arithmetic progression.");
		}
		if (length >= this.length) {
			throw new Error("Reference node length too short.");
		}
		if (this.maximum - this.minimum > length) {  // at most a square
			throw new Error("Not a square.");
		}
	}
}

export class SLSTree extends SuffixTree {
	rules;
	internalNodeBins;
	alive;

	constructor() {
		super();
		this.rules = new Map();
		this.internalNodeBins = [];
		this.alive = [];
	}

	isAlive(start) {
		return start >= 0 && start < this.alive.length && this.alive[start];
	}

	isDead(start) {
		return !this.isAlive(start);
	}

	markDead(start) {
		if (this.isDead(start)) {
			throw new Error("Suffix is already dead.");
		}
		this.alive[start] = false;
	}

	extendLeafs(symbol) {
		this.internalNodeBins.push([]);
		this.alive.push(true);
		super.extendLeafs(symbol);
	}

	createRoot() {
		return new SLSNode(0, 0);
	}

	createInternalNode(start, length) {
		const node = new SLSNode(start, length);
		this.internalNodeBins[node.length].push(node);
		return node;
	}

	createLeaf(start) {
		return new SLSNode(start, Infinity)
	}

	splitEdgeSLS(point) {
		if (!point.implicit)
			throw new Error("Point not implicit.");
		const edge = this.getEdge(point);
		if (edge.length <= point.length)
			throw new Error("Lesser length expected.");
		const newNode = this.createInternalNode(edge.start, point.length);
		newNode.setEdge(this.at(point.start + point.length), edge);  // using point.start rather than edge.start
		point.node.replaceEdge(this.at(point.start + point.node.length), newNode);
		return newNode;
	}

	addRule(nonTerminal, expansion) {
		const start = this.length;
		this.add(expansion);
		this.add([Symbol()]);
		if (this.active.length != 0) {
			throw new Error("Active point not at root.");
		}
		this.rules.set(nonTerminal, new Interval(start, expansion.length));
		return nonTerminal;
	}

	addRules(rules) {
		for (const [nonTerminal, expansion] of rules) {
			this.addRule(nonTerminal, expansion);
		}
	}

	getRule(nonTerminal) {
		if (!this.rules.has(nonTerminal)) {
			throw new Error("Rule does not exist.");
		}
		return this.getPath(this.rules.get(nonTerminal)).filter(symbol => symbol != dead);
	}

	getRules() {
		const rules = new Map();
		for (const [nonTerminal, interval] of this.rules) {
			rules.set(nonTerminal, this.getPath(interval).filter(symbol => symbol != dead));
		}
		return rules;
	}

	addSubstitution(nonTerminal, expansion) {
		const start = this.length;
		for (const symbol of expansion) {
			this.extendLeafs(symbol);
		}
		this.active.length = expansion.length;
		this.canonize(this.active);
		if (this.active.implicit) {
			throw new Error("Active point is not explicit.");
		}
		this.addSymbol(this.active, Symbol());
		if (this.active.length != 0) {
			throw new Error("Active point not at root.");
		}
		this.rules.set(nonTerminal, new Interval(start, expansion.length));
		return nonTerminal;
	}

	compress(minimumLength = 2, createNonTerminal = Symbol) {
		if (!Number.isInteger(minimumLength) || minimumLength < 1) {
			throw new Error("Minimum length not a positive integer.");
		}

		for (let length = this.internalNodeBins.length - 1; length >= minimumLength; length--) {
			const bin = this.internalNodeBins[length];
			for (const node of bin) {
				if (node.isRepeatingFactor()) {
					const nonTerminal = createNonTerminal(this.rules.size);
					let path;
					let occurrenceCount = 0;
					for (const edge of node.edges.values()) {
						edge.checkReferenceNode(length);
						for (let i = 0; i < 2; i++) {
							if (edge.cardinality > 0) {
								const occurrence = edge.minimum;
								occurrenceCount++;
								if (occurrenceCount == 1) {
									path = this.slice(occurrence, length);
								}
								this.substituteOccurrence(occurrence, length, nonTerminal);
							}
						}
						if (edge.cardinality != 0) {
							throw new Error("More than two occurrences per edge.");
						}
					}
					if (occurrenceCount < 2) {
						throw new Error("Less than 2 occurrences.");
					}
	
					this.addSubstitution(nonTerminal, path);
				}
			}
			for (const node of bin) {
				node.makeArithmeticProgression();  // (lazy) bottom-up traversal of the tree issuing the numbers of the leaf nodes upward
			}
		}
	}

	substituteOccurrence(occurrence, length, nonTerminal) {
		let start = occurrence - length;
		while (this.isDead(start)) {  // skip past dead area
			if (start > occurrence) {
				throw new Error("Occurrence is dead.")
			}
			start++;
		}
		const end = occurrence + length;

		// delete positions start .. end
		const referencePoint = this.createRootPoint(start, length);
		for (let pos = start; pos < end; pos++) {
			if (this.hasEdge(referencePoint)) {
				const referenceNode = this.getEdge(referencePoint);
				referenceNode.checkReferenceNode(length);
				referenceNode.maintainArithmeticProgression(pos, end - pos);
				referenceNode.checkReferenceNode(length);
				if (referenceNode.cardinality == 0) {
					const deletedEdge = this.deleteEdge(referencePoint);
					if (deletedEdge != referenceNode) {
						throw new Error("Did not delete the reference node.");
					}
				}
			}
			if (referencePoint.end < this.length) {
				referencePoint.length++;
			}
			if (pos < end - 1) {
				this.followSuffixLink(referencePoint);
			}
		}

		// insert positions start .. occurrence
		let lastInternalNode = null;
		const insertPoint = this.createRootPoint(start, occurrence - start);
		for (let pos = start; pos < occurrence; pos++) {
			if (insertPoint.explicit) {
				insertPoint.node.setEdge(nonTerminal, this.createLeaf(pos));
				lastInternalNode?.setSuffixLink(insertPoint.node);
				lastInternalNode = null;
			} else {
				if (this.hasEdge(insertPoint)) {
					const insertNode = this.splitEdgeSLS(insertPoint);
					insertNode.setEdge(nonTerminal, this.createLeaf(pos));
					lastInternalNode?.setSuffixLink(insertNode);
					lastInternalNode = insertNode;
				} else {
					insertPoint.node.setEdge(this.at(pos + insertPoint.node.length), this.createLeaf(pos));
					lastInternalNode?.setSuffixLink(insertPoint.node);
					lastInternalNode = null;
				}
			}

			this.followSuffixLink(insertPoint);
		}
		lastInternalNode?.setSuffixLink(insertPoint.node);

		// substitute symbols occurrence .. end
		for (let pos = occurrence; pos < end; pos++) {
			this.markDead(pos);
			this.symbols[pos] = pos == occurrence ? nonTerminal : dead;
		}
	}
}
