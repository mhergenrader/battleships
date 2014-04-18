// for first iteration: non-auto-balancing tree

// should I set up some of these methods as asynchronous?

var BinarySearchTree, BST;

BinarySearchTree = BST = function(compare) {
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
	var newNode, self = this, rv;
	if(object == null || object !== object) { // don't allow null or undefined objects; also don't allow literal NaN values - these don't compare (< and > will both return false)
		console.log('Error: cannot add invalid objects null or undefined');
		return null;
	}
	if(typeof this.compare !== 'function') {
		console.log('Error: cannot add to BST w/o a valid compare function');
		return null;
	}
	
	newNode = new TreeNode(object);
	
	if(this.root == null) {
		this.root = newNode;
		rv = true;
	} else {
		rv = (function addNewNode(root) {
			var compValue = self.compare(object,root.object); // how does this function operate wrt scope chain?
			if(compValue < 0) {
				if(root.left == null) {
					root.left = newNode;
					return true;
				} else {
					addNewNode(root.left);
				}
			} else if(compValue > 0) {
				if(root.right == null) {
					root.right = newNode;
					return true;
				} else {
					return addNewNode(root.right);
				}
			} else {
				console.log('Error: could not add new object ' + object);
				return false; // could not add new node
			}
		})(this.root);
	}
	
	if(rv) {
		this.size++;
	}
	return rv ? newNode : null;	
};

// need to return the value here that we are deleting
BinarySearchTree.prototype.removeNode = function(object) {
	
};

BinarySearchTree.prototype.hasValue = function(object) {
	var found = false, self = this;
	this.forEach(function(nodeObject) {
		if(self.compare(nodeObject,object) === 0) {
			found = true;
		}
	});
	return found;
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


(function test() {
	var t = new BinarySearchTree(function(a,b) {
		return a - b;
	});
	t.addNode(3);
	t.addNode(2);
	t.addNode(5);
	t.addNode(7);
	t.addNode(6);
	t.addNode(NaN);
	t.addNode('hi'); // good!
	
	t.forEach(function(nodeObject) {
		console.log(nodeObject);
	});
	
	console.log('has 5? ' + t.hasValue(5)); // woohoo!
	console.log('has 5? ' + t.hasValue(8));
})();

