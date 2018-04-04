// handler part
$(function() {    
    $('#base').css('width',"2900px").css('height',"2000px") ;
    
    // zoomの設定
    var mag = 1.0;
	$('#zoom').on("input change",function() {
		mag = $(this).val()/100 ;
		$('#szoom').html("#base {transform: scale("+mag+")}");
	})
    
    var b = new mdg_draw($('#base')) ;
    var data = "";

    $( 'input[name="radio-1"]:radio' ).change( function() { 
       $('#source').load($(this).val(), function() {
       	    data = b.parse($('#source').val());
            b.setobj(data, true) ;
        });
    });  
    
    $('#source').load($('input[name="radio-1"]:checked').val(), function() {
        	data = b.parse($('#source').val());
	        b.setobj(data, true) ;
    });
})
