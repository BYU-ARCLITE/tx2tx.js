var regConf = {
	//html: /<(?=p|\/p|div|\/div|h\d|\/h\d)[^>]*?>/g,
	//text: /[\n]+/g,
	lang: {
		en: {
			filter: ["Mrs.","Mr.","Ms.","Prof.","Dr.","Gen.","Rep.","Sen.","St.","Sr.","Jr.","Ph.D.","M.D.","B.A.","M.A.","D.D.S.","a.m.","p.m.","i.e.","etc."],
			regex: '[^\\.\\?!]+[\\.\\?!]*[\\)"]?(?![^<]*>)',
			postfix: '\\s+(?=[^a-zA-z0-9]*?[a-zA-Z0-9])'
		},
		ja: {
			regex: '[^\u3002]+[\u3002]+(\u300d|\u300f|\u300d\u300f)?(\uff08([^\uff09]+)\uff09)?'
		}
	}
};
