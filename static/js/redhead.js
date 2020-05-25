var app = {

    'init': function () {
        $(document).keydown(this.checkKey);
        $("#fwd_slider").bind({
            change: this.fwdChange
        });
        $("#str_slider").bind({
            change: this.strChange
        });
        this.reset();
    },

    'reset': function () {

    },

    'checkKey': function (event) {
        /*
         * W S A D = 87 , 83 , 65 , 68
         */
        let upKey = 87;
        let downKey = 83;
        let leftKey = 65;
        let rightKey = 68;
        let stopKey = 32;
        let current = 0;
        let x = 0;
        switch (event.which) {
            case stopKey:
                event.preventDefault();
                x = 0;
                $("#fwd_slider").val(x);
                $("#fwd_label_id").text(x);
                $("#str_slider").val(x);
                $("#str_label_id").text(x);
                break;
            case upKey:
                event.preventDefault();
                current =  parseInt($("#fwd_slider").val());
                x = current < 255 ? (current + 15) : current;
                $("#fwd_slider").val(x);
                $("#fwd_label_id").text(x);
                break;
            case downKey:
                event.preventDefault();
                current =  parseInt($("#fwd_slider").val());
                x = current > -255 ? (current - 15) : current;
                $("#fwd_slider").val(x);
                $("#fwd_label_id").text(x);
                break;
            case leftKey:
                event.preventDefault();
                current =  parseInt($("#str_slider").val());
                x = current > -1 ? (current - 1) : current;
                $("#str_slider").val(x);
                $("#str_label_id").text(x);
                break;
            case rightKey:
                event.preventDefault();
                current =  parseInt($("#str_slider").val());
                x = current < 1 ? (current + 1) : current;
                $("#str_slider").val(x);
                $("#str_label_id").text(x);
                break;
        }
        app.transformAndSend();
    },

    'fwdChange': function(event) {
        $('#fwd_label_id').html(event.target.value);
        app.transformAndSend();
    },

    'strChange': function(event) {
        $('#str_label_id').html(event.target.value);
        app.transformAndSend();
    },

    'transformAndSend': function(){
        let x = parseInt($("#fwd_slider").val());
        let y = parseInt($("#str_slider").val());
        let direction = x < 0 ? 2 : x > 0 ? 1 : 0;
        let tiller = y < 0 ? 1 : y > 0 ? 2 : 0;
        let velocity = Math.abs(x);

        console.log(x+','+y+','+tiller+','+direction+','+velocity);
        let url = "/api/go/"+tiller+"/"+direction+"/"+velocity;
        $.getJSON(url, function(data){
            console.log(data);
        });
    }
};

app.init();
