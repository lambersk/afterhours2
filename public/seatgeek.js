/* This is the frontend of the vegaby app. It runs in the browser.
 It fetches our Google API key from the backend (NodeJS)  
 It fetches and initializes Google Maps from Google. 
 It fetches restaurants from Yelp via the backend (NodeJS) 
 It builds Info Windows for restaurants. */

 /* IMPORTANT: Explore the Google Maps documentation for further details and examples.
 https://developers.google.com/maps/documentation/javascript/examples/infowindow-simple */




let map             /* google maps gets initialized here. */ 
let bounds          /* defines an area on the map bit enough to fit all restaurants. */ 
let currentWindow   /* keeps track of which infor window is currently open.*/ 

/* The "initMap" function initializes the Google Map.  
It runs automatically via a callback after the Google Maps script loads. 
*/


// function setup(){

//   pixelDensity(2);
  
//   for (let i = 0; i < numStars; i++) {
//     let X = random(690,900);
//     let Y = random(500,400);
//     let randScale = random(minSize, maxSize);
//     let randType = random(3) >= 1 ? "a" : "b";
//     let randCol = floor(random(palette.length));

//     let newStar = new SmoothStar(
//       X,
//       Y,
//       randScale,
//       randType,
//       randCol
//     );
//     stars.push(newStar);
    
//     fade = 0

// }

// }

// function draw(){
//   stars.forEach((star) => {
//     star.showStar();
//   });
// }
//   class SmoothStar {
//     constructor(x, y, sine, type, colourNum) {
//       this.x = x;
//       this.y = y;
//       this.sine = sine;
//       this.type = type;
//       this.colourNum = colourNum;
//       this.inc = 0.01;
//       this.blur = 15;
//       this.offset = floor(random(numStars))
//     }
  
//     showStar() {
//       this.size = abs(sin(this.offset + frameCount * 0.08)) * this.sine
//       this.blur = abs(sin(this.offset + frameCount * 0.08)) * 40
      
//       drawingContext.shadowBlur = this.blur;
//       push();
//       translate(this.x, this.y);
//       rotate(QUARTER_PI / 4);
//       scale(this.size);
//       fill(palette[this.colourNum]);
//       stroke(palette[this.colourNum]);
//       drawingContext.shadowColor = palette[this.colourNum];
  
//       if (this.type === "a") {
//         // quad bezier version (diamond)
//         strokeWeight(5)
//         beginShape();
//         vertex(0, -100);
//         quadraticVertex(0, 0, 100, 0);
//         quadraticVertex(0, 0, 0, 100);
//         quadraticVertex(0, 0, -100, 0);
//         quadraticVertex(0, 0, 0, -100);
//         endShape(CLOSE);
//       } else {
//         // cubic bezier version (plus sign)
//         strokeWeight(2)
//         beginShape();
//         vertex(0, -100);
//         bezierVertex(0, 0, 0, 0, 100, 0);
//         bezierVertex(0, 0, 0, 0, 0, 100);
//         bezierVertex(0, 0, 0, 0, -100, 0);
//         bezierVertex(0, 0, 0, 0, 0, -100);
//         endShape(CLOSE);
//       }
//       pop();
//     }
//   }


function initMap(){
  
  /* Here we ask the browser for the user's location. 
  This involves a consent step. See also, MDN Documentation for the Geolocation API: 
  https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API */ 

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      let userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
      };
      
      // the bounds get extended whenever we add a point. 
      // here we are adding the user's location to initialize the bounds
      bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation); 

      map = new google.maps.Map(
        document.getElementById('map'),
        {
          center: userLocation,
          zoom: 10,
          disableDefaultUI: true,
          mapId: '4e76445e194d667'
        }
      );
      fetchConcert(userLocation);
    });
  }
}

/* Send a POST request to the "restaurants" endpoint. 
send along the  user's location as JSON data in the body of the request. 
NodeJS will use this data to query YELP */ 
const fetchConcert = (userLocation) => {
  fetch("/events", {
    body: JSON.stringify(userLocation),
    method: 'POST',
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => response.json())
  .then(data => {
    for (concert of data.data.events){
      /* NodeJS will send us restaurant data from Yelp 
      To explore the data, log it to the console. */ 
      console.log(concert)
      /* pass along each restaurant to be mapped.*/ 
      mapEvents( concert )
    }
  })
  .catch(err => { console.error(err)  });
}

/* Given a JSON object that describes a restaurant, 
we are ready to add it to the map.*/
const mapConcert = (concert) => {
  /* Each YELP listing includes GPS coordinates.
  Here, we set up these coordinates in a way that Google understands. */ 
  let latLng = new google.maps.LatLng(
    concert.coordinates.latitude,
    concert.coordinates.longitude
  );
  /* extend the bounds of the map to fit each new point */ 
  bounds.extend(latLng);
  map.fitBounds(bounds);

  /* Make an "infowindow" for each event. 
  This is like a bubble that appears when we click on a marker.
  You could modify this template to show a variety of details. */ 
  let infowindow = new google.maps.InfoWindow({
    maxWidth: 400,
    content: 
      `<img style="width: 100%" src="${concert.images.huge}">
       <h3>${concert.name}</h3>
       <h4>${concert.datetime_utc}</h4>
       <h4> ${concert.address} </h4>3
       <p><a target="_blank" href="${concert.url}">View Listing</a></p>`
  });

  /* Markers are customizable with icons, etc.*/ 
  let marker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon: "locationpin.png"
  });
  
  /* here we control what happens when the user clicks on a marker.*/ 
  marker.addListener("click", () => {
    try{  
      /* if another window is already open, close it first*/ 
      currentWindow.close() 
    }
    catch(e){  
      /* no window is open yet  so we don't need to do anything. */ 
    }
    /* open the infowindow attached to this marker. */ 
    infowindow.open(map, marker);
    /* set the infowindow as "currentWindow"
     this will allow us to track it and close it on subsequent clicks. */
    currentWindow = infowindow; 
  });
}

// Note that "apikey" here is actually a URL. 
// it corresponds to an endpoint on which NodeJS is listening.
// After fetching the API Key from Node, the frontend will in turn fetch Google Maps.
fetch("apikey")
.then(response => response.json())
.then(data => {
  if (data.Status == "OK"){
    /* Now that we have an API Key for Google Maps, 
    We can generate a URL to fetch the Google Maps Javascript.
    We Include parameters for the Google API Key and callback function.
    After the script is loadeded, the callback function "initMap" will run. */  
    let url = 'https://maps.googleapis.com/maps/api/js'+
                '?key='+data.GOOGLE_KEY+
                '&callback=initMap';
    /* Add the Google Maps JavaScript to the page. */ 
    let script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  else{
    console.log(concert);
  }
})
.catch(err => {
  console.error(err);
});
