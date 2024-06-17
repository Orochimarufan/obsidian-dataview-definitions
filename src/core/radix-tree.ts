// Radix Tree

function commonPrefixLength(a: string, b: string) {
    const length = Math.min(a.length, b.length);
    for (let i = 0; i < length; ++i) {
        if (a[i] !== b[i])
            return i;
    }
    return length;
}

type Char = string & {length: 1};

/**
 * A node in a radix tree
 */
export class RTNode<T> {
    /**
     * The sub-key (the common prefix of all children)
     * @note The full (compound) key is the concatenation of this and all parent sub-keys
     * @note May be empty on the root node if no prefix is common to all leaves
     */
    key: string;
    /**
     * The value associated with the compound key
     * @note Not all intermediate nodes have values
     */
    value?: T;

    /**
     * Single-character properties are used for child nodes
     */
    [c: Char]: RTNode<T>;

    /**
     * Construct radix tree node
     * @param key The sub-key (relative to the parent node)
     * @param value The value to associate with the compound key
     */
    constructor(key: string, value?: T) {
        this.key = key;
        this.value = value;
    }

    // -- Properties --
    /**
     * Whether the node is proper (has a value)
     */
    isProper(): this is ProperRTNode<T> {
        return this.value !== undefined;
    }

    /**
     * The first character of the node key
     * @note The root node may not have a determinant
     */
    get determinant(): Char {
        return this.key[0] as Char;
    }

    /**
     * All of this node's children
     */
    get children(): RTNode<T>[] {
        return Object.entries(this).filter(([k, _]) => k.length === 1).map(([_, n]) => n);
    }

    /**
     * The number of children this node has
     */
    get length(): number {
        return Object.getOwnPropertyNames(this).filter(n => n.length === 1).length;
    }

    // -- Primitives --
    /**
     * Find a node in the sub-tree
     * @param key The sub-key to find (exact match)
     * @returns The corresponding node if found
     */
    find(key: string): RTNode<T>|undefined {
        // Check key
        const thiskey = this.key;
        const plen = commonPrefixLength(thiskey, key);
        if (plen < thiskey.length)
            // Doesn't exist
            return undefined;
        else if (plen === key.length)
            // Found it
            return this;
        else
            // May be child of this node
            return this[key[plen] as Char]?.find(key.slice(plen));
    }

    /**
     * Find a node in the sub-tree or create a new one for the key
     * @param key The sub-key to retrieve (exact match)
     * @returns Both the replacement for this node [0] and the retrieved matching node [1]
     */
    findOrCreate(key: string): [RTNode<T>, RTNode<T>] {
        // Check key
        const thiskey = this.key;
        const plen = commonPrefixLength(thiskey, key);
        if (plen < thiskey.length) {
            // must split this node
            const node = new RTNode<T>(thiskey.slice(0, plen));
            this.key = thiskey.slice(plen);
            node[thiskey[plen] as Char] = this;
            const leaf = (plen === key.length) ? node : node[key[plen] as Char] = new RTNode(key.slice(plen));
            return [node, leaf];
        } else if (plen === key.length) {
            // Found it
            return [this, this];
        } else {
            // new node is child of this one
            const det = key[plen] as Char;
            const child = this[det];
            let leaf;
            if (child === undefined)
                leaf = this[det] = new RTNode(key.slice(plen));
            else
                [this[det], leaf] = child.findOrCreate(key.slice(plen));
            return [this, leaf];
        }
    }

    /**
     * Merge or delete this node if unneeded
     * @returns Replacement for this node
     */
    rebalanceNode(): RTNode<T>|undefined {
        // Can't discard or merge proper node
        if (this.isProper())
            return this;
        const length = this.length;
        // Discard empty leaves
        if (length === 0)
            return undefined;
        // Merge branches with a single child
        if (length === 1) {
            const child = this.children[0];
            child.key = this.key + child.key;
            return child;
        }
        return this;
    }

    /**
     * Merge or delete unneeded nodes in subtree
     * @returns Replacement for this node
     */
    rebalance(): RTNode<T>|undefined {
        for (const child of this.children) {
            const det = child.determinant;
            const newchild = child.rebalance();
            if (newchild === undefined)
                delete this[det];
            else if (newchild.determinant !== det)
                throw Error('Rebalancing operation changed child determinant');
            else
                this[det] = newchild;
        }
        return this.rebalanceNode();
    }

    /**
     * Remove a key from the subtree (exact match)
     * @param key The sub-key to remove
     * @returns Replacement for this node
     * @note Includes a call to rebalanceNode()
     */
    remove(key: string): RTNode<T>|undefined {
        // Cannot use find(), need to call rebalanceNode() on return trip up the tree
        // Check key
        const thiskey = this.key;
        const plen = commonPrefixLength(thiskey, key);
        if (plen < thiskey.length) {
            // Doesn't exist
            return this;
        } else if (plen === key.length) {
            // Remove this value
            this.value = undefined;
        } else {
            // May be child of this node
            const d = key[plen] as Char;
            const child = this[d]?.remove(key.slice(plen));
            if (child === undefined)
                delete this[d];
            else
                this[d] = child;
        }
        // Call balanceNode() all the way up the tree
        return this.rebalanceNode();
    }

    // -- Simplified --
    /**
     * Find a sub-key's value (exact match)
     * @param key The sub-key to find
     * @returns The associated value or undefined if not found
     */
    get(key: string): T|undefined {
        return this.find(key)?.value;
    }

    /**
     * Set value for a sub-key
     * @param key The sub-key to set
     * @param value The value to set the key to
     * @param update Whether to overwrite an existing value
     * @returns Replacement for this node
     */
    set(key: string, value: T, update = true): RTNode<T> {
        const [self, leaf] = this.findOrCreate(key);
        if (leaf.value === undefined || update)
            leaf.value = value;
        return self;
    }
}

type ProperRTNode<T> = RTNode<T> & {value: T};

/**
 * Finds the longest prefix of some string that is included in a radix tree
 */
export class PrefixMatch<T> {
    /**
     * Records the path of radix tree nodes taken
     * @note Required to reconstruct the full key since nodes don't have parent references
     */
    path: RTNode<T>[];
    /**
     * The number of characters that match the last sub-key in the path, undefined if exact match
     */
    partial?: number;
    /**
     * Whether the path matches the complete string (as opposed to a prefix thereof)
     * @note A false value indicates that no nodes exist in the tree which match the given prefix
     */
    complete = true;

    constructor(root: RTNode<T>);
    constructor(path: RTNode<T>[]);
    constructor(root: RTNode<T>|RTNode<T>[]) {
        if (Array.isArray(root)) {
            this.path = root;
        } else {
            this.path = [root];
            if (root.key.length > 0)
                this.partial = 0;
        }
    }

    // -- Traversal --
    /**
     * The radix node representing the longest match
     * @note The returned node may match partially if !isExact()
     * @return The deepest node on the path
     */
    get node(): RTNode<T> {
        return this.path[this.path.length - 1];
    }

    /**
     * Truncate prefix path after some number of segments
     * @param segments The number of segments to keep (exclusive end)
     * @returns A new instance with the deepest segments removed
     */
    truncated(segments: number): PrefixMatch<T>|undefined {
        if (segments === 0)
            return undefined;
        return new PrefixMatch(this.path.slice(0, segments));
    }

    /**
     * Get the longest match with the final node satisfying a predicate
     * @param p The predicate
     * @param partial Whether to consider partial matches
     * @returns A new instance truncated to the matching segment
     */
    getLongestMatch(p: (n: RTNode<T>) => boolean, partial = false): PrefixMatch<T>|undefined {
        let i = this.path.length;
        if (!partial && !this.isExact())
            i -= 1;
        for (; i > 0; i -= 1) {
            if (p(this.path[i - 1]))
                return this.truncated(i);
        }
    }

    // -- Matching --
    /**
     * Continue matching against more data
     * @param str The data to match against
     * @returns The number of characters consumed
     * @note `feed(a); feed(b)` is equivalent to `feed(a + b)`
     */
    feed(str: string): number {
        // Matcher already mismatched
        if (!this.complete)
            return 0;
        let offset = 0;
        while (offset < str.length) {
            const work = str.slice(offset);
            if (this.partial === undefined) {
                // Child match
                const child = this.node[work[0] as Char];
                if (child === undefined) {
                    // Child mismatch
                    this.complete = false;
                    break;
                }
                // Continue with child
                this.path.push(child);
                this.partial = 0;
            }
            const key = this.node.key.slice(this.partial);
            const prefix = commonPrefixLength(key, work);
            this.partial += prefix;
            offset += prefix;
            // Incomplete node match
            if (prefix < key.length) {
                // Node mismatch
                if (prefix < work.length)
                    this.complete = false;
                break;
            }
            // Complete node match
            this.partial = undefined;
        }
        return offset;
    }

    /**
     * Match a string against a radix tree
     * @param root The tree root
     * @param str The string to match against the tree
     * @returns An instance describing the longest matching path
     * @note This is a short-hand for creating a new instance and calling feed() on it
     */
    static match<T>(root: RTNode<T>, str: string): PrefixMatch<T> {
        const m = new PrefixMatch(root);
        m.feed(str);
        return m;
    }

    // -- Inspection --
    /**
     * Whether the match is exact (the path doesn't end in a partial match)
     */
    isExact(): boolean {
        return this.partial === undefined;
    }

    /**
     * Whether the match is an explicit node with value
     */
    isProper(): this is ProperPrefixMatch<T> {
        return this.isExact() && this.node.isProper();
    }

    /**
     * Whether the match has concluded by encountering un-matchable characters
     */
    isFailed(): boolean {
        return !this.complete;
    }

    /**
     * Get the longest proper match
     */
    get proper(): (ProperPrefixMatch<T>)|undefined {
        return this.getLongestMatch(n => n.isProper()) as ProperPrefixMatch<T>|undefined;
    }

    /**
     * Get the longes match corresponding to a radix node
     */
    get exact(): PrefixMatch<T>|undefined {
        return this.isExact() ? this : this.path.length > 1 ? this.truncated(-1) : undefined;
    }

    /**
     * Get the matched key
     */
    get key(): string {
        const key = this.path.map(n => n.key).join('');
        return (this.partial === undefined) ? key : key.slice(0, -(this.node.key.length - this.partial));
    }

    /**
     * Faster alternative to .key.length
     * @returns The length of the matched key
     */
    get key_length(): number {
        const offset = this.partial === undefined ? 0 : -(this.node.key.length - this.partial);
        return this.path.map(n => n.key.length).reduce((a, b) => a + b, offset);
    }

    /**
     * The value associated with the longest match
     * @note Only available for proper paths, may return bogus for non-exact paths
     * @return The value
     */
    get value(): T | undefined {
        return this.node.value;
    }
}

type ProperPrefixMatch<T> = PrefixMatch<T> & {value: T};

/**
 * Simple wrapper around a radix tree root node
 */
export class RadixTree<T> {
    root?: RTNode<T>;

    /**
     * Set a key in the tree
     * @param key The key to set
     * @param value The value to store
     */
    set(key: string, value: T) {
        if (this.root === undefined)
            this.root = new RTNode(key, value);
        else
            this.root = this.root.set(key, value);
    }

    /**
     * Remove a key from the tree
     * @param key The key to remove
     */
    remove(key: string) {
        if (this.root !== undefined)
            this.root = this.root.remove(key);
    }

    /**
     * Retrieve a key from the tree (key must match exactly)
     * @param key The key to retrieve
     * @returns The stored value or undefined if not found
     */
    get(key: string): T|undefined {
        return this.root?.get(key);
    }

    /**
     * Check whether a key has a value in the tree
     * @param key The key to look up
     * @returns Whether the key exists and has a value
     */
    has(key: string): boolean {
        return this.root?.find(key)?.isProper() ?? false;
    }

    /**
     * Find the longest matching prefix in the tree
     * @param str The string to match the prefix of
     * @returns A PrefixMatch object
     */
    match(str: string): PrefixMatch<T>|undefined {
        return this.root ? PrefixMatch.match(this.root, str) : undefined;
    }

    /**
     * Clear all content
     */
    clear() {
        this.root = undefined;
    }
}
