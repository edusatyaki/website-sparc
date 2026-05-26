var personview;

document.addEventListener("DOMContentLoaded", function() {
  personview = new Vue({
    el: "#peoplelist",
    data: {
      people: []
    },
    mounted: function() {
      fetch("/person/list")
        .then(function(response) {
          return response.json();
        })
        .then(function(listpersons) {
          personview.people = listpersons;
        });
    }
  });
});

function deleteperson(id) {
  if (confirm("Are you sure you want to delete?")) {
    $.post("/person/delete/" + id, function(status) {
      if (status) {
        document.location.reload();
      }
    });
  }
}
