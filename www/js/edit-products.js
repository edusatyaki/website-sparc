/* eslint-env browser, jquery */


function deleteproduct (id) {
    if(confirm('Are you sure you want to delete?')){
        $.post('/product/' + id + '/delete', function (status){
            if(status){
                document.location.reload();
            }
        });
    }
}

function populate(id) {

    $.get('/product/' + id, {}, function (product) {
        /*M.toast({
            html: 'Product Found ' + product.name
        });*/
        $('#edit-modal').modal('open');
        $('#modal-heading').html('Edit product');

        $('#product-description').val(product.description).focus();
        $('#product-cost').val(product.cost).focus();
        $('#product-name').val(product.name).focus();

        $('#product-form').attr('action', '/product/' + id + '/update');
        $('#delete-btn').attr('href', 'javascript:deleteproduct("' + id + '");');

        //console.log(product._id)
    });


}

function clearproduct() {


    $('#edit-modal').modal('open');
    $('#modal-heading').html('Create product');

    $('#product-description').val('').focus();
    $('#product-image').val('').focus();
    $('#product-cost').val('').focus();
    $('#product-name').val('').focus();

    $('#product-form').attr('action', '/product/create');

    $('#delete-btn').attr('href', '!#');


}

