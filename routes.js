var express = require("express");
var router = express.Router();

// User side pages -----

router.get("/", function(req, res) {
  res.render("index");
});

router.get("/contact", function(req, res) {
  res.render("contact", {
    status: false
  });
});

// router.get('/about', function (req, res) {
//     res.render('about');
// });

router.get("/support", function(req, res) {
  res.render("support");
});

router.get("/privacypolicy", function(req, res) {
  res.render("privacypolicy");
});

router.get("/logout", function(req, res) {
  res.redirect("/");
});
/* implemented in project routes -----
router.get('/gallery', function (req, res) {
    res.render('gallery');
});
*
/* Implemented in product routes -----
router.get('/shop', function (req, res) {
    res.render('shop');
});
*/

// -----

// Admin routes -----

router.get("/login", function(req, res) {
  res.render("login");
});

router.post("/login", function(req, res) {
  //- console.log(req.body);
  if (req.body.username == "sagar" && req.body.password == "sparc") {
    res.redirect("/dashboard");
  } else {
    res.render("login", {
      failure: true
    });
  }
});

/*router.get('/dashboard', function (req, res) {
    res.render('dashboard');
});*/

// Data Routes -----

// var async = require('async')

// Require controller modules.
var enquiry_controller = require("./controllers/enquiryController");
var product_controller = require("./controllers/productController");
// var productcategory_controller = require('./controllers/productcategoryController');
var project_controller = require("./controllers/projectController");
var person_controller = require("./controllers/personController");

router.get("/person/list", person_controller.person_list);
router.post("/person/create", person_controller.person_create);

//
router.get("/person/create", function(req, res) {
  res.render("edit-about");
});

//Delete Person
router.post("/person/delete/:id", person_controller.person_delete_post);

//delete ll team
router.get("/person/delete/all/team", person_controller.person_delete_all_get);

router.get("/about", person_controller.about_get);

/// ENQUIRY ROUTES ///

// POST request for creating Enquiry.
router.post("/enquiry/create", enquiry_controller.enquiry_create_post);

router.post("/enquiry/contact", enquiry_controller.enquiry_contact_create_post);

// POST request to delete Enquiry.
router.post("/enquiry/:id/delete", enquiry_controller.enquiry_delete_get);

// GET request for one Enquiry.
router.get("/enquiry/:id", enquiry_controller.enquiry_detail);

// GET request for list of all Enquiry items.
router.get("/dashboard/enquiries", enquiry_controller.enquiry_list);

// GET request for list of all unread Enquiry items.
router.get("/dashboard", enquiry_controller.dashboard_list);

/// PRODUCT ROUTES ///

// GET request for creating product.
router.get("/product/create", function(req, res) {
  res.redirect("/dashboard/products");
});

// POST request for creating product.
router.post("/product/create", product_controller.product_create_post);

// POST request to delete product.
router.post("/product/:id/delete", product_controller.product_delete_post);

// POST request to update product.
router.post("/product/:id/update", product_controller.product_update_post);

// GET request for one product.
router.get("/product/:id", product_controller.product_detail);

// GET request for list of all products.
router.get("/dashboard/products", product_controller.product_edit);

router.get("/shop", product_controller.product_list);

// GET request for one product image.
router.get("/product/image/:id", product_controller.product_image_get);

/// PROJECT ROUTES ///

// GET request for creating project.
router.get("/project/create", project_controller.project_edit);

// POST request for creating project.
router.post("/project/create", project_controller.project_create_post);

// POST request to delete project.
router.post("/project/:id/delete", project_controller.project_delete_post);

// POST request to update project.
router.post("/project/:id/update", project_controller.project_update_post);

// GET request for one project.
router.get("/project/:id", project_controller.project_detail);

// GET request for list of all project.
router.get("/dashboard/projects", project_controller.project_edit);

router.get("/projects", project_controller.project_list);

// GET request for one project image.
router.get("/project/image/:id", project_controller.project_image_get);

router.get("/api/projects", project_controller.project_list_api);

router.get(
  "/api/project/sign-s3/put",
  project_controller.project_sign_s3_put_get
);

// Local multipart upload endpoint that replaces direct-to-S3 PUT.
// The controller exports an array [multer-middleware, handler]; spread it so
// Express registers them as separate handlers.
router.post(
  "/api/project/image/upload",
  ...project_controller.project_image_upload_post
);

router.get(
  "/api/project/image/delete",
  project_controller.project_s3_delete_get
);

/* Will be implemented in future if needed ---- *
/// CATEGORY ROUTES ///

// GET request for creating a category. NOTE This must come before route that displays category (uses id).
router.get('/productcategory/create', productcategory_controller.productcategory_create_get);

//POST request for creating category.
router.post('/productcategory/create', productcategory_controller.productcategory_create_post);

// GET request to delete category.
router.get('/productcategory/:id/delete', productcategory_controller.productcategory_delete_get);

// POST request to delete category.
router.post('/productcategory/:id/delete', productcategory_controller.productcategory_delete_post);

// GET request to update category.
router.get('/productcategory/:id/update', productcategory_controller.productcategory_update_get);

// POST request to update category.
router.post('/productcategory/:id/update', productcategory_controller.productcategory_update_post);

// GET request for one category.
router.get('/productcategory/:id', productcategory_controller.productcategory_detail);

// GET request for list of all category.
router.get('/productcategories', productcategory_controller.productcategory_list);

/* */

//export this router to use in our index.js
module.exports = router;
