/* eslint-env browser, jquery */


function viewenquiry(id) {

    $.get('/enquiry/' + id, {}, function (enquiry) {
        /*M.toast({
            html: 'Enquiry Found ' + enquiry.name
        });*/


        $('#enquiry-name').html(enquiry.name);
        $('#enquiry-date').html(enquiry.date);
        console.log(enquiry);

        $('#enquiry-email').html(enquiry.email);
        $('#enquiry-phone').html(enquiry.phone);
        $('#enquiry-email').attr('href','mailto:' + enquiry.email);
        $('#enquiry-phone').attr('href','phone:' + enquiry.phone);

        $('#enquiry-comment').html(enquiry.comment);

        $('#enquiry-modal').modal('open');

        //console.log(product._id)
    });


}

function deleteenquiry(id) {

    if(confirm('Are you sure you want to delete?')){
        $.post('/enquiry/' + id + '/delete', function(status){
            if(status){
                document.location.reload();
            }
        });
    }

}
