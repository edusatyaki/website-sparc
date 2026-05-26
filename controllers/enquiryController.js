var Enquiry = require('../models/enquiry')
var Product = require('../models/product')

// SendGrid has been replaced with a local dummy mailer for the
// minimally-functional build.  The dummy mailer logs to console + ./logs/mail.log
// and never makes a network request, so no SENDGRID_API_KEY is required.
const sgMail = require('../utils/mailer')
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'dummy-key')

// Display list of all Enquirys.
exports.enquiry_list = function(req, res) {
	Enquiry.find({}, '_id comment status', {
		sort: {
			date: -1 //Sort by Date Added DESC
		}
	}).exec(function(err, list_all) {
		if (err) {
			throw err
		}
		//Successful, so render
		res.render('dashboard', {
			enquiries: list_all
		})
		//res.send(list_products);
	})
	//res.send('NOT IMPLEMENTED: Enquiry list');
}

// Display list of all Enquirys.
exports.dashboard_list = function(req, res) {
	Enquiry.find(
		{
			status: true
		},
		'_id comment status',
		{
			sort: {
				date: -1 //Sort by Date Added DESC
			}
		}
	).exec(function(err, list_unread) {
		if (err) {
			throw err
		}
		//Successful, so render
		res.render('dashboard', {
			enquiries: list_unread
		})
		//res.send(list_products);
	})
}

// Display detail page for a specific Enquiry.
exports.enquiry_detail = function(req, res) {
	Enquiry.findById(req.params.id).exec(function(err, enquiry) {
		if (err) {
			throw err
		}
		//Successful, so render
		//console.log(product)
		res.send(enquiry)
		//res.send(list_products);
		enquiry.status = false
		Enquiry.findByIdAndUpdate(req.params.id, enquiry, {}, function(err) {
			if (err) {
				throw err
			}
			//Successful, so render
			//console.log(product)
			//res.send(enquiry);
			//res.send(list_products);
		})
	})
	// res.send('NOT IMPLEMENTED: Enquiry detail: ' + req.params.id);
}

// Handle Enquiry create on POST.
exports.enquiry_create_post = function(req, res) {
	Product.findById(req.body.productid).exec(function(err, pro) {
		var enquiry = new Enquiry({
			name: req.body.name,
			comment: req.body.comment,
			email: req.body.email,
			phone: req.body.phone
		})

		if (enquiry.comment == 'nothing') {
			enquiry.comment = 'About: ' + pro.name
		}

        let email = {
            to: 'sparc.ideas@gmail.com',
            from: `SpArc Enquiry <sparc@root-kings.com>`, //
            subject: `Enquiry: ${enquiry.comment} `,
            html: `<p>Body: ${enquiry.comment}. \
                        <br> \
                        <br>From: ${enquiry.name}  \
                        <br>Email: ${enquiry.email} \
                        <br>Phone: ${enquiry.phone} </p>`
        }

        sgMail.send(email).catch(console.error)

		enquiry.save(function(err) {
			if (err) {
				throw err
			}
			//successful - redirect to new book record.
			res.send(pro)

			
		})

		//res.send('NOT IMPLEMENTED: Enquiry create POST');
	})
}

// Handle Enquiry create on POST.
exports.enquiry_contact_create_post = function(req, res) {
	//console.log(req.body);

	var enquiry = new Enquiry({
		name: req.body.name,
		comment: req.body.comment,
		email: req.body.email,
		phone: req.body.phone
	})

	//console.log(enquiry);
    let email = {
        to: 'sparc.ideas@gmail.com',
        from: `SpArc Enquiry <sparc@root-kings.com>`, //
        subject: `Enquiry: ${enquiry.comment} `,
        html: `<p>Body: ${enquiry.comment}. \
                    <br> \
                    <br>From: ${enquiry.name}  \
                    <br>Email: ${enquiry.email} \
                    <br>Phone: ${enquiry.phone} </p>`
    }

    sgMail.send(email).catch(console.error)
	//res.send('NOT IMPLEMENTED: Enquiry create POST');

	enquiry.save(function(err) {
		if (err) {
			throw err
		}

		res.render('contact', {
			status: true
		})
	})
}

// Display Enquiry delete form on GET.
exports.enquiry_delete_get = function(req, res) {
	Enquiry.findByIdAndRemove(req.params.id, function(err) {
		if (err) {
			throw err
		}
		// Success - go to author list
		res.send(true)
	})
}

/* // Email ---
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

		let email = {
			// to: ['dayshmookh_krushn.ghrcecs@raisoni.net'],
			to: machine.supplier.email.split(';'),
			from: 'Krushn Dayshmookh <notifications@ofajassistant.com>', // 
			subject: `B.Q. for calibration of ${machine.name} from OFAJ`,
			html: `<p>Kindly give B.Q. for calibration of ${machine.name}. \
				   	<br>Thanking you! \
					<br>With regards, \
					<br>${machine.incharge.name} \
					<br>${inchagephone}
					<br>M.M. OFAJ Nagpur<p>`
		}


	console.log('Sending email...')

	sgMail
		.send(email)
		.then(result => {
			//Celebrate
			console.log('Sent mail.')
			
		})
		.catch(error => {
			//Log friendly error
			console.error(error.toString())

			//Extract error msg
			// const { message, code, response } = error

			//Extract response msg
			// const { headers, body } = response
		})

	
 */
