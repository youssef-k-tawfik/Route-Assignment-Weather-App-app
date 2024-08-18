/*----------------------------------------

    Project: Weather App
    
    JS INDEX
    ===================
    00. Variables
    01. Events
    02. Functions

----------------------------------------*/

/*----------------------------------------
  00. Variables
----------------------------------------*/

const GOOGLE_MAPS_API_KEY =
  "QUl6YVN5RE42SHUtYV92THBWNTNwQlhuRHc0OVU1M29zdTZORlhj";
const WEATHER_API_KEY = "MzQzMzc0YWJkY2EzNDdkM2JmODE2MDQ0NzI0MTgwOA==";

function getKey(key) {
  return atob(key);
}

let fetchedData;
const dataMap = new Map();

const loader = document.querySelector(".loader");

/*----------------------------------------
01. Events
----------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
  // Load Alexandria till the user gives GeoAPI the permission
  getData("Alexandria");
  const city = await getUserLocation();
  getData(city);
});

document.getElementById("cityInput").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  /^[a-zA-Z\s\u0621-\u064A]+$/.test(query) && getData(query);
});

/*----------------------------------------
02. Functions
----------------------------------------*/

async function getUserLocation() {
  try {
    const { latitude, longitude } = await getGeolocation();
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${getKey(
        GOOGLE_MAPS_API_KEY
      )}`
    );
    const data = await res.json();
    return data.results[0].address_components[4].short_name;
  } catch (err) {
    console.error(err);
    return "Alexandria";
  }
}
function getGeolocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(onGeoLocationSuccess(position)),
      (err) => reject(onGeoLocationFail(err))
    );
  });
}
function onGeoLocationSuccess(position) {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
function onGeoLocationFail(err) {
  let errorMessage;
  switch (err.code) {
    case err.PERMISSION_DENIED:
      errorMessage = "User denied the request for Geolocation.";
      break;
    case err.POSITION_UNAVAILABLE:
      errorMessage = "Location information is unavailable.";
      break;
    case err.TIMEOUT:
      errorMessage = "The request to get user location timed out.";
      break;
    case err.UNKNOWN_ERROR:
      errorMessage = "An unknown error occurred.";
      break;
  }
  console.error(`Couldn't get user's location because: ${errorMessage}`);
}

async function getData(city) {
  if (dataMap.has(city)) {
    // Check if cached before
    fetchedData = dataMap.get(city);
    mapData();
    displayAllData();
  } else {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${getKey(
          WEATHER_API_KEY
        )}&q=${city}&days=7`
      );
      fetchedData = await res.json();
      dataMap.set(city, fetchedData);
      mapData();
      displayAllData();
    } catch (err) {
      console.error(err);
    }
  }
}

function mapData() {
  // ! NOW
  mapNowData();

  // ! Hourly
  mapHourlyData();

  // ! Additional info
  mapAdditionalInfoData();

  // ! 7-Day Forecast
  mapWeekData();
}

function mapNowData() {
  dataMap
    .set("queriedLocation", fetchedData.location.name)
    .set("currentTemp", Math.floor(fetchedData.current.temp_c))
    .set("currentCondition", fetchedData.current.condition.text)
    .set("currentConditionIcon", fetchedData.current.condition.icon);
}

function mapHourlyData() {
  const currentHour = new Date().getHours();
  const hourly = fetchedData.forecast.forecastday[0].hour.slice(
    currentHour,
    currentHour + 6
  );
  if (hourly.length < 6) {
    const hoursLeft = 6 - hourly.length;
    for (let i = 0; i < hoursLeft; i++) {
      hourly.push(fetchedData.forecast.forecastday[1].hour[i]);
    }
  }
  // console.log(hourly); // * Now hourly has all 6 days

  hourly.forEach((hour, i) => {
    dataMap.set(`hour ${i + 1}`, {
      time: getTime(currentHour + i),
      conditionURL: hour.condition.icon,
      temp: Math.floor(hour.temp_c),
    });
  });
}

function mapAdditionalInfoData() {
  dataMap
    .set("realFeel", Math.floor(fetchedData.current.feelslike_c))
    .set("windSpeed", Math.floor(fetchedData.current.wind_kph))
    .set("pressure", Math.floor(fetchedData.current.pressure_mb))
    .set("uvIndex", fetchedData.current.uv);
}

function getTime(time) {
  let hour;
  const calculatedHour = time < 24 ? time : time - 24;
  if (calculatedHour === 0) hour = "12 AM";
  else if (calculatedHour === 12) hour = "12 PM";
  else if (calculatedHour < 12) hour = `${calculatedHour} AM`;
  else hour = `${calculatedHour - 12} PM`;
  return hour;
}

function getDay(day) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
  day = day < weekDays.length ? day : day - weekDays.length;
  return weekDays[day];
}

function mapWeekData() {
  const today = new Date().getDay();
  const week = fetchedData.forecast.forecastday; // List of 7 days

  week.forEach((forecastDay, i) => {
    dataMap.set(`day ${i + 1}`, {
      day: i === 0 ? "Today" : getDay(today + i),
      conditionURL: forecastDay.day.condition.icon,
      conditionText: getConditionText(forecastDay.day.condition.text),
      maxTemp: Math.floor(forecastDay.day.maxtemp_c),
      minTemp: Math.floor(forecastDay.day.mintemp_c),
    });
  });
}
function getConditionText(txt) {
  return txt.includes("rain")
    ? "rainy"
    : txt.includes("Cloud")
    ? "cloudy"
    : txt;
}

function displayAllData() {
  console.log(dataMap);

  // ! NOW
  displayNowData();

  // ! Hourly
  displayHourly();

  // ! Additional
  displayAdditionalData();

  // ! 7 Days
  displayWeek();

  loader.classList.add("hidden");
}

function displayNowData() {
  document.getElementById("htmlLocation").textContent =
    dataMap.get("queriedLocation");
  document.getElementById("htmlCurrentTemp").textContent =
    dataMap.get("currentTemp");
  document.getElementById("htmlCurrentConditionIMG").src = dataMap.get(
    "currentConditionIcon"
  );
  document.getElementById("htmlCurrentCondition").textContent =
    dataMap.get("currentCondition");
}

function displayHourly() {
  const hourlyList = document.querySelector(".hourly-list");
  hourlyList.innerHTML = "";
  for (let i = 1; i < 7; i++) {
    const hour = dataMap.get(`hour ${i}`);
    hourlyList.innerHTML += generateHourlyElement(hour);
  }
}
function generateHourlyElement(hour) {
  return `
    <li>
      <div class="hour-head">${hour.time}</div>
      <div class="hour-body">
        <img
          src="${hour.conditionURL}"
          alt="hour condition"
        />
      </div>
      <div class="hour-footer">
        ${hour.temp}&deg;
      </div>
    </li> 
    <li class="hour-white-line"></li>
  `;
}

function displayAdditionalData() {
  document.getElementById("htmlRealFeel").textContent = dataMap.get("realFeel");
  document.getElementById("htmlWindSpeed").textContent =
    dataMap.get("windSpeed");
  document.getElementById("htmlPressure").textContent = dataMap.get("pressure");
  document.getElementById("htmlUV").textContent = dataMap.get("uvIndex");
}

function displayWeek() {
  const weekList = document.querySelector(".week-list");
  weekList.innerHTML = "";
  for (let i = 1; i < 8; i++) {
    const day = dataMap.get(`day ${i}`);
    weekList.innerHTML += generateForecastDay(day);
  }
}
function generateForecastDay(day) {
  return `
  <li class="d-flex justify-content-between align-items-center">
    <div class="day">${day.day}</div>
    <div class="condition d-flex align-items-center gap-2">
      <img
        src="${day.conditionURL}"
        alt="weather condition"
      />
      <p class="week-condition">${day.conditionText}</p>
    </div>
    <div class="max-min">${day.maxTemp}&deg;/${day.minTemp}&deg;</div>
  </li>
  <li class="week-white-line mx-auto"></li>
  `;
}
