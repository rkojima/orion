const axios = require('axios');
const cassandraBatch = require('./cassandraHelper');
const config = require('./config');


setInterval(updateMuniVehicles, 15000);

function updateMuniVehicles() {
    return axios.get('/agencies/sf-muni/vehicles', {
        baseURL: config.restbusURL
    })
    .then((response) => {
        const vehicles = response.data;
        console.log(vehicles);
	return vehicles.map(makeOrionVehicleFromNextbus);
    })
    .then(addVehiclesToCassandra)
    .catch((error) => {
        console.log(error);
    });
}

function makeOrionVehicleFromNextbus(nextbusObject) {
    const { id, routeId, lat, lon, heading } = nextbusObject;
    return {
        rid: routeId,
        vid: id,
        lat,
        lon,
        heading,
    };
}

function addVehiclesToCassandra(vehicles) {
    const vtime = new Date(Date.now());
    const vhour = vtime.getHours();
    const vdate = vtime.toISOString().slice(0, 10);
    const queries = vehicles.map(vehicle => {
        const {rid, vid, lat, lon, heading} = vehicle;
        return {
            query: 'INSERT INTO muni.muni_realtime_vehicles (vdate, vhour, rid, vid, vtime, lat, lon, heading) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            params: [vdate, vhour, rid, vid, vtime, lat, lon, heading],
        };
    });
    cassandraBatch(queries);
}
