// requires regconf.js
var TextToArray = (function(){
	var proto;
	function Text(text, lang){
		var paragraph,doubleArray,that;
		that = this;
		this.text = text;
		this.lang = lang;

		return this.split(text).filter(function(p){
			return p.length > 0
		}).map(function(txt){
			var txtarray = txt.split(/[\n]+/g);
			if(txtarray.length > 1){
				var paragraphMultiSplit = [];
				txtarray.map(function(o){
					var p = that.splitSentences(lang, o);
					paragraphMultiSplit = paragraphMultiSplit.concat(p);
				});
				return paragraphMultiSplit;
			}
			return that.splitSentences(lang, txt);
		});
		//.map(function(p){return p.replace('\n',' ').trim();})
	}
	proto = Text.prototype;
	proto.split  = function(text){
		var i=1, rgx, smaller = true, txts = [],tl;
		while(smaller){
			rgx = new RegExp("[\\r\\n]{"+i+",}","g");
			txts.push(text.split(rgx));
			tl = txts.length;
			if(txts[tl-1].length == 1 ){
				smaller = false;
				continue;
			}
			i++;
		}
		if(tl > 1){
			return txts[tl-2];
		}
		return txts[tl-1];
	}
	proto.regexGenerator = function(lang){
		var regex,i,filter;
		if(lang.filter){
			filter = new RegExp(lang.filter.map(function(f){return f.replace(/\./g,"\\.");}).join('|'));
		}else{
			filter = {test: function(){ return false; }};
		}
		if(lang.postfix){
			regex = new RegExp("("+lang.regex+")("+ lang.postfix + "|$)", "g");
		}else{
			regex = new RegExp("("+lang.regex+")","g");
		}
		return {regex:regex, filter:filter};
	}

	proto.splitSentences = function(lang,text){
		var rgx, paragraph, sentence;
		rgx = this.regexGenerator(regConf.lang[lang]);
		paragraph = this.whilSplit(text,rgx.regex,rgx.filter);
		if(paragraph.length == 0){
			console.log("split fail", text);
			paragraph.push(text)
		}
		return paragraph;
	}
	proto.whilSplit = function(text,rgx,filter){
		var paragraph, sentence;
		paragraph = [];
		sentence = "";

		while((match = rgx.exec(text)) !=null){
			sentence += match[1] + " ";
			if(filter.test(match[1])){
				continue;
			}
			paragraph.push(sentence.trim());
			this.getLeftOvers(paragraph,text);
			sentence = "";
		}
		return paragraph;
	}
	proto.getLeftOvers = function(p,t){
		if( p.length < 2 ) {
			return;
		}
		var s1,s2;
		s1 = p[p.length-2];
		s2 = p[p.length-1];
		p[p.length-2] += t.substr(t.indexOf(s1)+s1.length,t.indexOf(s2)-(t.indexOf(s1)+s1.length));
	}
	return Text;
})();


