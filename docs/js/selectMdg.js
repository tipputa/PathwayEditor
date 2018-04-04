// handler part
$(function() {    
    $('#base').css('width',"2900px").css('height',"2000px") ;
    
    // zoomの設定
    var mag = 1.0;
	$('#zoom').on("input change",function() {
		mag = $(this).val()/100 ;
		$('#szoom').html("#base {transform: scale("+mag+")}");
	})
    
    // サイズ設定
	$('#size_x,#size_y').on('change input',function(ev){
        $('#base').css(($(this).attr('id')=="size_x")?'width':'height',parseInt($(this).val())+"px") ;
	})


        $( 'input[name="radio-1"]:radio' ).change( function() { 
           $('#source').load($(this).val(), function() {
                var b = new mdg_draw($('#base')) ;
        	    console.info($('#source').val());
        	    var data = b.parse($('#source').val());
	            b.setobj(data, true) ;
         });
        });  
    
    $('#source').load("mdg/GL_List.txt", function() {
        	console.info($('#source').val());
        	var data = b.parse($('#source').val());
	        b.setobj(data, true) ;
    });
    
    var b = new mdg_draw($('#base')) ;

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
})
