var mdg_draw = function(_base) {
	
this.base = $(_base) ;
this.svg = $("svg",base) ;
this.bpos = {} ;	
this.em = parseInt($('html').css('font-size')) ;
this.genebase = [];

var lp,le ;
this.setobj = function(data,delay) {
    this.genebase = [];
	$('div,table',this.base).remove() ;
	lp = {x:1,y:1} ;
	for(var i in data.box) {
		var pos = this.create(true,data.box[i]) ;
		this.bpos[data.box[i].id] = pos ;
	}
    for(var i in data.gene){
        this.creategene(data.gene[i]);
    }
	var self = this ;
	this.redraw(data,delay);
}
this.redraw = function(data,delay) {	
	var s = [] ;
	for(var id in this.bpos) {
		$('#'+id).css('left',this.bpos[id].x+"rem").css('top',this.bpos[id].y+"rem") ;
	}
	var base = this.base ;
    $("#base .label").remove();
    $("svg", base).remove() ;
    setTimeout($.proxy(function() {
		s=[] ;
		for(var i in data.conn) {	
			var c = data.conn[i]
			l = this.connect($("#"+c.from),$("#"+c.to),c.param) ;
			if(l!=null) {for(var j in l) {s.push(l[j]) ;}}
		}
		base.append("<svg>"  + s.join("") + "</svg>");
	},this),(delay==true)?500:0) ;

}
this.setpos = function(id,x,y) {
//	console.log(`savepos ${id} ${x}-${y}`) ;
	this.bpos[id] = {x:parseFloat(x),y:parseFloat(y)} ;
}

function round(x) { return Math.floor(x*10)/10; }

// create dom block 
this.create = function(editable,box) {
	var d = editable?"true":"false" ;
	var type,inner;
	if(typeof box.inner == "object" || box.title!=null) {
		if(typeof box.inner != "object") box.inner = [box.inner] ;
		for(var tr in box.inner) {
			var tt = box.inner[tr].split(" | ") ;
			if(tt.length>1) {
                box.inner[tr] = tt.join("</td><td>") ;
			} 
		}
		type ="<table>" ;
		inner = "<tr><td>"+box.inner.join("</td></tr><tr><td>")+"</td></tr>";
        if(box.title!=null) inner = "<tr><th>"+box.title+"</th></tr>" +inner;
	} else {
		type = "<div>" ;
		inner = box.inner;
	}
	var pos = box.pos ;
	if(pos==undefined) {
		pos =  lp ;
	}
    var e = $(type).addClass("box").attr('id',box.id).attr('title',box.id).
		attr('draggable',d).attr('align',"center").html(inner) ;
	if(box.cls) {
		if(typeof box.cls == "string") box.cls = [box.cls] ;
		for(var i in box.cls) e.addClass(box.cls[i]) ;
	}
	this.base.append(e) ;
	lp = {x:parseInt(pos.x) + round(parseInt(e.css('width'))/this.em)+2,y:parseInt(pos.y)+1};
	return pos ;
}
this.creategene = function(gene) {
	var type,inner;
    type = "<div>";
    inner = gene.inner;    
    var g = {id:gene.id, inner:inner, cls:gene.cls, count:1};
    this.genebase.push(g);
}

// draw connect line 
this.connect = function(o1,o2,param) {
	if(o1.length==0 || o2.length==0) return null ;
	var sp = setConnectPos(o1,param.s_pos) ;
	var ep = setConnectPos(o2,param.e_pos) ;
    var fillcol = "#2c3e50";
//	console.log(sp); 
//	console.log(ep) ;
    var ret = [];
    if(param.gene != undefined){
        var id = param.gene;
        for(var i in this.genebase){
            if(id == this.genebase[i].id){
                var gene = this.genebase[i];
                var xdif = Math.abs(ep.x - sp.x);
                var ydif = Math.abs(ep.y - sp.y);
                var mdx = ep.x > sp.x ? xdif/2 + sp.x : xdif/2 + ep.x;
                var mdy = ep.y > sp.y ? ydif/2 + sp.y : ydif/2 + ep.y;
                //md = {x:mdx + h, y: mdy + v};
                md = {x:mdx, y:mdy};
                var newid = id + "_" + gene.count;
                g = $("<div>").addClass("label").attr("id", newid).html(gene.inner).css('left', mdx+"px").css('top',mdy+"px");
                this.base.append(g);
                if(gene.cls) {
                    if(typeof gene.cls == "string") gene.cls = [gene.cls] ;
                      for(var j in gene.cls) g.addClass(gene.cls[j]) ;
                }
                var Rawwidth = g.get(0).offsetWidth;
                var RawHeight = g.get(0).offsetHeight;
                var margine = 5;
                var margine2 = 10;
                if(param.gpos != undefined){
                    if(param.gpos.match(/^u/)){
                        g.css('left',(md.x - Rawwidth/2)+"px").css('top',(md.y - RawHeight - margine2)+"px"); 
                        ep.y = ep.y - margine;
                        sp.y = sp.y -margine;
                    } else if(param.gpos.match(/^d/)){
                        g.css('left',(md.x - Rawwidth/2)+"px").css('top',(md.y + margine2)+"px"); 
                        ep.y = ep.y + margine;
                        sp.y = sp.y + margine;
                    } else if(param.gpos.match(/^l/)){
                        g.css('left',(md.x - Rawwidth - margine2)+"px").css('top',(md.y - RawHeight/2)+"px"); 
                        ep.x = ep.x - margine;
                        sp.x = sp.x - margine;
                    } else if(param.gpos.match(/^r/)){
                        g.css('left',(md.x + margine2)+"px").css('top',(md.y - RawHeight/2)+"px"); 
                        ep.x = ep.x + margine;
                        sp.x = sp.x + margine;
                    }
                }else{
                    g.css('left',(md.x - Rawwidth/2)+"px").css('top',(md.y - RawHeight/2)+"px");
                }
            }
        }
    }
	var cls = "" ;
	if(param.cls) {
		var c = param.cls.split(" ") ;
		var cc = [] ;
		for(var i in c) {
			if(c[i].match(/^S|B$/)) {
				param.type = c[i] ;
			} else {
                cc.push(c[i]) ;
                if(!c[i].match(/^l_.*$/)){
                fillcol = c[i];
                }
            }
		}
		if(cc.length>0) cls = 'class="'+cc.join(" ")+'"' ;
	}
    if(Math.abs(sp.x - ep.x) < 10) {ep.x = sp.x;}
    else if (Math.abs(sp.y - ep.y) <10) {ep.y = sp.y;}
	if(param.type=="S") {
		ret.push('<path d="M ' + sp.x + ' ' + sp.y + ' L ' + ep.x + ' ' + ep.y + ' ' + '" ' + cls + ' fill="None" />') ;
	} else {
		var pm = 50 ;
		ret.push('<path d="M ' + sp.x + ' ' + sp.y + ' C ' + (sp.x+sp.vx*pm) + ' ' + (sp.y+sp.vy*pm) + ' ' + (ep.x+ep.vx*pm) + ' ' + (ep.y+ep.vy*pm)  + ' ' + (ep.x) + ' ' + (ep.y) + '" ' + cls  + ' ' + 'fill="None" />') ;
	}
	if(param.arrow) {
		var th = 3.14159*35/180 ;
		var an = 10 ;
		var v,p ;
		function rot(v,th) {
			var px = v.x * Math.cos(th) - v.y * Math.sin(th) ;
			var py = v.x * Math.sin(th) + v.y * Math.cos(th) ;
			var vn = Math.sqrt(px*px+py*py) ;
			return {x:px/vn,y:py/vn} ;		
		}
		function av(sp,ep) {
			v = (param.type=="S")?{x:sp.x-ep.x ,y:sp.y-ep.y}:{x:ep.vx,y:ep.vy} ;
			p1 = rot(v,th) ;
			p2 = rot(v,-th) ;
//            ret.push(`<polygon points="${round(ep.x+p1.x*an)},${round(ep.y+p1.y*an)} ${ep.x},${ep.y} ${round(ep.x+p2.x*an)},${round(ep.y+p2.y*an)}" />`); //fill="green" stroke="black" stroke-width="2"  三角で矢印。色等が変わらない問題
			ret.push('<path d="M ' + ' ' + round(ep.x+p1.x*an) + ' ' + round(ep.y+p1.y*an)  + ' L ' + ep.x + ' ' + ep.y + ' L ' + round(ep.x+p2.x*an)  + ' ' + round(ep.y+p2.y*an)  + ' Z" fill=' + fillcol + ' ' + cls  + '/>')
		}
		if(param.arrow=="b"||param.arrow=="t") av(sp,ep) ;
		if(param.arrow=="b"||param.arrow=="f") av(ep,sp) ;
	}
	return ret //	return {sp:sp,ep:ep} ;
}
    
// connectionの位置を計算
function setConnectPos(o,f) {
    var sx = parseInt(o.css('left')) ;
    var sy = parseInt(o.css('top')) ;
    var w = parseInt(o.css('width')) ;
    var h = parseInt(o.css('height')) ;
    var px,py,vx,vy ;
    var t = $('tr',o) ;
    var d = $('th,td',o) ;
    if(t.length>0 && f.match(/(l|r)([0-9]+)/)) {
        vy = 0 ;
        if(RegExp.$1=="l") {
            px = sx ;
            vx = -1 ;
        } else if(RegExp.$1=="r") {
            px = sx+w ;
            vx = 1 ;
        }
        var tn = RegExp.$2-1 ;
        py = sy + t[tn].offsetTop+t[tn].offsetHeight/2 ;
    } else if(d.length>0 && f.match(/(u|d)([0-9]+)/)) {
        vx = 0 ;
        if(RegExp.$1=="u") {
            py = sy ;
            vy = -1 ;
        } else if(RegExp.$1=="d") {
            py = sy+h ;
            vy = 1 ;
        }
        var tn = (RegExp.$2!=undefined)?RegExp.$2-1:0 ;
        px = sx + d[tn].offsetLeft+d[tn].offsetWidth/2 ;
    } else {
        switch(f.substr(0,1)) {
            case 'u':
                px = sx+w/2 ;py = sy ; vx=0 ;vy=-1; break ;
            case 'd':
                px = sx+w/2 ;py = sy+h ; vx=0;vy=1; break ;
            case 'l':
                px = sx ;py = sy + h/2 ; vx=-1;vy=0; break ;
            case 'r':
                px = sx+w ;py = sy + h/2 ; vx=1;vy=0; break ;
            default:
        }
    }
    return {x:px,y:py,vx:vx,vy:vy} ;
}
    

// md parser
this.m_h = /^\[([a-z0-9-_]+)\]\s*(?:\((.*)\))?\s*(?:<\s*([0-9\.]+)\s*,\s*([0-9\.]+)\s*>)?$/ ;
this.m_g = /^g\[([a-z0-9-_]+)\]\s*(?:\((.*)\))?\s*?$/;
this.m_comm = /^\/\// ;
this.parse = function(text) {
	var box = [] ;
	var conn = [] ;
    var genes = [];
    
    var m_sep = /^---*$/ ;
    var m_ulink= /\?\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i;
    var m_image = /\!\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i;
    var m_popi = /^\!pi\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i ;
    var m_popt = /^\!pt\[(.+)\]\s*(?:"(.+)")?\)?/i;
    var m_popl = /^\!pl\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i ;
    var m_popStart = /^<pop>$/;
    var m_popEnd = /^<\/pop>$/;
    var popcheck = false;
    var m_link = /^([u|d|l|r][0-9]*)?(<)?==?(?:\[(.*)\])?\s*([u|d|l|r][0-9]*)?\s*(?:\((.*)\))?==?(>)?([u|d|l|r][0-9]*)?\[([a-z0-9-_]+)\]([a-z])?$/i ;
//		var m_link = /^([u|d|l|r][0-9]*)?(<)?==?(?:\((.*)\))?==?(>)?([u|d|l|r][0-9]*)?\[([a-z0-9-_]+)\]([a-z])?$/i ;

	var l = text.split("\n") ;
	var b = {id:"",bl:[]} ;
    var gene = {id:"", gl:[]};
    var check = true;
	for(var i in l) {
		var cl = l[i] ;
		var a, g;
		if(cl=="") continue ;
		if(this.m_comm.exec(cl)) {
			continue ;	
		}else 
		if(a = this.m_h.exec(cl)) {
			if(b.bl.length>0) {
				pbox(b) ;
			} else if(gene.gl.length>0){
                pgene(gene);
                gene.gl = [];
            }
            check = true;
			b.id = a[1] ;
			b.bl = [] ;
			b.cls = a[2] ;
			b.pos = (a[3]!=undefined && a[4]!=undefined)?{x:a[3],y:a[4]}:undefined ;
		} else if(g = this.m_g.exec(cl)) {
			if(b.bl.length>0) {
				pbox(b) ;
                b.bl = [];
			} else if(gene.gl.length>0){
                pgene(gene);
            }
            check = false;
			gene.id = g[1] ;
			gene.gl = [] ;
			gene.cls = g[2] ;
        } else{
            if(check){b.bl.push( cl );}
            else{ gene.gl.push(cl); }
		}
	}
	if(b.bl.length>0) pbox(b);
    if(gene.gl.length>0) pgene(gene);
    
	function pgene(g) { // gene info の作成
		var l = [] ;
		var ll = [];
        var lp = [];
		var a ;
		g.title = null ;
        popcheck = false;
		for(var i in g.gl) {
			var cl = g.gl[i] ;
            if(cl.match(m_popStart)){
                if(ll.length>0) lp.push(ll.join("<br/>"));
                ll = [];
            }
            else if(cl.match(m_popEnd)){
                if(ll.length>0) lp.push( "<span>" + ll.join("<br/>") + "</span>") ;
                ll = lp;
            }
            else if(m_sep.exec(cl)) {
                if(ll.length>0) l.push( ll.join("<br/>")) ;
                ll = [] ;
            } else if(a = m_image.exec(cl)) { // imgの読み込み
                var im = ( '<img src="'+a[2]+'" title='+a[1]+' />') ;
                if(a[3]!=undefined) {
                    im = "<figure>"+im+"<figcaption>"+fontChange(a[3])+"</figcaption></figure>" ;
                }
                ll.push(im) ;
            } else if(a = m_ulink.exec(cl)) { // urlの読み込み
                var url = "<a href="+a[2]+">" + fontChange(a[3]) + "</a>";
                ll.push(url);
            } else if(a = m_popi.exec(cl)) { // popupの読み込み
                var im = ( '<img src="'+a[2]+'" title='+a[1]+' />') ;
                if(a[3]!=undefined) {
                    im = "<span><figure>"+im+"<figcaption>"+fontChange(a[3])+"</figcaption></figure></span>" ;
                } else { im = "<span>" + im + "</span>"
                }
                ll.push(im);
            } else if (a = m_popt.exec(cl)){
                txt = "<span>" + fontChange(a[2]) + "</span>"
                ll.push(txt) ;                
            } else if (a = m_popl.exec(cl)){
                var url = "<span><a href="+a[2]+">" + fontChange(a[3]) + "</a></span>";
                ll.push(url);
            } else {
                cl = fontChange(cl);
                ll.push(cl) ;
            }
        }
        if(ll.length>0) l.push( ll.join("<br/>")) ;
//		console.log("class="+b.cls) ;
		if(l.length==1) l = l[0] ;
		genes.push( {id:g.id,inner:l,cls:g.cls} ) ;
	}
    
	function pbox(b) { // boxの作成
		var l = [] ;
		var ll = [] ;
		var m_sep = /^---*$/ ;
		var m_title = /^#(.*)/ ;
        var lp = [];
		var a ;
		b.title = null ;
		for(var i in b.bl) {
			var cl = b.bl[i] ;
            if(cl.match(m_popStart)){
                if(ll.length>0) lp.push(ll.join("<br/>"));
                ll = [];
            }
            else if(cl.match(m_popEnd)){
                if(ll.length>0) lp.push( "<span>" + ll.join("<br/>") + "</span>") ;
                ll = lp;
            }
			else if(m_sep.exec(cl)) {
				if(ll.length>0) l.push( ll.join("<br/>")) ;
				ll = [] ;
			} else if(a = m_title.exec(cl)) {
				b.title = a[1] ;
			} else if( a=m_link.exec(cl)) { // コネクションの読み込み。fpがはじめ、tpが終わり、矢印の向きも判定
				if(ll.length>0) l.push( ll.join("<br/>")) ;
				ll = [] ;
				var fp = "r" ;
				var tp = "l1" ;
				var ar = (a[2]!=undefined)?((a[5]!=undefined)?"b":"f"):((a[5]!=undefined)?"t":"") ; // 向き
				if(a[1]!=undefined) fp = a[1] ;
				if(a[7]!=undefined) tp = a[7] ;
				conn.push( {from:b.id,to:a[8],param:{
                    s_pos:(fp+(l.length+((b.title!=null)?1:0))),e_pos:tp,cls:a[5],arrow:ar,type:a[8], gene:a[3], gpos:a[4]}}) ; // col: color, width: width
			} else if(a = m_image.exec(cl)) { // imgの読み込み
                var im = ( '<img src="'+a[2]+'" title='+a[1]+' />') ;
				if(a[3]!=undefined) {
					im = "<figure>"+im+"<figcaption>"+fontChange(a[3])+"</figcaption></figure>" ;
				}
				ll.push(im) ;
            } else if(a = m_ulink.exec(cl)) { // urlの読み込み
                var url = "<a href="+a[2]+">" + fontChange(a[3]) + "</a>";
                ll.push(url);
            } else if(a = m_popi.exec(cl)) { // popupの読み込み
                var im = ( '<img src="'+a[2]+'" title='+a[1]+' />') ;
				if(a[3]!=undefined) {
					im = "<span><figure>"+im+"<figcaption>"+fontChange(a[3])+"</figcaption></figure></span>" ;
				} else { im = "<span>" + im + "</span>"
                }
                ll.push(im);
            } else if (a = m_popt.exec(cl)){
                txt = "<span>" + fontChange(a[2]) + "</span>"
				ll.push(txt) ;                
            } else if (a = m_popl.exec(cl)){
                var url = "<span><a href="+a[2]+">" + fontChange(a[3]) + "</a></span>";
                ll.push(url);
			} else {
                cl = fontChange(cl);
				ll.push(cl) ;
			}
		}
		if(ll.length>0) l.push( ll.join("<br/>")) ;
//		console.log("class="+b.cls) ;
		if(l.length==1) l = l[0] ;
		box.push( {id:b.id,inner:l,pos:b.pos,cls:b.cls,title:b.title} ) ;
	}
	return {box:box, conn:conn, gene:genes} ;
}

this.upd_text = function(text) {
	var l = text.split("\n") ;
	for(var i in l) {
		var cl = l[i] ;
		var a ;
		if(cl=="") continue ;
		if(a = this.m_h.exec(cl)) {
			var pos = (this.bpos[a[1]]!=undefined)?this.bpos[a[1]]:{x:a[3],y:a[4]} ;
			l[i] = "["+a[1]+"]"+((a[2]!=undefined)?" ("+a[2]+")":"")+" <"+pos.x+","+pos.y+">" ;
		}
	}
	return l.join("\n") ;
}

function fontChange(cl){
    m_b = /_\*(.+?)\*_/g　; // 太文字に置換
    while((m = m_b.exec(cl))!=null) {
        cl = cl.replace(m[0],"<strong>"+m[1]+"</strong>") ;
    }
    m_i = /__(.+?)__/g　; // イタリック置換
    while((m = m_i.exec(cl))!=null) {
        cl = cl.replace(m[0],"<i>"+m[1]+"</i>") ;
    }
    m_i = /_s(.+?)s_/g　; // したつき置換
    while((m = m_i.exec(cl))!=null) {
        cl = cl.replace(m[0],"<sub>"+m[1]+"</sub>") ;
    }
    return cl
}
}


$(function() {
	
	new resizebar('#rb','#edit',"v",1) ;
		
	var mag = 1.0 ;
	$('#base').css('width',"2900px").css('height',"2000px") ;

	$('#zoom').on("input change",function() {
		mag = $(this).val()/100 ;
		$('#szoom').html("#base {transform: scale("+mag+")}");
	})
	$('#size_x,#size_y').on('change input',function(ev){
		$('#base').css(($(this).attr('id')=="size_x")?'width':'height',parseInt($(this).val())+"px") ;
	})

    var b = new mdg_draw($('#base')) ;
	var p = loadlocal() ;
	if(p) {
		$('#source').val( p.source ) ;
		$('#i_fname').val(p.fname ) ;
	}
	var data = b.parse($('#source').val())  ;
	b.setobj(data,true) ;
	
	function loadlocal() {
		var ret = null ;
/*		if(p = window.localStorage.getItem("mdg")) {
			if(JSON.parse(p) && JSON.parse(p).sources) {
				ret = JSON.parse(p).sources[0] ;
			}
		}*/
		return ret ;
	}
	
	function savelocal(s) {
		window.localStorage.setItem("mdg",JSON.stringify({sources:[s]})) ;
	}

        $('.blank').click(function(){
        window.open(this.href, '');
        return false;
    });

	$('#source').on('input',function() {
		var s = $(this).val() ;
		data = b.parse(s) ;
		b.setobj(data) ;
		savelocal({"source":s,"fname":$('#i_fname').val()}) ;
	})
	$(document).on("dragstart",'#base .box',function(ev){
		var oe = ev.originalEvent ;
		ev.originalEvent.dataTransfer.setData("text",$(this).attr('id')+"/"+oe.pageX+"/"+oe.pageY);
	})
	$('#base').on("dragenter dragover",function(){
		return false ;
	}).on("drop",function(ev){
//		console.log("drop") ;
		var oe = ev.originalEvent ;
		var k = ev.originalEvent.dataTransfer.getData("text").split("/") ;
		var id = k[0] ;
		
		var ox = (oe.pageX-k[1])/mag ;
		var oy = (oe.pageY-k[2])/mag ;
//		console.log(ox+"/"+oy) ;
		var em = parseInt($('html').css('font-size')) ;

		var ex = parseInt($('#'+id).css("left")) ;
		var ey = parseInt($('#'+id).css("top")) ;
		var px = Math.floor(((ex+ox)/em+0.25)*2)/2 ;
		var py = Math.floor(((ey+oy)/em+0.25)*2)/2 ;

		b.setpos(id,px,py) ;
		b.redraw(data) ;
		var s = b.upd_text($('#source').val()) ;
		$('#source').val(s) ;
		savelocal({"source":s,"fname":$('#i_fname').val()}) ;
		return false ;
	})
	
	$('#b_load').on("click",function() {
		$('#f_load').click() ;
	})
	$('#f_load').on("change",function(ev) {
		var f = ev.originalEvent.target.files ;
		var reader = new FileReader();

		reader.onload = (function(e) {
			var src = e.target.result ;
			$('#source').val(src) ;
			data = b.parse(src) ;
			b.setobj(data,true) ;   
		});
		$('#i_fname').val(f[0].name) ;
		reader.readAsText(f[0]);
	})
	$('#l_save').on("click",function(){
		$(this).attr("download",$('#i_fname').val());
		$(this).attr("href","data:application/octet-stream;charset=UTF-8,"+encodeURIComponent($('#source').val())) ;
		return true ;
	})

})


function resizebar(bar,target,hv,dir) {
	this.sw = 0 ;
	this.sel = target ;
	this.dir = dir ;
	this.hv = hv ;
	this.start = null ;
	this.attr = (hv=="v")?"width":"height" ;
	this.mouse = (hv=="v")?"pageX":"pageY" ;
	var self = this ;
	$(bar).on('mousedown touchstart',function(ev) {
		self.sw = parseInt($(self.sel).css(self.attr))-self.dir*ev.originalEvent[self.mouse] ;
		self.start = self.sel ;
	});
	$('body').on('mousemove touchmove',function(ev){
		if(self.start != self.sel) return true ;
		var w = self.dir*ev.originalEvent[self.mouse]+self.sw;
		if(w<100) return false ;
		$(self.sel).css(self.attr,w+"px") ;
		return false ;
	}).on('mouseup touchend',function() {
		self.start = null ;
	})
}

