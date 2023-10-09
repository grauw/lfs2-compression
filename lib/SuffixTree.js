export class Interval {
	start;
	length;

	constructor(start = 0, length = Infinity) {
		if (start < 0)
			throw new Error("Start must not be negative.");
		if (length < 0)
			throw new Error("Length must not be negative.");
		this.start = start;
		this.length = length;
	}

	get end() {
		return this.start + this.length;
	}
}

export class Node extends Interval {
	edges;
	suffixLink;

	constructor(start, length) {
		super(start, length);
		this.edges = this.leaf ? null : new Map();
		this.suffixLink = null;
	}

	get root() {
		return this.length == 0;
	}

	get internal() {
		return this.length > 0 && this.length < Infinity;
	}

	get leaf() {
		return this.length == Infinity;
	}

	setSuffixLink(node) {
		if (!this.internal)
			throw new Error("Internal node expected.");
		if (!node.internal && !node.root)
			throw new Error("Internal or root node expected.");
		if (this.suffixLink !== null)
			throw new Error("Node already has a suffix link.");
		this.suffixLink = node;
	}

	hasEdge(symbol) {
		return this.edges.has(symbol);
	}

	getEdge(symbol) {
		if (!this.edges.has(symbol))
			throw new Error("Edge does not exist.");
		return this.edges.get(symbol);
	}

	setEdge(symbol, edge) {
		if (edge.length <= this.length)
			throw new Error("Edge too short.");
		if (this.edges.has(symbol))
			throw new Error("Edge already exists.");
		this.edges.set(symbol, edge);
	}

	replaceEdge(symbol, edge) {
		if (edge.length <= this.length)
			throw new Error("Edge too short.");
		if (!this.edges.has(symbol))
			throw new Error("Edge does not exist.");
		this.edges.set(symbol, edge);
	}

	deleteEdge(symbol) {
		const edge = this.edges.get(symbol);
		if (!this.edges.delete(symbol)) {
			throw new Error("Edge does not exist.");
		}
		return edge;
	}
}

export class Point {
	#node;
	#start;
	#length;

	constructor(node, start = 0, length = 0) {
		this.#node = node;
		this.#start = start;
		this.#length = length;
		this.#check();
	}

	clone() {
		return new Point(this.#node, this.#start, this.#length);
	}

	get node() {
		return this.#node;
	}

	set node(node) {
		this.#node = node;
		this.#check();
	}

	get start() {
		return this.#start;
	}

	set start(start) {
		this.#start = start;
		this.#check();
	}

	get length() {
		return this.#length;
	}

	set length(length) {
		this.#length = length;
		this.#check();
	}

	get end() {
		return this.#start + this.#length;
	}

	get explicit() {
		return this.#length == this.#node.length;
	}

	get implicit() {
		return this.#length > this.#node.length;
	}

	get bottom() {
		return this.#length < 0;
	}

	#check() {
		if (this.#node.leaf || this.#start < 0 || (this.#length < this.#node.length && !(this.#length < 0 && this.#node.root))) {
			throw new Error("Invalid state.");
		}
	}
}

export class SuffixTree {
	symbols;
	root;
	active;

	constructor() {
		this.symbols = [];
		this.root = this.createRoot();
		this.active = this.createRootPoint();
	}

	get length() {
		return this.symbols.length;
	}

	at(index) {
		if (index >= 0 && index < this.symbols.length) {
			return this.symbols[index];
		} else {
			throw new Error("Index out of bounds.");
		}
	}

	slice(index = 0, length = Infinity) {
		if (index >= 0 && index <= this.symbols.length) {
			return this.symbols.slice(index, index + length);
		} else {
			throw new Error("Index out of bounds.");
		}
	}

	getPath(interval) {
		return this.slice(interval.start, interval.length);
	}

	add(symbols) {
		for (const symbol of symbols) {
			this.addSymbol(this.active, symbol);
		}
	}

	extendLeafs(symbol) {
		this.symbols.push(symbol);
	}

	createRoot() {
		return new Node(0, 0);
	}

	createInternalNode(start, length) {
		return new Node(start, length);
	}

	createLeaf(start) {
		return new Node(start, Infinity)
	}

	createRootPoint(start = 0, length = 0) {
		const point = new Point(this.root, start, length);
		this.canonize(point);
		return point;
	}

	search(point, symbols) {
		for (const symbol of symbols) {
			if (this.test(point, symbol)) {
				if (point.explicit) {
					point.start = point.node.getEdge(symbol).start;
				}
				point.length++;
				this.canonize(point);
			} else {
				return false;
			}
		}
		return true;
	}

	test(point, symbol) {
		if (point.bottom) {
			return true;
		} else if (point.explicit) {
			return point.node.hasEdge(symbol);
		} else if (point.implicit) {
			const edge = this.getEdge(point);
			return this.at(edge.start + point.length) === symbol;
		} else {
			throw new Error("Invalid state.");
		}
	}

	followSuffixLink(point) {
		if (point.node.suffixLink === null) {
			if (!point.node.root)
				throw new Error("Root node expected.")
		} else {
			if (!point.node.suffixLink)
				throw new Error("Suffix link expected.");
			point.node = point.node.suffixLink;
		}
		point.start++;
		point.length--;
		this.canonize(point);
	}

	canonize(point) {
		while (point.implicit && this.hasEdge(point)) {
			const edge = this.getEdge(point);
			if (point.length >= edge.length) {
				point.node = edge;
			} else {
				break;
			}
		}
	}

	addSymbol(point, symbol) {
		let lastInternalNode = null;
		this.extendLeafs(symbol);

		// Create new interior nodes as needed
		while (!this.test(point, symbol)) {
			if (point.explicit) {
				this.addLeafEdge(point.node, point.start);
				lastInternalNode?.setSuffixLink(point.node);
				lastInternalNode = null;
			} else if (point.implicit) {
				const internalNode = this.splitEdge(point);
				this.addLeafEdge(internalNode, point.start);
				lastInternalNode?.setSuffixLink(internalNode);
				lastInternalNode = internalNode;
			} else {
				throw new Error("Invalid state.");
			}
			this.followSuffixLink(point);
		}

		lastInternalNode?.setSuffixLink(point.node);

		point.length++;
		this.canonize(point);
	}

	splitEdge(point) {
		if (!point.implicit)
			throw new Error("Point not implicit.");
		const edge = this.getEdge(point);
		if (edge.length <= point.length)
			throw new Error("Lesser length expected.");
		const newNode = this.createInternalNode(edge.start, point.length);
		newNode.setEdge(this.at(edge.start + point.length), edge);
		point.node.replaceEdge(this.at(point.start + point.node.length), newNode);
		return newNode;
	}

	addLeafEdge(node, start) {
		const newLeaf = this.createLeaf(start);
		node.setEdge(this.at(start + node.length), newLeaf);
		return newLeaf;
	}

	hasEdge(point) {
		if (point.implicit) {
			return point.node.hasEdge(this.at(point.start + point.node.length));
		} else {
			return point.node.hasEdge(this.at(point.end));
		}
	}

	getEdge(point) {
		if (point.implicit) {
			return point.node.getEdge(this.at(point.start + point.node.length));
		} else {
			return point.node.getEdge(this.at(point.end));
		}
	}

	deleteEdge(point) {
		if (point.implicit) {
			return point.node.deleteEdge(this.at(point.start + point.node.length));
		} else {
			return point.node.deleteEdge(this.at(point.end));
		}
	}
}
