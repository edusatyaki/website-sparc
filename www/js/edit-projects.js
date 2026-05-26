let projectsVue

document.addEventListener('DOMContentLoaded', function() {
	// showWait()
	projectsVue = new Vue({
		el: '#projectList',
		data: {
			projects: [],
			selectedProject: {
				description: '',
				cost: '',
				owner: '',
				url: '',
				name: '',
				date: '',
				projectUrl: '',
				youtubeUrl: '',
				images: []
			},
			requestURL: '/project/create'
		},

		methods: {
			poplateProjects: function() {
				let currentVue = this

				fetch('/api/projects')
					.then(function(response) {
						return response.json()
					})
					.then(function(projects) {
						currentVue.projects = projects
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
			},
			viewProject: function(id) {
				localStorage.setItem('selectedProject', id)
				window.location.href = '/project'
			},
			onSubmit: function() {
				fetch(projectsVue.requestURL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(projectsVue.selectedProject)
				})
					.then(function(response) {
						M.toast({ html: 'Project details sent!' })
						$('#edit-modal').modal('close')
						projectsVue.poplateProjects()

						// TODO: redirect to success page
					})
					.catch(function(error) {
						M.toast({ html: 'Error occured! Check console for details.' })
						console.error(error)
					})
					.then(function() {
						// hideWait()
					})
			}
		},

		mounted: function() {
			this.poplateProjects()
			M.AutoInit()
			// hideWait()
		}
	})

	/* document.querySelector('#project-image').addEventListener('change',function(){

	}) */
})

function deleteproject(id) {
	if (confirm('Are you sure you want to delete?')) {
		$.post('/project/' + id + '/delete', {}, function(status) {
			if (status) {
				window.location.reload()
			}
		})
	}
}

function populate(id) {
	$.get('/project/' + id, {}, function(project) {
		projectsVue.selectedProject = project
		/*M.toast({
            html: 'Product Found ' + product.name
        });*/
		$('#edit-modal').modal('open')
		$('#modal-heading').html('Edit project')

		// $('#project-description')
		// 	// .val(project.description)
		// 	.focus()
		// $('#project-cost')
		// 	// .val(project.cost)
		// 	.focus()
		// $('#project-owner')
		// 	// .val(project.owner)
		// 	.focus()
		// $('#project-url')
		// 	// .val(project.url)
		// 	.focus()
		// $('#project-name')
		// 	// .val(project.name)
		// 	.focus()

		// $('#project-form').attr('action', '/project/' + id + '/update')
		projectsVue.requestURL = '/project/' + id + '/update'
		$('#delete-btn').attr('href', 'javascript:deleteproject("' + id + '");')

		//console.log(product._id)
	})
}

function clearproject() {
	$('#edit-modal').modal('open')
	$('#modal-heading').html('Create project')

	projectsVue.selectedProject = {
		description: '',
		cost: '',
		owner: '',
		url: '',
		name: '',
		date: '',
		projectUrl: '',
		youtubeUrl: '',
		images: []
	}

	// $('#project-description')
	// 	// .val('')
	// 	.focus()
	// // $('#project-image')
	// // .val('')
	// // 	.focus()
	// $('#project-cost')
	// 	// .val('')
	// 	.focus()
	// $('#project-owner')
	// 	// .val('')
	// 	.focus()
	// $('#project-url')
	// 	// .val('')
	// 	.focus()
	// $('#project-name')
	// 	// .val('')
	// 	.focus()

	// $('#project-form').attr('action', '/project/create')
	projectsVue.requestURL = '/project/create'

	$('#delete-btn').attr('href', '!#')
}

// S3 signed-PUT has been replaced by a local multipart POST to the server.
// The server returns { url } for the file which is then pushed into the
// project's images list.
const uploadFile = function(file) {
	const formData = new FormData()
	formData.append('file', file)

	fetch('/api/project/image/upload', {
		method: 'POST',
		body: formData
	})
		.then(function(response) {
			return response.json()
		})
		.then(function(data) {
			if (data && data.url) {
				projectsVue.selectedProject.images.push(data.url)
				M.toast({ html: 'Image uploaded.' })
			} else {
				throw new Error('Upload failed')
			}
		})
		.catch(function(error) {
			M.toast({ html: 'Error occured! Check console for details.' })
			console.error(error)
		})
}

const onFileUpload = function() {
	let file = document.querySelector('#project-image').files[0]
	if (file == null) return alert('No file selected.')
	uploadFile(file)
}

function deleteImage(imageURL) {
	let filename = imageURL.split('/').slice(-1)[0]

	fetch(`/api/project/image/delete?fileName=${filename}`)
		.then(function(response) {
			return response.json()
		})
		.then(function(data) {
			// console.log(data)
			// if (data) {
			let index = projectsVue.selectedProject.images.indexOf(imageURL)
			// console.log(filename)
			if (index > -1) {
				projectsVue.selectedProject.images.splice(index, 1)
			}
			// }
		})
		.catch(function(error) {
			M.toast({ html: 'Error occured! Check console for details.' })
			console.error(error)
		})
}
