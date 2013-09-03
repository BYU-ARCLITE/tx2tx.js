
var UUID = (function(){
	return { 
		s4: function(){
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		},
		randomToken: function(){
			var s4 = this.s4;
			return s4() + s4() + s4();
		},
		guid: function(){
			var s4 = this.s4;
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		}
	}

})();
