let w_container =document.querySelector(".container");
let cityInput = document.querySelector(".city_name");
let cityName = document.querySelector(".weather_city");
let dateTime = document.querySelector(".weather_date_time");
let w_forecast = document.querySelector(".weather_forecast");
let w_icon = document.querySelector(".weather_icon");
let w_temp = document.querySelector(".weather_temp");
let w_minTem = document.querySelector(".weather_min");
let w_maxTem = document.querySelector(".weather_max");
let feelsLike = document.querySelector(".weather_feelslike");
let wind = document.querySelector(".weather_wind");
let pressure = document.querySelector(".weather_pressure");
let w_date = document.querySelector(".weather_date")
let w_var = document.querySelector(".weather_datevar");
let loader = document.querySelector(".preloader");
let w_body = document.querySelector(".weather_body");
let w_info = document.querySelector(".weather_info");
let suggestionsList = document.getElementById("citySuggestions");

let activeIndex = -1; /*for selection */


// for suggestionsList 
cityInput.addEventListener("input", async () => {
    const query = cityInput.value.trim();
    suggestionsList.innerHTML = "";
    activeIndex = -1;

    if (query.length < 2) return;

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            suggestionsList.innerHTML = "";  // Clear previous results first
            const noResultItem = document.createElement("li");
            noResultItem.textContent = "No Suggestion!";
            noResultItem.style.fontStyle = "italic";
            suggestionsList.appendChild(noResultItem);
            return;
        }

        data.results.forEach((city) => {
            const item = document.createElement("li");

            // Get region 
            const region = city.admin1 || ""; // empty if not available

            const flagImg = `<img src="https://flagcdn.com/24x18/${city.country_code.toLowerCase()}.png" alt="${city.country}" style="vertical-align: middle; margin-right: 8px;">`;
            item.innerHTML = `${flagImg} ${city.name}, ${region ? region + ', ' : ''}${city.country}`;
            item.dataset.city = city.name;

            item.addEventListener("click", () => {
                selectCity(city.name);
            });

            suggestionsList.appendChild(item);
        });

    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
});


// using arrow key for selection 
cityInput.addEventListener("keydown", (e) => {
    const items = suggestionsList.querySelectorAll("li");

    if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        updateActiveItem(items);
    } else if (e.key === "Enter") {
        e.preventDefault();

        if (activeIndex >= 0 && items[activeIndex]) {
            const city = items[activeIndex].dataset.city;
            selectCity(city);
        } else {
            const city = cityInput.value.trim();
            if (city) selectCity(city);
        }
    }
});

function selectCity(city) {
    getWeatherData(city);
    cityInput.value = "";  // clear input
    suggestionsList.innerHTML = "";  // hide suggestions
    activeIndex = -1;
}

function updateActiveItem(items) {
    items.forEach((item, index) => {
        item.classList.toggle("active", index === activeIndex);
        if (index === activeIndex) {
            item.scrollIntoView({ block: 'nearest' }); // Auto scroll to visible area
        }
    });
}
// remove suggestionbox after click 
document.addEventListener("click", (e) => {
    if (!e.target.closest(".weather_search")) {
        suggestionsList.innerHTML = "";
        activeIndex = -1;
    }
});


const getWeatherData = async (city) => {
    loader.classList.add("show");
    w_body.classList.add("hidden");
    w_info.classList.add("hidden");

    try {
        let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        let geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            cityName.textContent = "City not found!";
            w_icon.innerHTML = `<img class="weather-gif" src="./icons/no-location.webp" alt="city not found">`;
            w_temp.textContent = "";
            w_minTem.textContent = "";
            w_maxTem.textContent = "";
            feelsLike.textContent = "";
            wind.textContent = "";
            pressure.textContent = "";
            w_date.textContent = "";
            w_var.textContent = "";
            dateTime.textContent = "";
            return;
        }
        // info of city 
        const { latitude, longitude, name, country } = geoData.results[0];

        // fetching data using latitude longitude
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,pressure_msl_mean,wind_speed_10m_max,sunrise,sunset&current_weather=true&timezone=auto`;

        let res = await fetch(weatherUrl);
        let weatherData = await res.json();
        console.log(weatherData);
        const today = 0;
        const daily = weatherData.daily;
        const current = weatherData.current_weather;
        const sunriseStr = daily.sunrise[today];
        const sunsetStr = daily.sunset[today];
        const cityTimeZone = weatherData.timezone;
        const day = isDaytime(cityTimeZone, sunriseStr, sunsetStr);

        cityName.textContent = `${name}, ${country}`;
        dateTime.textContent = `${getCurrentTime(cityTimeZone)}`;
        w_temp.textContent = `Current Temp: ${current.temperature}°C`;
        w_minTem.textContent = `Min: ${daily.temperature_2m_min[today]}°C`;
        w_maxTem.textContent = `Max: ${daily.temperature_2m_max[today]}°C`;
        feelsLike.textContent = `${daily.apparent_temperature_max[today]}°C`;
        wind.textContent = `${current.windspeed} km/h`;
        pressure.textContent = `${daily.pressure_msl_mean[today]} hPa`;
        w_date.textContent = `${todayDate(cityTimeZone)}`;
        w_var.textContent = `${getDayName(cityTimeZone)}`;
        w_icon.innerHTML = `<img class="weather-gif" src="./icons/${selectWeather(current.weathercode, day)}" alt="weather icon">`;
    }catch (error) {
        cityName.textContent = "Error fetching data: " + error.message;

        return;
    }finally{
        cityInput.value = "";
        suggestionsList.innerHTML = "";
        activeIndex = -1;
       loader.classList.remove("show");
       w_body.classList.remove("hidden");
       w_info.classList.remove("hidden");
    }
};


// Selection of weather icon, body-color according to weather & day/night 
function selectWeather(code,day){
    w_container.classList.remove("day-clear","night-clear","day-cloud","night-cloud","day-fog","night-fog","day-rain","night-rain","day-snow","night-snow");
    switch(code){
        case 0:{
            if(day){
                w_container.classList.add("day-clear");
                return  "sun.gif"
            }
            else{
                w_container.classList.add("night-clear")
                return  "moon.gif";
            }
        } 
        case 1:case 2: case 3:{
            if(day){
                w_container.classList.add("day-cloud");
                return  "sun-cloud.gif";
            }
            else{
                w_container.classList.add("night-cloud")
                return  "moon-cloud.webp";
            }
        }
        case 45:case 48:{
            if(day){
                w_container.classList.add("day-fog");
                return  "sun-fog.webp";
            }
            else{
                w_container.classList.add("night-fog")
                return  "moon-fog.webp";
            }
        } 
        case 51:case 53:case 55:case 61:case 63:case 65:case 80:case 81:case 82:{
            if(day){
                w_container.classList.add("day-rain");
                return  "sun-rain.gif";
            }
            else{
                w_container.classList.add("night-rain");
                return  "moon-rain.webp";
            }
        } 
        case 71:case 73:case 75:{
            day ? w_container.classList.add("day-snow") : w_container.classList.add("night-snow");
            return "snow.gif";
        }
        case 95:case 96:case 99: {
            day ? w_container.classList.add("day-strom") : w_container.classList.add("night-strom");
            return "strom.gif";
        }
        default: return "";
    }
}

// getting proper time of searched city 
function getCurrentTime(cityTimeZone) {
    let now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: cityTimeZone
    });
}
function todayDate(cityTimeZone) {
    let now = new Date();
    return now.toLocaleString('en-US', {
        timeZone: cityTimeZone,
        year: 'numeric',      
        month: 'long', 
        day: '2-digit',
        hour12: false 
    });
}
// sunday,monday.. 
function getDayName(cityTimeZone) {
    let now = new Date();
    return now.toLocaleDateString('en-US',{
        timeZone: cityTimeZone,
        weekday: 'long'
    });   
}
function isDaytime(cityTimeZone, sunriseStr, sunsetStr) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: cityTimeZone }));
    sunrise = new Date(sunriseStr);
    sunset = new Date(sunsetStr);

    return now >= sunrise && now <= sunset;
}

// by default surat weather 
getWeatherData("surat");
