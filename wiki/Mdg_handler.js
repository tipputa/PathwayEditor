$(function(){
    // 必要なjsとcssのインポート
    importScript('MediaWiki:Mdg.js');
    importStylesheet('MediaWiki:Mdg.css');
    
    // wikiの<div id="mainTxt">に必要なhtmlを挿入
    var str = (function() {/*
    <section id=view> 
    <section id=control align=left> 
    zoom:<input type=range id=zoom min=25 max=200 value=100> 
    width:<input type=text id=size_x size=6 value=2900 > height: <input type=text id=size_y size=6 value=2000> 
    </div> 
    </section> 
    <div id=vbase>  
    <div id=rollbase> 
    <div style=\"overflow:scroll;\"> 
    <div id=base class=mdg><svg id=mdg_svg></svg></div>  
    </div> 
    </div> 
    </div> 
    </section>
    */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1].replace(/\n|\r/g, "");
    $('#mainTxt').html(str);
	
    // main handler, importとの時間差？のせいなのか、setTimeoutしないとmdg_drawがないと判断される
    setTimeout($.proxy(function() {		
        $('#base').css('width',"2900px").css('height',"2000px") ;
        
        // zoomの設定
        var mag = 1.0 ;
        $('#zoom').on("input change",function() {
            mag = $(this).val()/100 ;
            $('#base').css("transform", "scale("+mag+")");
        })
        
        // サイズ設定
        $('#size_x,#size_y').on('change input',function(ev){
            $('#base').css(($(this).attr('id')=="size_x")?'width':'height',parseInt($(this).val())+"px") ;
        });
        
        // 初期化
        var b = new mdg_draw($('#base')) ;
        var data = b.parse($('#source').html());
        b.setobj(data,true) ;
        
        // boxのdrag時の処理
        $(document).on("dragstart",'#base .box',function(ev){
            var oe = ev.originalEvent ;
            ev.originalEvent.dataTransfer.setData("text",$(this).attr('id')+"/"+oe.pageX+"/"+oe.pageY);
        })
        $('#base').on("dragenter dragover",function(){
		return false ;
        }).on("drop",function(ev){
		var oe = ev.originalEvent ;
		var k = ev.originalEvent.dataTransfer.getData("text").split("/") ;
		var id = k[0] ;
		
		var ox = (oe.pageX-k[1])/mag ;
		var oy = (oe.pageY-k[2])/mag ;
		var em = parseInt($('html').css('font-size')) ;
		var ex = parseInt($('#'+id).css("left")) ;
		var ey = parseInt($('#'+id).css("top")) ;
		var px = Math.floor(((ex+ox)/em+0.25)*2)/2 ;
		var py = Math.floor(((ey+oy)/em+0.25)*2)/2 ;

		b.setpos(id,px,py) ;
		b.redraw(data) ;
        // wiki用に改変。wikiの編集画面のtxtを直接変更する。
		var wp = $('#wpTextbox1').val();
		if(wp){
		var wpu = wp.split(/<nowiki>/)[0];
		var wpd = wp.split(/<\/nowiki>/)[1];
		var tx = wp.split(/<nowiki>/)[1];
		tx = tx.split(/<\/nowiki>/)[0];
		var s = b.upd_text(tx) ;
		$('#wpTextbox1').val(wpu + "<nowiki>"+ s + "<\/nowiki>" + wpd) ;
		}
        return false ;
        });
        
    },this),500);
});
