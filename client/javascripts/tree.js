
function BinarySearchTree(compare) {
	if(!(this instanceof BinarySearchTree)) {
		return new BinarySearchTree(compare); // compare callback
	}
	this.root = null;
	this.size = 0;
	this.compare = compare;
}


function TreeNode(object) {
	if(!(this instanceof TreeNode)) {
		return new TreeNode(object);
	}
	this.object = object; // any free-form object - TreeNode is just a wrapper
	this.left = null;
	this.right = null;
}

BinarySearchTree.prototype.addNode = function(object) {
	
};

BinarySearchTree.prototype.removeNode = function(object) {
	
};

BinarySearchTree.prototype.hasValue = function(object) {
	
};

// simple in-order traversal that works on the object of each TreeNode
BinarySearchTree.prototype.forEach = function(callback) { 
	if(typeof callback === 'function') {
		// this still has visibility to the callback parameter! (but does it get worse the more recursion there is? for more stack frames?)
		(function recurse(root) {
			if(root.left !== null) {
				recurse(root.left);
			}
			callback(root.object);
			if(root.right !== null) {
				recurse(root.right);
			}
		})(this.root);
	}
};


