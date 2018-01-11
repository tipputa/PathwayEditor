var mdg_draw = function(_base) {
    // 初期化
    this.base = $(_base) ;
    this.svg = $("svg",base) ;
    this.bpos = {} ; // boxのinfo保存用
    this.em = parseInt($('html').css('font-size')) ; // 基準とするフォントサイズ
    this.genebase = []; // gene infoの保存用
    var lp,le ; // boxの初期位置情報。随時更新される。

    // dataをセット (this.create, this.setgene) -> redraw
    this.setobj = function(data,delay) { // 初回描画時のみarrowをdelayさせる。
        this.genebase = [];
        $('div,table',this.base).remove() ;
        lp = {x:1,y:1} ;
        for(var i in data.box) {
            var pos = this.create(true,data.box[i]) ; // boxの基本情報作成
            this.bpos[data.box[i].id] = pos ; // boxのポジションを格納
        }
        for(var i in data.gene){
            this.setgene(data.gene[i]); // geneのidとinner情報を格納
        }
        var self = this ;
        this.redraw(data,delay); 
    }
    
    // redraw (this.connect)
    this.redraw = function(data,delay) {	
        for(var id in this.bpos) {　// boxの位置情報を更新
            $('#'+id).css('left',this.bpos[id].x+"rem").css('top',this.bpos[id].y+"rem") ;
        }
        var base = this.base ;
        
        // geneとarrow情報を削除・新たに設定
        $("#base .label").remove();
        $("svg", base).remove() ;
        setTimeout($.proxy(function() { // 初回描画のみdelay
            s=[] ;
            for(var i in data.conn) {	// コネクションの
                var c = data.conn[i]
                l = this.connect($("#"+c.from),$("#"+c.to),c.param) ; // => this.connect
                if(l!=null) {for(var j in l) {s.push(l[j]) ;}}
            }
            base.append("<svg>"  + s.join("") + "</svg>"); // arrowの設定
        },this),(delay==true)?500:0) ;
    }
    
    // create dom block 
    this.create = function(editable, box) {
        var d = editable?"true":"false" ;
        var type,inner;
        
        // tableかdivか判定。#や---が使用されていた場合はtable形式のboxになる
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
        // <table> or <div>を作成。ここでは位置情報のセットはredrawで行う
        var e = $(type).addClass("box").attr('id',box.id).attr('title',box.id).
            attr('draggable',d).attr('align',"center").html(inner) ;
        if(box.cls) { // class情報の追加
            if(typeof box.cls == "string") box.cls = [box.cls] ;
            for(var i in box.cls) e.addClass(box.cls[i]) ;
        }
        
        this.base.append(e) ;
        lp = {x:parseInt(pos.x) + round(parseInt(e.css('width'))/this.em)+2,y:parseInt(pos.y)+1};

        return pos ; // boxのポジションをreturn, この後this.bposにセット。
    }
    
    // set gene information
    this.setgene = function(gene) {
        var g = {id:gene.id, inner:gene.inner, cls:gene.cls, count:1};
        this.genebase.push(g);
    }


    // draw connect line 
    this.connect = function(o1,o2,param) {
        if(o1.length==0 || o2.length==0) return null ;
        // start & end positionを2つのboxとconnectionのparameterから計算
        var sp = setConnectPos(o1, param.s_pos) ; 
        var ep = setConnectPos(o2, param.e_pos) ;
        
        var fillcol = "#2c3e50"; // cssで設定されてる初期color; 適宜変更が必要

        // gene labelに関するパート
        // gene情報をclass=labelで追加
        if(param.gene != undefined){
            var id = param.gene;
            for(var i in this.genebase){
                if(id == this.genebase[i].id){
                    var gene = this.genebase[i];
                    // startとendの中点（mp）を算出
                    var mpx = ((sp.x+ep.x)/2);
                    var mpy = ((sp.y+ep.y)/2);
                    var mp = {x:mpx, y:mpy};

                    // geneが複数回使われるかもしれないため、idにcount情報追加。
                    var newid = id + "_" + gene.count;
                    g = $("<div>").addClass("label").attr("id", newid).html(gene.inner).css('left', mp.x+"px").css('top',mp.y+"px");
                    this.base.append(g);
                    gene.count = gene.count + 1;
                    
                    // classの追加
                    if(gene.cls) {
                        if(typeof gene.cls == "string") gene.cls = [gene.cls] ;
                          for(var j in gene.cls) g.addClass(gene.cls[j]) ;
                    }
                    
                    // gene position (u|d|l|r)の判別・位置反映 =[]u()=>
                    // gposのが未指定の場合は中点にプロットされる。
                    var Rawwidth = g.get(0).offsetWidth; // 描画時のサイズ取得
                    var RawHeight = g.get(0).offsetHeight;
                    var margine = 5; // arrowのmargine
                    var margine2 = 10; // gene labelのmargine
                    
                    if(param.gpos != undefined){
                        if(param.gpos.match(/^u/)){ // 上側にshift
                            g.css('left',(mp.x - Rawwidth/2)+"px").css('top',(mp.y - RawHeight - margine2)+"px"); 
                            // arrowの為にstart endも修正
                            ep.y = ep.y - margine; 
                            sp.y = sp.y -margine;
                        } else if(param.gpos.match(/^d/)){ // 下側にshift
                            g.css('left',(mp.x - Rawwidth/2)+"px").css('top',(mp.y + margine2)+"px"); 
                            ep.y = ep.y + margine;
                            sp.y = sp.y + margine;
                        } else if(param.gpos.match(/^l/)){ // 左側にshift
                            g.css('left',(mp.x - Rawwidth - margine2)+"px").css('top',(mp.y - RawHeight/2)+"px"); 
                            ep.x = ep.x - margine;
                            sp.x = sp.x - margine;
                        } else if(param.gpos.match(/^r/)){ // 右側にshift
                            g.css('left',(mp.x + margine2)+"px").css('top',(mp.y - RawHeight/2)+"px"); 
                            ep.x = ep.x + margine;
                            sp.x = sp.x + margine;
                        }
                    }else{
                        g.css('left',(mp.x - Rawwidth/2)+"px").css('top',(mp.y - RawHeight/2)+"px");
                    }
                }
            }
        }

        
        // 以下はarrowに関するパート
        var ret = [];
        
        // class情報の格納
        var cls = "" ;
        if(param.cls) {
            var c = param.cls.split(" ") ;
            var cc = [] ;
            for(var i in c) {
                if(c[i].match(/^S|B$/)) {
                    param.type = c[i] ; // S: 直線などは、classではなくまずはtypeに格納
                } else {
                    cc.push(c[i]) ;
                    if(!c[i].match(/^l_.*$/)){
                    fillcol = c[i];
                    }
                }
            }
            if(cc.length>0) cls = 'class="'+cc.join(" ")+'"' ;
        }
        
        // startとendが10px以下のずれの場合、矢印のend pointをstartと合わせる（直線にする）
        var diffPos = 10;
        if(Math.abs(sp.x - ep.x) < diffPos) {ep.x = sp.x; param.type=="S";}
        else if (Math.abs(sp.y - ep.y) < diffPos) {ep.y = sp.y; param.type=="S";}
        
        // 矢印ライン部分の追加
        // 直線の場合
        if(param.type=="S") {
            ret.push('<path d="M ' + sp.x + ' ' + sp.y + ' L ' + ep.x + ' ' + ep.y + ' ' + '" ' + cls + ' fill="None" />') ;
        } else { // それ以外のカーブの場合
            var pm = 50 ;
            ret.push('<path d="M ' + sp.x + ' ' + sp.y + ' C ' + (sp.x+sp.vx*pm) + ' ' + (sp.y+sp.vy*pm) + ' ' + (ep.x+ep.vx*pm) + ' ' + (ep.y+ep.vy*pm)  + ' ' + (ep.x) + ' ' + (ep.y) + '" ' + cls  + ' ' + 'fill="None" />') ;
        }
        
        // 矢印三角部分の追加 
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

    // round
    function round(x) { return Math.floor(x*10)/10; }
    
    // handlerで使用。boxのdrag&drop時に値を返す。
    this.setpos = function(id,x,y) {
        this.bpos[id] = {x:parseFloat(x),y:parseFloat(y)} ;
    }
    

    // text 関連
    // md parser
    this.m_h = /^\[([A-z0-9-_]*)\]\s*(?:\((.*)\))?\s*(?:<\s*([0-9\.]+)\s*,\s*([0-9\.]+)\s*>)?$/ ;
    this.parse = function(text) {
        // return するbox, conn, genesの初期化
        var box = [] ;
        var conn = [] ;
        var genes = [];
        
        // pattern
        var m_g = /^g\[([A-z0-9-_]+)\]\s*(?:\((.*)\))?\s*?$/;
        var m_comm = /^\/\// ;
        var m_wiki = /^<?nowiki>/;
        var m_sep = /^---*$/ ;
        var m_conn = /^([u|d|l|r][0-9]*)?(<)?==?(?:\[(.*)\])?\s*([u|d|l|r][0-9]*)?\s*(?:\((.*)\))?==?(>)?([u|d|l|r][0-9]*)?\[([a-z0-9-_]+)\]\s*$/i ;
        var m_ulink= /\?\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i;
        var m_image = /\!\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i;
        var m_popStart = /^<pop>$/;
        var m_popEnd = /^<\/pop>$/;
        var m_title = /^#(.*)/ ;

        var l = text.split("\n") ;
        var b = {id:"",bl:[]} ;
        var gene = {id:"", gl:[]};
        var boxcheck = true;
        // read start
        for(var i in l) {
            var cl = l[i] ;
            cl=cl.replace(/&lt;/g,"<"); // for wiki
            cl=cl.replace(/&gt;/g,">"); 
            
            var a, g;
            
            // wikiTag or blank
            if(cl =="" || m_comm.exec(cl) || cl.match(m_wiki)){continue;}
            else if(a = this.m_h.exec(cl)) { // set box info
                if(b.bl.length>0) {
                    pbox(b) ;
                } else if(gene.gl.length>0){
                    pgene(gene);
                    gene.id = "";
                    gene.gl = [];
                }
                boxcheck = true;
                b.id = a[1] ;
                b.bl = [] ;
                b.cls = a[2] ;
                b.pos = (a[3]!=undefined && a[4]!=undefined)?{x:a[3],y:a[4]}:undefined ;
            } else if(g = m_g.exec(cl)) { // set gene info
                if(b.bl.length>0) {
                    pbox(b);
                    b.id = "";
                    b.bl = [];
                } else if(gene.gl.length>0){
                    pgene(gene);
                }
                boxcheck = false;
                gene.id = g[1] ;
                gene.gl = [] ;
                gene.cls = g[2] ;
            } else{ // set normal line
            if(boxcheck && b.id != ""){b.bl.push( cl );}
            else if (gene.id != ""){ gene.gl.push(cl); }
            }
        }
        // for last item
        if(b.bl.length>0) pbox(b);
        if(gene.gl.length>0) pgene(gene);
        // read end
        
         // share parser
        function sparser(cl, ll, llp){
            var a;
            if(cl.match(m_popStart)){
                // llの一時初期化。popEndで全てまとめてllにset
                if(ll.length>0) llp.push(ll.join("<br/>"));
                ll.length=0;
            }
            else if(cl.match(m_popEnd)){
                // <pop></pop>の間を<span>タグで囲む。cssで<span>タグはpopupになるように設定
                if(ll.length>0) llp.push( "<span>" + ll.join("<br/>") + "</span>") ;
                ll.length=0;
                Array.prototype.push.apply(ll, llp);
            } else if(a = m_image.exec(cl)) { // imgの読み込み
                var im = ( '<img src="'+a[2]+'" title='+a[1]+' />') ;
                if(a[3]!=undefined) {
                    im = "<figure>"+im+"<figcaption>"+fontChange(a[3])+"</figcaption></figure>" ;
                }
                ll.push(im) ;
            } else if(a = m_ulink.exec(cl)) { // urlの読み込み
                var url = "<a href="+a[2]+" target=\"_blank\">" + fontChange(a[3]) + "</a>";
                ll.push(url);
            } else { // その他のテキスト
                cl = fontChange(cl);
                ll.push(cl) ;
            }
        }
        
        // gene labelの作成
        function pgene(g) { 
            var ll = [];
            var llp = []; // popup tag用
            var a ;
            for(var i in g.gl) {
                sparser(g.gl[i], ll, llp) ;
            }            
            var l = ll.join("<br/>");
            genes.push( {id:g.id,inner:l,cls:g.cls} ) ;
        }
    

        // boxの作成
        function pbox(b) { 
            var l = [] ;
            var ll = [] ;
            var llp = [];
            var a ;
            b.title = null ;
            for(var i in b.bl) {
                var cl = b.bl[i] ;
                if(m_sep.exec(cl)) {
                    if(ll.length>0) l.push( ll.join("<br/>")) ;
                    ll = [] ;
                } else if(a = m_title.exec(cl)) {
                    b.title = a[1] ;
                } else if( a=m_conn.exec(cl)) { // コネクションの読み込み。fpがはじめ、tpが終わり、矢印の向きも判定
                    if(ll.length>0) l.push( ll.join("<br/>")) ;
                    ll = [] ;
                    var fp = "r" ;
                    var tp = "l1" ;
                    var ar = (a[2]!=undefined)?((a[5]!=undefined)?"b":"f"):((a[5]!=undefined)?"t":"") ; // 向き
                    if(a[1]!=undefined) fp = a[1] ;
                    if(a[7]!=undefined) tp = a[7] ;
                    // connectionの設定, geneでgeneid, gposで[u|d|l|r]
                    conn.push( {from:b.id,to:a[8],param:{
                        s_pos:(fp+(l.length+((b.title!=null)?1:0))),e_pos:tp,cls:a[5],arrow:ar, gene:a[3], gpos:a[4]}}) ; 
                } else {
                    sparser(cl, ll, llp);
                }
            }
            if(ll.length>0) l.push( ll.join("<br/>")) ;
            if(l.length==1) l = l[0] ;
            box.push( {id:b.id,inner:l,pos:b.pos,cls:b.cls,title:b.title} ) ;
        }
        return {box:box, conn:conn, gene:genes} ;
    }
    // boxを移動させた時にtextの座標も変更
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
