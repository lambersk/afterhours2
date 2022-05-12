/*  This is the  backend of the After Hours Application. (NodeJS).
  It fetches API keys and Data from SeatGeek and forwards it to the frontend.
*/

const dotenv = require('dotenv').config()

const ADDRESS = process.env.ADDRESS || ''  		/* for example, https://vegaby.herokuapp.com */
const GOOGLE_KEY = process.env.GOOGLE_KEY || ''		/* API key for use with Google Maps */
const SEATGEEK_KEY = process.env.SEATGEEK_KEY || ''		/* API key for use with YELP FUsion API */
const ROOT_URL = process.env.ROOT_URL || ''  		/* Optional e.g. "/vegaby" -- use this to deploy inside a subfolder. */
const PORT = process.env.PORT || 5000			/* Optional PORT number */

const express = require ('express');      // express framework 
const fetch = require('node-fetch');      // library for making requests (similar to axios)
const cors = require('cors');             // Cross Origin Resource Sharing
const bodyParser = require('body-parser') // middleware to parse JSON data that is sent from the frontend.

const app = express(); // enable express
app.use( cors() ); // make express attach CORS headers to responses
app.use( express.json() ); // add json capabilities to our express aptestingp

/* Serve up static assets, i.e. the Frontend of the site. */
app.use(ROOT_URL+'/', express.static('public'))  

/* The frontend may request the Google API Key via this endpoint. */
app.get(ROOT_URL+'/AIzaSyCtrn0z-_uXUiN9MNkzzE6IAP5Qr4gJbko', (req,res) => {
  /* We will not share our API Key outside of our own domain. */
  if ( req.headers.referer.startsWith(ADDRESS) ){
    res.send({ "Status":"OK", "GOOGLE_KEY":GOOGLE_KEY })
  }
  else{
    res.send({ "Status": "Error", 
	      "Message": "Google API Key is not authorized for this domain." ,
	      "Referer" : req.headers.referer,
	      "Expected" : ADDRESS
     })
  }
})

/* When the frontend needs restaurants it will use this endpoint
 The frontend sends lat/lng coordinates as JSON in the body of the request. 
 The backend parses this JSON using the "bodyParser" middleware
 see also: https://www.npmjs.com/package/body-parser  */

app.post(ROOT_URL+'/events?client_id=MjYyMzMzODR8MTY0ODAxMjAwNy4xMjM5ODE3&q=concert', bodyParser.json(), (req, res) => {

  
  let parameters = new URLSearchParams({
    term: 'concert',
    limit: 50,
    latitude: req.body.lat,
    longitude: req.body.lng
  })
  let url = 'https://api.seatgeek.com/2'
 
  let options = {
	  "headers": {
      "Authorization": "Bearer "+ SEATGEEK_KEY 	
    }
  }
  fetch(url, options)
    .then(response => response.json())
    .then(result => res.send( result ) )
    .catch(error => console.log('error', error));

});

//Go live
app.listen(PORT,  () => {
  console.log("We are live " );
});

