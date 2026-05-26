/* eslint-env browser, jquery */

function enquire(id) {

    var user = {
        name: sessionStorage.getItem('username'),
        email: sessionStorage.getItem('email'),
        phone: sessionStorage.getItem('phone')
    };



    //while (user.email == null || user.email == 'null' || user.email == '') {
    if (user.email == null || user.email == 'null' || user.email == '') {
        user.name = prompt('Enter you name:');
        user.email = prompt('Enter you email:');
        user.phone = prompt('Enter you phone:');

        sessionStorage.setItem('username', user.name);
        sessionStorage.setItem('email', user.email);
        sessionStorage.setItem('phone', user.phone);
    }

    user.productid = id;

    /**/
    $.post('/enquiry/create', user, function (product) {
        M.toast({
            html: 'Enquiry sent for ' + product.name
        });
    });

    /**/
    //console.log(user);
}



/* eslint-env browser, jquery */

(function ($) {
    $(function () {



        // Masonry Grid
        var $masonry = $('.shop');
        $masonry.masonry({
            // set itemSelector so .grid-sizer is not used in layout
            itemSelector: '.shop-item',
            // use element for option
            columnWidth: '.shop-item',
            // no transitions
            transitionDuration: 0
        });
        // layout Masonry after each image loads
        $masonry.imagesLoaded(function () {
            $masonry.masonry('layout');
        });
        $('a.filter').click(function (e) {
            e.preventDefault();
        });




    }); // end of document ready
})(jQuery); // end of jQuery name space
