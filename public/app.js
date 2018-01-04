function initMap() {
	const singapore = {lat: 1.3554, lng: 103.8677};
	const map = new google.maps.Map(document.getElementById('map'), {
		zoom: 11,
		center: singapore
	});
	window.map = map
	let infoWindow = new google.maps.InfoWindow();

	fetch('https://s3-ap-southeast-1.amazonaws.com/clinic-mapper/clinics.json.gz')
		.then(response => response.json())
		.then(clinics => clinics.map(clinic => new google.maps.Marker({
			clinic,
			position: clinic.position,
			map: map
		}))).then(markers => {
			window.markers = markers
			markers.forEach(marker => {
				google.maps.event.addListener(marker, 'click', function() {
					infoWindow.close();
					infoWindow = new google.maps.InfoWindow();
					const {
						clinicName,
						monFri,
						sat,
						sun,
						publicHolidays,
						clinicRemarks,
						blk,
						roadName,
						unitNo,
						buildingName,
						postalCode,
						phone,
					} = marker.clinic
					const infoContent = `
${clinicName}
${address(marker.clinic).join('\n')}

Phone: ${phone}

Mon-Fri: ${monFri}
Sat: ${sat}
Sun: ${sun}
Public Holidays: ${publicHolidays}

${clinicRemarks ? 'Remarks: ' + clinicRemarks : ''}`
					infoWindow.setContent(infoContent.trim().replace(/\n/g, '<br>'));
					infoWindow.open(map, marker);
				});
			})

			showMarkers(window.markers)
		})
}

const address = ({ blk, roadName, unitNo, buildingName, zone, postalCode }) => [
	`${blk} ${roadName}`.trim(),
	`${unitNo} ${buildingName}`.trim(),
	`${zone.match(/malaysia/i) ? 'Malaysia' : 'Singapore'} ${postalCode}`.trim(),
]

const filterFns = {
	isOpenOnSaturdays: clinic => clinic.sat && !clinic.sat.includes('Closed'),
	isOpenOnSundays: clinic => clinic.sun && !clinic.sun.includes('Closed'),
	isOpenOnPublicHolidays: clinic => clinic.publicHolidays && !clinic.publicHolidays.includes('Closed'),
	isOpen24Hours: clinic => ([
		clinic.monFri,
		clinic.sat,
		clinic.sun,
		clinic.publicHolidays,
		clinic.clinicRemarks
	].find(v => v && (v.includes('24 Hour') || v.includes('24 Hr')))),
	all: Boolean,
}

function showMarkers(markers) {
	markers.forEach(marker => marker.setVisible(true))
	updateVisibleClinics(markers)
}

function filterAndShow(filterFn, markers) {
	markers.forEach(marker => marker.setVisible(false))
	showMarkers(markers.filter(marker => filterFns[filterFn](marker.clinic)))
}

const ClinicItem = clinic => `
	<li>
		<p class="clinic-name">${clinic.clinicName}</p>
		<p class="clinic-address">${address(clinic).join(', ')}</p>
	</li>
`

function updateVisibleClinics(markers) {
	const visibleClinics = markers
		.filter(marker => marker.getVisible())
		.map(marker => marker.clinic)

	document.querySelector('#clinics').innerHTML = visibleClinics.map(ClinicItem).join('')
}
