var mdg_draw = function(_base) {
    // 初期化
    this.base = $(_base) ;
    this.svg = $("svg",base) ;
    this.bpos = {} ; // boxのinfo保存用
    this.em = parseInt($('html').css('font-size')) ; // 基準とするフォントサイズ
    this.genebase = []; // gene infoの保存用
    this.dragDrop = {};
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
            attr('draggable',d).html(inner) ;
        if(box.cls) { // class情報の追加
            if(typeof box.cls == "string") box.cls = [box.cls] ;
            for(var i in box.cls) e.addClass(box.cls[i]) ;
        }
        if(box.size){
            e.css("width", box.size.w+"px").css("height", box.size.h+"px");
        }
        if(box.css){
            var css = box.css.split(";");
            for(var i in css){
                if(css[i] != ""){
                var css2 = css[i].split(":");
                if(css2.length>1) e.css(css2[0].trim(), css2[1].trim());
            }}
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
                    g = $("<div>").addClass("label").attr("title",id).attr("id", newid).html(gene.inner).css('left', mp.x+"px").css('top',mp.y+"px");
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
    var tagName = o.prop("tagName");	
    var px,py,vx,vy ;
    var t = $('tr',o) ;
    var d = $('th,td',o) ;
    if(tagName == "TABLE"){
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
        var px = parseFloat(x)>0?parseFloat(x):1;
        var py = parseFloat(y)>0?parseFloat(y):1;        
        this.bpos[id] = {x:px,y:py} ;
    }
    
    this.changeAllPos = function(opt){
        var addX, addY, size = 2;
        switch (opt){
            case "L": addX = -size; addY = 0; break;
            case "R": addX = size; addY = 0; break;
            case "D": addX = 0; addY = size; break;
            case "U": addX = 0; addY = -size; break;
        }
        for(var id in this.bpos) {　// boxの位置情報を更新
            var px = parseFloat(this.bpos[id].x) + addX;
            var py = parseFloat(this.bpos[id].y) + addY;
            if(px>=0 && py >= 0)this.bpos[id] = {x:px, y:py};
        }
    }
    
    this.select = function(rect){
        this.deact()
        var l = parseFloat(rect.css("left"))/this.em;
        var t = parseFloat(rect.css("top"))/this.em;
        var w = parseFloat(rect.css("width"))/this.em;
        var h = parseFloat(rect.css("height"))/this.em;
        for(var id in this.bpos){
            if(this.bpos[id].x > l && this.bpos[id].x < l+w && this.bpos[id].y > t && this.bpos[id].y < t+h){
                $('#'+id).addClass("active");
            }
        }
    }
    
    this.deact = function(){
        for(var id in this.bpos){
            if($('#'+id).hasClass("active")){
                $('#'+id).removeClass("active");
            }
        }
    }
    
    this.drop = function(mag){
        var ox = (this.dragDrop.pX - this.dragDrop.preX)/mag ;
        var oy = (this.dragDrop.pY - this.dragDrop.preY)/mag ;
        for(var id in this.bpos){
            if($('#'+id).hasClass("active")){
                var ex = parseInt($('#'+id).css("left")) ;
                var ey = parseInt($('#'+id).css("top")) ;                
                var px = Math.floor(((ex+ox)/this.em+0.25)*2)/2 ;
                var py = Math.floor(((ey+oy)/this.em+0.25)*2)/2 ;
                this.setpos(id,px,py) ;
            }
        }
    }
    function strHeight(str, width) {
      var e = $("#ruler").css("width", width);
      var height = e.text(str).get(0).offsetHeight;
      e.empty();
        console.info(height);
      return height;
    }

    

    // text 関連
    // md parser
    this.m_h = /^\[([A-z0-9-_]*)\]\s*(?:\(([^)]*)\))?\s*(?:<\s*([0-9\.]+)\s*,\s*([0-9\.]+)\s*,*\s*([0-9\.]+)?\s*,*\s*([0-9\.]+)?\s*>)?\s*(?:css\(([^)]*)\))?\s*$/ ;
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
        var m_conn = /^([u|d|l|r][0-9]*)?(<)?==?(?:\[([A-z0-9-_]+)\])?\s*([u|d|l|r][0-9]*)?\s*(?:\(([^"=>]*)\))?==?(>)?([u|d|l|r][0-9]*)?\[([A-z0-9-_]+)\]\s*$/i ;
        var m_ulink= /\?\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"(.+)")?\))?/i;
        var m_image = /\!\[(.+)\]\s*(?:\(([^ ")]+)\s*(?:"([^")]*)")?\))?\s*(?:css\(([^)]*)\))?/i;
        var m_popStart = /^<pop>$/;
        var m_popEnd = /^<\/pop>$/;
        var m_title = /^#(.*)/ ;
        var m_GL = /^!GL\{([^|]*)?\|?([^|]*)?\|?([^|]*)?\}$/; // for glycerolipids
        var m_PG = /^!PG\{([^|]*)?\|?([^|]*)?\|?([^|]*)?\|?([^|]*)?\|?([^|]*)?\}$/; // for Phosphatidylglycerol
        var m_CL = /^!CL\{([^|]*)?\|?([^|]*)?\|?([^|]*)?\|?([^|]*)?\|?([^|]*)?\|?([^|]*)?\|?([^|]*)?}$/; // for Cardiolipin

        var l = text.split("\n") ;
        var b = {id:"",bl:[], check:false} ;
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
                if(b.bl.length>0 || b.check) {
                    pbox(b) ;
                    b.check = false;
                } else if(gene.gl.length>0){
                    pgene(gene);
                    gene.id = "";
                    gene.gl = [];
                }
                boxcheck = true;
                b.id = a[1] ;
                b.bl = [] ;
                b.cls = a[2] ;
                b.pos = (a[3] && a[4])?{x:a[3],y:a[4]}:undefined ;
                b.size = (a[5] && a[6]) ?{w:a[5], h:a[6]}:undefined;
                b.css = (a[7])?a[7]:undefined;
                if(b.size){b.check = true;}
            } else if(g = m_g.exec(cl)) { // set gene info
                if(b.bl.length>0 || b.check) {
                    pbox(b);
                    b.id = "";
                    b.bl = [];
                    b.check = false;
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
                var im;
                if(a[4]!=undefined){
                    var style = [];
                    var css = a[4].split(";");
                    for(var i in css){
                        if(css[i] != ""){
                            var css2 = css[i].split(":");
                            if(css2.length>1){
                                style.push(css2[0].trim()+":"+css2[1].trim()+";");
                            }
                        }
                    }
                    im = ( '<img src="'+a[2]+'" title='+a[1]+' style="' + style.join(" ") + '"/>');
                }
                else {im = ( '<img src="'+a[2]+'" title='+a[1]+' />') ;
                }
                if(a[3]!=undefined) {
                    im = "<figure>"+im+"<figcaption>"+fontChange(a[3])+"</figcaption></figure>" ;
                }
                ll.push(im) ;
            } else if(a = m_ulink.exec(cl)) { // urlの読み込み
                var url = "<a href="+a[2]+" target=\"_blank\">" + fontChange(a[3]) + "</a>";
                ll.push(url);
            } else if (a = m_GL.exec(cl)){
                R1 = a[1]?a[1]:"";
                R2 = a[2]?a[2]:"";
                R3 = a[3]?a[3]:"";
                var txt = '\
                <table align=center style="transform:translate(-6px, 10px)"> \
                <tr><td rowspan=3><img src=img/GL2.png style=" height:40px;transform:translateX(16px);"/ ></td> \
                <td nowrap align=left style="line-height:0%;">'+fontChange(R1)+'</td></tr> \
                <tr><td nowrap align=left style="line-height:0%;">'+fontChange(R2)+'</td></tr> \
                <tr><td nowrap align=left  style="line-height:0%;">' + fontChange(R3)+ '</td></tr></table>';
                ll.push(txt);
                
            }else if (a = m_PG.exec(cl)){
                R1 = a[1]?a[1]:"";
                R2 = a[2]?a[2]:"";
                R3 = a[3]?a[3]:"";
                R4 = a[4]?a[4]:"";
                R5 = a[5]?a[5]:"";
                var txt = '\
                <table align=center style="transform:translateY(10px)">\
                <tr><td rowspan=3><img src=img/GL2.png style="height:50px;transform:translateX(18px);"/></td> \
                <td colspan=2 nowrap align=left style="line-height:50%;">'+fontChange(R1)+'</td></tr>\
                <tr><td colspan=2 nowrap align=left style="line-height:50%;">'+fontChange(R2)+'</td></tr>\
                <tr><td nowrap align=center  style="line-height:50%;">'+fontChange(R3)+'</td>\
                <td rowspan=3><img src=img/GLRev.png style=" height:50px;transform:translateX(-18px) rotate(180deg);"/ ></td></tr>\
                <tr><td colspan=2 nowrap align=right style="line-height:50%;">'+fontChange(R4)+'</td></tr> \
                <td colspan=2 nowrap align=right style="line-height:50%;">'+fontChange(R5)+'</td></tr></table>'
                ll.push(txt);

            } else if(a = m_CL.exec(cl)){
                R1 = a[1]?a[1]:"";
                R2 = a[2]?a[2]:"";
                R3 = a[3]?a[3]:"";
                R4 = a[4]?a[4]:"";
                R5 = a[5]?a[5]:"";
                R6 = a[6]?a[6]:"";
                R7 = a[7]?a[7]:"";

                var txt = '\
                <table align=center style="transform:translateY(10px)"> \
                <tr><td rowspan=3><img src=img/GL2.png style=" height:50px;transform:translateX(18px);"/ ></td>\
                <td colspan=2 nowrap align=left style="line-height:50%;">'+fontChange(R1)+'</td></tr>\
                <tr><td colspan=2 nowrap align=left style="line-height:50%;">'+fontChange(R2)+'</td></tr>\
                <tr><td nowrap align=center  style="line-height:50%;">'+fontChange(R3)+'</td>\
                <td rowspan=3><img src=img/GLRev.png style="height:50px;transform:translateX(-18px) rotate(180deg);"/ ></td></tr>\
                <tr><td colspan=2 nowrap align=right style="line-height:50%;">'+fontChange(R4)+'</td></tr>\
                <td rowspan=3><img src=img/GL2.png style=" height:50px;transform:translateX(18px);"/ ></td> \
                <td nowrap align=right style="line-height:50%;">'+fontChange(R5)+'</td>\
                </tr><td colspan=2 nowrap align=left style="line-height:50%;">'+fontChange(R6)+'</td></tr>\
                <tr><td colspan=2 nowrap align=left style="line-height:50%;">'+fontChange(R7)+'</td></tr> </table>'    
                ll.push(txt);
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
                    var ar = (a[2]!=undefined)?((a[6]!=undefined)?"b":"f"):((a[6]!=undefined)?"t":"") ; // 向き
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
            else if(b.check) l.push(" ");
            if(l.length==1) l = l[0] ;
            box.push( {id:b.id,inner:l,pos:b.pos,cls:b.cls,title:b.title, size:b.size, css:b.css} ) ;
        }
        return {box:box, conn:conn, gene:genes} ;
    }
    
    this.searchPosition = function(text,w,tag){
        var l = text.split("\n") ;
        var height = 0;
        var heightTmp;
        for(var i in l) {
            var cl = l[i];
            if(cl.match(tag)){break;}
            if(cl == "") height = height + 16*1.2;
            else {heightTmp = strHeight(cl, parseFloat(w));height = height + heightTmp;}
        }
        console.info(height);
        return height;
    }

    // boxを移動させた時にtextの座標も変更
    this.upd_text = function(text) {
        var l = text.split("\n") ;
        for(var i in l) {
            var cl = l[i] ;
            var a 
            if(cl=="") continue ;
            if(a = this.m_h.exec(cl)) {
                var pos = (this.bpos[a[1]]!=undefined)?this.bpos[a[1]]:{x:a[3],y:a[4]} ;
                var css = a[7] ? "css("+a[7]+")" : "";
                if(a[5] && a[6]){
                    l[i] = "["+a[1]+"]"+((a[2]!=undefined)?" ("+a[2]+")":"")+" <"+pos.x+","+pos.y+","+a[5]+","+a[6]+">"+css;
                }else{
                    l[i] = "["+a[1]+"]"+((a[2]!=undefined)?" ("+a[2]+")":"")+" <"+pos.x+","+pos.y+">"+css ;
                }
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



// handler part
$(function() {

    // sourceとviewパートを仕切るバーを作成
	new resizebar('#rb','#edit',"v",1) ;
		
	$('#base').css('width',"2900px").css('height',"2000px") ;
    
    // zoomの設定
    var mag = 1.0 ;
	$('#zoom').on("input change",function() {
		mag = $(this).val()/100 ;
		$('#szoom').html("#base {transform: scale("+mag+")}");
	})
    
    // サイズ設定
	$('#size_x,#size_y').on('change input',function(ev){
        $('#base').css(($(this).attr('id')=="size_x")?'width':'height',parseInt($(this).val())+"px") ;
	})

	// ブラウザチェック, localStorageに対応していない場合はfalse
	var checker = true;
	var userAgent = window.navigator.userAgent.toLowerCase();
	if(userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1) {
		checker = false;
	} else if(userAgent.indexOf('edge') != -1) {
	} else if(userAgent.indexOf('chrome') != -1) {
	} else if(userAgent.indexOf('safari') != -1) {
		checker = false;
	} else if(userAgent.indexOf('firefox') != -1) {
	} else if(userAgent.indexOf('opera') != -1) {
	} else {
    checker=false;
}


    // transLocate by arrow
    var type = "<div>";
    var arrL = $(type).addClass("arrow transL").attr('id',"transL");
    var arrR = $(type).addClass("arrow transR").attr('id',"transR");
    var arrD = $(type).addClass("arrow transD").attr('id',"transD");
    var arrU = $(type).addClass("arrow").attr('id',"transU");
    $('#control').append(arrL);
    $('#control').append(arrR);
    $('#control').append(arrD);
    $('#control').append(arrU);

    
    
    //初期化
    var b = new mdg_draw($('#base')) ;
	if(checker){
		var p = loadlocal() ;
		if(p) {
			$('#source').val( p.source ) ;
			$('#i_fname').val(p.fname ) ;
		}
	}
	var data = b.parse($('#source').val())  ;
	b.setobj(data,true) ;
	
    // load localStorage
	function loadlocal() {
		var ret = null ;
		if(p = window.localStorage.getItem("mdg")) {
			if(JSON.parse(p) && JSON.parse(p).sources) {
				ret = JSON.parse(p).sources[0] ;
			}
		}
		return ret ;
	}
	// localStorageにsourceをsave
	function savelocal(s) {
		window.localStorage.setItem("mdg",JSON.stringify({sources:[s]})) ;
	}
    
    // souceの値が変更された場合それを反映させる
	$('#source').on('input',function() {
		var s = $(this).val() ;
		data = b.parse(s) ;
		b.setobj(data) ;
        if(checker) savelocal({"source":s,"fname":$('#i_fname').val()}) ;
	})
    
    var rectangle;
	$(document).on("mousedown",'#base',function(ev){
        var oe = ev.originalEvent ;
		rectangle = oe.pageX+"/"+oe.pageY;
        var px = (oe.pageX - $("#base").offset().left)/mag;
        var py = (oe.pageY - $("#base").offset().top)/mag;
        var e = $("<div>").addClass("rectangle").attr("id", "rect").css("left", px + "px").css("top", py+"px").css("width","0px").css("height", "0px");
       $('#base').append(e); 
    }).on("mousemove", function(ev){
        if(rectangle){
        var k = rectangle.split("/") ;
        var w = (ev.originalEvent.pageX - k[0])/mag;
        var h = (ev.originalEvent.pageY - k[1])/mag;
        $("#rect").css("width", w+"px").css("height", h+"px");
    }}).on("mouseup",function(){
        b.select($("#rect"));
        $("#rect").remove();
        rectangle=undefined;
    });
    
    $(document).on('dblclick', '#base .label, #base .box', function(){
        var str = $(this)[0].title;
        var s = new RegExp("^g?\\[" + str+"\\]");
        console.info(s);
        var p = b.searchPosition($('#source').val(), $('#source').css("width"),s);
        //var p = $("移動させたいIDまたはCLASS").offset().top;
        $('#source').animate({ scrollTop: p }, 'slow');
        var e = $("<div>").addClass("highlight").attr("id","highlight").html("["+str+"]");
        $('#sbase').append(e);
        setTimeout(function(){$('#highlight').remove()},2000)
    });
    
    // box drag時の処理
	$(document).on("dragstart",'#base .box',function(ev){
        $("#rect").remove();        
        var oe = ev.originalEvent ;
        $(this).addClass("active");
        b.dragDrop = {preX:parseFloat(oe.pageX), preY:parseFloat(oe.pageY)};
        oe.dataTransfer.setData('forFireFox', this);
	})
	$('#base').on("dragenter dragover",function(){
		return false ;
	}).on("drop",function(ev){
		var oe = ev.originalEvent ;
        b.dragDrop = {preX: b.dragDrop.preX, preY:b.dragDrop.preY, pX: parseFloat(oe.pageX), pY:parseFloat(oe.pageY)};
        b.drop(mag);
        b.redraw(data);
		var s = b.upd_text($('#source').val()) ;
		$('#source').val(s) ;
        if(checker) savelocal({"source":s,"fname":$('#i_fname').val()}) ;

		return false ;
	})
    
    $('.arrow').on("click", function(){
        var tmpId = $(this).attr('id');
        var a;
        switch (tmpId){
            case 'transL': a = "L"; break;   
            case 'transD': a = "D"; break;   
            case 'transR': a = "R"; break;   
            case 'transU': a = "U"; break;   
        }
        b.changeAllPos(a);
        b.redraw(data);
		var s = b.upd_text($('#source').val()) ;
		$('#source').val(s) ;
    });
    	
    // load
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