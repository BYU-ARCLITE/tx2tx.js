
// Text-to-Text aligner.  Can be used for one or two texts at a time.
// requires Ractive.js library, TextToArray.js, uuid.js, regconf.js
var TextToText = (function(global){
	'use strict';
	var Proto, TextGetter,TextForm,TextAligner;
	function TextToText(container, callback){
		var textGetter, textAligner;
		textGetter = new TextGetter(container, function(textarrays){
			textAligner = new TextAligner(container,textarrays,function(texts){
				callback(texts);
			});
		});
	}
	Proto = TextToText.prototype;

	TextGetter = (function(){
		var proto;
		function TextGetter(el, callback){
			var self=this;
			this.callback = callback;
			this.ractive = new Ractive({
				el: el,
				template: '#textQueryTemplate',
				data:{
					chosen: false,
				number: 1,
				textform: []
				}
			});
			this.ractive.on({
				setforms: function(){
					self.setForms(this.get('number'));
					this.set('chosen', true);
				},
				align: function(){
					self.collect();
				}
			});
		}
		proto = TextGetter.prototype;
		proto.texts = [];
		proto.forms = [];
		proto.setForms = function(num){
			var i, tform = [], self=this;

			for(i = 0; i< num; i++){
				tform.push({id:UUID.randomToken()});
			}
			this.ractive.set('textform', tform);
			this.ractive.get('textform').map(function(o){
				var el = self.ractive.nodes['form'+o.id];
				self.forms.push(new TextForm(el,function(textarray, lang){
					self.texts.push({text:textarray,lang:lang});	
					if(self.checkIfDone()){
						self.ractive.teardown();						
						self.callback.call(self,self.texts);
					}
				}));
			});
		}
		proto.checkIfDone = function(){
			var done = true;
			this.forms.map(function(f){
				if(f.complete !== true){
					done = false
				}
			});
			return done;
		};
		return TextGetter;
	})();

	TextForm = (function(){
		var proto;
		function TextForm(el,call){
			var la,box,self=this;
			la = UUID.randomToken();
			box = UUID.randomToken();
			var cleared = false;
			this.callback = call;
			this.ractive = new Ractive({
				el: el,
				template: '#textFormTemplate',
				data:{
					la: la,
					box: box,
					langs: Object.keys(regConf.lang),
					complete: false
				}
			});
			this.textbox = this.ractive.nodes[box];
			this.setListeners();

		}
		proto = TextForm.prototype;

		proto.setListeners = function(){
			var self = this;
			this.textbox.addEventListener('paste', function(e){return self.getData(e,e.clipboardData)});
			this.textbox.addEventListener("dragover", this.handleDragOver, false);
			this.textbox.addEventListener("dragleave", this.handleDragLeave, false);
			this.textbox.addEventListener("drop", function(e){return self.getData(e,e.dataTransfer)},false);
		};
		proto.getData = function(e,dt){
			var text, type,lang,textarray;
			e.stopPropagation();
			e.preventDefault();
			type = dt.types.contains("text/html")?"text/html":dt.types[dt.types.length-1];
			text = dt.getData(type).trim();
			if(type === "text/html" ){
				text = this.preprocess(text).trim();
			}
			lang = this.ractive.get('lang') || 'en';
			textarray = new TextToArray(text,lang);
			this.complete = true;
			this.ractive.set('complete', true);
			this.callback.call(this, textarray, lang);
			return false;
		}
		proto.handleDragLeave = function(e){
			e.target.classList.add('dragover');
		}
		proto.handleDragOver= function(e){
			e.preventDefault();
			e.target.classList.add('dragover');
		}
		proto.preprocess = function(text){
			var output,
					crx = /[\r\n\t]+/g,
					exsv = /[\r\n]{3,}/g,
					//crx1 = /<(?=p|\/p|div|\/div|h\d|\/h\d)[^>]*?>/g,
					ptag = /<[\/]*(span|p|div|blockquote|br)[^>]*>/g;
			output = text.replace(crx, "").replace(ptag, "\n").replace(exsv,"\n\n");
			return output;
		}
		return TextForm;
	})()


	TextAligner = (function(){
		var proto,handleAction, joinToEnd;
		function TextAligner(container, texts,callback){
			var self = this, data, pIndex, showParagraphs, shortIndex, shortP, longIndex, longP;
			data = {
				texts: texts,
				completed: false
			};

			this.ractive = new Ractive({
				el: container,
				template: '#humanAlignerTemplate',
				data: data
			});
			Object.defineProperties(this, {
				showParagraphs: {
					get: function(){return showParagraphs;},
					set: function(i){showParagraphs = i; this.ractive.set('showParagraphs',showParagraphs);}
				},
				pIndex: {
					get: function(){return pIndex;},
					set: function(i){pIndex = i; this.ractive.set('pIndex',pIndex);}
				},
				shortIndex: {
					get: function(){return shortIndex;},
					set: function(i){shortIndex = i; this.ractive.set('shortIndex',shortIndex);this.ractive.set('shortIndexp',shortIndex+1);}				
				},
				longIndex: {
					get: function(){return longIndex;},
					set: function(i){longIndex = i; this.ractive.set('longIndex',longIndex);}				
				},
				shortP: {
					get: function(){return shortP;},
					set: function(i){shortP = i; this.ractive.set('shortP',shortP);}				
				},
				longP: {
					get: function(){return longP;},
					set: function(i){longP = i; this.ractive.set('longP',longP);}				
				}
			});
			this.showParagraphs = true;
			this.pIndex = 0;
			this.shortP = 0;
			this.longP = 0;
			this.ractive.on({
				done: function(){
					this.teardown();
					callback(texts);
				},
				split: function(){this.set('btn','split');},
				join: function(){this.set('btn','join');},
				splitPg: function(){this.set('btn','splitPg');},
				joinPg: function(){this.set('btn','joinPg');},
				handleParagraph: function(e){
					var pg = texts[e.index.lIndex].text[e.index.tIndex];
					if(this.get('btn') == 'splitPg'){
						texts[e.index.lIndex].text.splice(e.index.tIndex+1,0,texts[e.index.lIndex].text[e.index.tIndex].splice(e.index.sIndex));
					}
					if(this.get('btn') == 'joinPg'){
						if(e.index.tIndex == 0){return;}
						texts[e.index.lIndex].text[e.index.tIndex-1] = texts[e.index.lIndex].text[e.index.tIndex-1].concat(texts[e.index.lIndex].text.splice(e.index.tIndex,1));
					}
					handleAction.call(this,e,pg,texts);
					if(!this.get('completed')){self.start(texts);}
				},
				handleSentence: function(e){
					var pg = texts[e.index.lIndex].text[self.pIndex];
					handleAction.call(this,e,pg,texts);
				},
				sentenceUp: function(e){
					var longPg = texts[self.longP].text[self.pIndex]; 
					longPg[self.longIndex-1] += " "+longPg.splice(self.longIndex,1);
					self.doNextParagraph(texts);
				},
				sentenceDown: function(){
					var longPg = texts[self.longP].text[self.pIndex], 
					shortPg = texts[self.shortP].text[self.pIndex];
					if(self.shortIndex +2 == shortPg.length){
						joinToEnd(longPg,self.longIndex);
					}
					self.shortIndex++;
					self.longIndex++;
					self.doNextParagraph(texts);
				}
			});
			this.start(texts);
		}
		handleAction = function(e,pg,text){
			if(this.get('btn') =='split'){
				var selText, splitIndex,sentence1,sentence2;
				selText = getSelectedText();
				splitIndex = pg[e.index.sIndex].indexOf(selText,0);
				console.log(splitIndex);
				sentence1 = pg[e.index.sIndex].substr(0,splitIndex);
				sentence2 = pg[e.index.sIndex].substr(splitIndex);
				pg[e.index.sIndex] = sentence1;
				pg.splice(e.index.sIndex+1,0,sentence2);
			}
			if(this.get('btn') =='join'){
				if(e.index.sIndex == 0){return;}
				pg[e.index.sIndex-1] += " "+pg.splice(e.index.sIndex,1);
			}
			this.set('btn','');
			this.update();
		};
		joinToEnd = function(pg,index){
						pg[index] += " "+pg.splice(index+1,pg.length-index-1).join(' ');
		};
		proto = TextAligner.prototype;

		proto.start= function(texts){
			// check paragraph cohesion
			var i, length;
			if(texts.length <2){
				this.showParagraphs = true;
				this.ractive.set('completed', true);
				return;
			}
			for(i=0;i<texts.length;i++){
				length = length || texts[i].text.length;
				if(texts[i].text.length !== length){
					this.showParagraphs = true;
					return;
				}
			}
			this.doNextParagraph(texts);
		}

		proto.doNextParagraph = function(texts){
			this.getNextUneven(texts);
			this.showParagraphs = ~this.pIndex?false:true;
			if(!this.showParagraphs){
				this.checkLengths(texts);
			}
			if(this.pIndex == -1){
				this.ractive.set('completed', true);
			}
		}

		proto.checkLengths = function(texts){
			var i,lL,lI,sL,sI,p;
			for(i=0;i<texts.length;i++){
				p = texts[i].text[this.pIndex];
				lL = lL || p.length;
				sL = sL || p.length;
				if(p.length >= lL){lI = i;}
				if(p.length <= sL){sI = i;}
			}
			if(texts[sI].text[this.pIndex].length == 1){
				joinToEnd(texts[lI].text[this.pIndex],0);
				this.doNextParagraph(texts);
			}
			this.longP = lI;
			this.shortP = sI;
		}


		proto.getNextUneven = function(texts){
			var even = true,i;
			while (even) {
				var len = undefined;
				if(this.pIndex >= texts[0].text.length){
					this.pIndex = -1;
					return;
				}
				for(i=0;i<texts.length;i++){
					var l = texts[i].text[this.pIndex].length;
					len = len || l;
					even = len == l;
					if(!even){ return; }
				}
				this.shortIndex = 0;
				this.longIndex = 1;
				this.pIndex++;
			}
		}

		return TextAligner;
	})()
	function getSelectedText(){
		var t = '';
		if(window.getSelection){
			t = window.getSelection();
		}else if(document.getSelection){
			t = document.getSelection();
		}else if(document.selection){
			t = document.selection.createRange().text;
		}
		return String(t);
	}


	return TextToText;
})(window);


