
function load() {
    const images = document.querySelectorAll('.small-icon');
    images.forEach(function (image) {
        image.src = '../img/cloud.svg';
    });

    const days = document.querySelectorAll('.daily__date');
    days.forEach(function (day, index) {
        switch(index) {
            case 0:
                day.innerHTML = 'Today';
                break;
            default:
                day.innerHTML = `Day ${index}`;    
        }
    });

    const daily_temp = document.querySelectorAll('.daily__temp');
    daily_temp.forEach(function (temp) {
        temp.innerHTML = '';
    });

    const daily_weather = document.querySelectorAll('.daily__weather');
    daily_weather.forEach(function (weather) {
        weather.innerHTML = '';
    });

    const daily_humidity = document.querySelectorAll('.daily__humidity');
    daily_humidity.forEach(function (humidity) {
        humidity.innerHTML = '';
    });

    const daily_wind = document.querySelectorAll('.daily__wind');
    daily_wind.forEach(function (wind) {
        wind.innerHTML = '';
    });
}

//load();


const show = {
    height: 'unset',
    overflow: 'visible'
}

const hide = {
    height: '0px',
    overflow: 'hidden'
}

/*=========================
Used chrome dev tool to get 
height of div.current after 
fetched data is displayed 
(265px) - used it to set 
minHeight for div.loader so 
that there's no difference
in height when switching
between loader & current.
==========================*/
const showLoader = {
    minHeight: '265px',
    overflow: 'visible'
}

const hideLoader = {
    minHeight: 'unset',
    height: '0px',
    overflow: 'hidden'
}

const add_padding = {
    padding: '20px 0'
}

const remove_padding = {
    padding: '0'
}

const add_opacity = {
    opacity: "1"
}

const remove_opacity = {
    opacity: "0.5"
}

const welcome = document.querySelector('.welcome');
const loader = document.querySelector('.loader');
const current = document.querySelector('.current');
const loader_message = document.querySelector('.loader__message');
const error_message = document.querySelector('.welcome__message');
const daily = document.querySelectorAll('.daily');

function fetchingWeatherData(fetchMessage) {
    load();
    Object.assign(loader.style, showLoader);
    Object.assign(welcome.style, hide, remove_padding);
    Object.assign(current.style, hide);
    daily.forEach(day => {
        Object.assign(day.style, remove_opacity);
    });
    loader_message.innerHTML = fetchMessage;
}

function fetchError(errorMessage) {
    load();
    Object.assign(welcome.style, show, add_padding);
    Object.assign(loader.style, hideLoader); 
    Object.assign(current.style, hide);
    daily.forEach(day => {
        Object.assign(day.style, remove_opacity);
    });
    error_message.innerHTML = errorMessage;
}

function fetchCompleted() {
    Object.assign(current.style, show);
    Object.assign(welcome.style, hide, remove_padding);
    Object.assign(loader.style, hideLoader); 
    daily.forEach(day => {
        Object.assign(day.style, add_opacity);
    });
}

const api = {
    key: "6a41cf11109a848f1463b2e373b4ff69",
    baseUrl: "https://api.openweathermap.org/data/2.5/"
}

const searchCity = document.querySelector('#search-city');
searchCity.addEventListener('keypress', setQuery);

function setQuery(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        if (searchCity.value < 1) {
            fetchError('Search field cannot be empty');
        }else {
            getResults(searchCity.value);
        }
    }
}

function getResults(query) {
    //Show loader to signify fetch is ongoing & hide other things
    fetchingWeatherData(`Fetching weather data for <span class="colored">${query}</span>...`);
    document.querySelector('.colored').style.color = 'yellow';

    //Use user query to fetch data that will produce the longitude & latitude for forecast fetch
    let userQuery = fetch(`${api.baseUrl}weather?q=${query}&units=metric&APPID=${api.key}`);

    userQuery.then(response => {
        return response.json();
    },
    error => {
        switch(error.code) {
            //I'm only sure that the 1st case works
            case error.INTERNET_DISCONNECTED:
                fetchError('Internet disconnected. Check your connection & try again...');
                break;
            case error.NETWORK_CHANGED:
                fetchError('Network changed! Check your connection & try again...');
                break;  
            case error.TIMED_OUT:
                fetchError('Timed out! Check your connection & try again...');
                break;  
            default:
                fetchError('Could not connect to server, please try again...');
        }
    })
    .then(displayResults);

    /*-------------------------------------------
    Implement service worker cache here
    --------------------------------------------*/
    getResultsFromCache(query);
}

function displayResults(response) {
    if (response.name === undefined) {
        fetchError(`"${searchCity.value}" does not not exist in Open Weather Map API database.`);
    }
    const current_city = document.querySelector('.current__city');
    current_city.innerHTML = `${response.name}, ${response.sys.country}`;
    
     /*-----------------------------------------------
    Implement localstorage.setItem() here - city only
    -------------------------------------------------*/
    storeCityInLocalStorage();

    //Use longitude and latitude obtained from user's query/search for fetch forecast data
    let automatedQuery = fetch(`${api.baseUrl}onecall?lat=${response.coord.lat}&lon=${response.coord.lon}&exclude=hourly&units=metric&appid=${api.key}`);
    
    automatedQuery.then(forecast => {
        return forecast.json();
    })
    .then(displayforecast);
}

function displayforecast(forecast) {
   
    let unix_time = forecast.current.dt * 1000;
    let date = new Date(unix_time);

    const current_day = document.querySelector('.current__day');
    current_day.innerHTML = date.toDateString();

    const current_temp = document.querySelector('.current__temp');
    current_temp.innerHTML = `${Math.round(forecast.current.temp)}°c`;

    const icon = document.querySelector('#icon');
    icon.src = `https://openweathermap.org/img/wn/${forecast.current.weather[0].icon}@2x.png`; //remove @2x to get a smaller img

    const current_weather = document.querySelector('.current__weather');
    current_weather.innerHTML = forecast.current.weather[0].main; //weather[0] as weather in the json is an array.

    const days = document.querySelectorAll('.daily__date');
    days.forEach(function (day, index) {
        unix_time = forecast.daily[index].dt * 1000;
        date = new Date(unix_time);
        day.innerHTML = date.toDateString();
    });

    const daily_temp = document.querySelectorAll('.daily__temp');
    daily_temp.forEach(function (temp, index) {
        temp.innerHTML = `Min ${Math.round(forecast.daily[index].temp.min)}°c | ${Math.round(forecast.daily[index].temp.max)}°c Max`;
    });

    const daily_icon = document.querySelectorAll('.small-icon');
    daily_icon.forEach(function (icon, index) {
        icon.src = `https://openweathermap.org/img/wn/${forecast.daily[index].weather[0].icon}@2x.png`; //remove @2x to get a smaller img
    });

    const daily_weather = document.querySelectorAll('.daily__weather');
    daily_weather.forEach(function (weather, index) {
        weather.innerHTML = forecast.daily[index].weather[0].main;
    });

    const daily_humidity = document.querySelectorAll('.daily__humidity');
    daily_humidity.forEach(function (humidity, index) {
        humidity.innerHTML = `Humidity ${Math.round(forecast.daily[index].humidity)}%`;
    });

    const daily_wind = document.querySelectorAll('.daily__wind');
    daily_wind.forEach(function (wind, index) {
        wind.innerHTML = `Wind (speed) ${Math.round(forecast.daily[index].wind_speed)}m/s`;
    });
    
    fetchCompleted();

    /*--------------------------------------------
    Implement localstorage.setItem() here - others
    ---------------------------------------------*/
    storeForecastInLocalStorage();

}


//----------- Service Worker Cache ------------------------------

 function getResultsFromCache(query) {
    if (!('caches' in window)) {
        return null;
    }

    const url = `${window.location.origin}/${api.baseUrl}weather?q=${query}&units=metric&APPID=${api.key}`;
    return caches.match(url)
        .then((response) => {
            if (response) {
                return response.json();
            }
            return null;
        })
        .catch((err) => {
            console.error('Error getting data from cache', err);
            return null;
        });
}


//------------------- Local storage -----------------------

function storeCityInLocalStorage() {
    let storedCity = document.querySelector('.current__city').innerHTML;
    localStorage.setItem('city', storedCity);
}

function storeForecastInLocalStorage() {
    let storedDay = document.querySelector('.current__day').innerHTML;
    localStorage.setItem('day', storedDay);

    let storedTemp = document.querySelector('.current__temp').innerHTML;
    localStorage.setItem('temp', storedTemp);

    let storedIcon = document.querySelector('#icon').src;
    localStorage.setItem('icon', storedIcon);

    let storedWeather = document.querySelector('.current__weather').innerHTML;
    localStorage.setItem('weather', storedWeather);

    let stored_days = document.querySelectorAll('.daily__date');
    stored_days.forEach(function (day, index) {

        let stored_day = day.innerHTML;
        localStorage.setItem(`daily-day-${index}`, stored_day);

    });

    let stored_daily_temp = document.querySelectorAll('.daily__temp');
    stored_daily_temp.forEach(function (temp, index) {

        let stored_temp = temp.innerHTML;
        localStorage.setItem(`daily-temp-${index}`, stored_temp);

    });

    let stored_daily_icon = document.querySelectorAll('.small-icon');
    stored_daily_icon.forEach(function (icon, index) {

        let stored_icon = icon.src;
        localStorage.setItem(`daily-icon-${index}`, stored_icon);

    });

    let stored_daily_weather = document.querySelectorAll('.daily__weather');
    stored_daily_weather.forEach(function (weather, index) {

        let stored_weather = weather.innerHTML;
        localStorage.setItem(`daily-weather-${index}`, stored_weather);

    });

    let stored_daily_humidity = document.querySelectorAll('.daily__humidity');
    stored_daily_humidity.forEach(function (humidity, index) {

        let stored_humidity = humidity.innerHTML;
        localStorage.setItem(`daily-humidity-${index}`, stored_humidity);

    });

    let stored_daily_wind = document.querySelectorAll('.daily__wind');
    stored_daily_wind.forEach(function (wind, index) {

        let stored_wind = wind.innerHTML;
        localStorage.setItem(`daily-wind-${index}`, stored_wind);

    });

}

function displayLocalStorageToScreen() {
    let getCity = localStorage.getItem('city');
    document.querySelector('.current__city').innerHTML = getCity;

    let getDay = localStorage.getItem('day');
    document.querySelector('.current__day').innerHTML = getDay;

    let getTemp = localStorage.getItem('temp');
    document.querySelector('.current__temp').innerHTML = getTemp;

    let getIcon = localStorage.getItem('icon');
    document.querySelector('#icon').src = getIcon;

    let getWeather = localStorage.getItem('weather');
    document.querySelector('.current__weather').innerHTML = getWeather;

    let get_days = document.querySelectorAll('.daily__date');
    get_days.forEach(function (day, index) {
        
        let get_day = localStorage.getItem(`daily-day-${index}`);
        day.innerHTML = get_day;

    });

    let get_daily_temp = document.querySelectorAll('.daily__temp');
    get_daily_temp.forEach(function (temp, index) {
        
        let get_temp = localStorage.getItem(`daily-temp-${index}`);
        temp.innerHTML = get_temp;

    });

    let get_daily_icon = document.querySelectorAll('.small-icon');
    get_daily_icon.forEach(function (icon, index) {

        let get_icon = localStorage.getItem(`daily-icon-${index}`);
        icon.src = get_icon;
        
    });

    let get_daily_weather = document.querySelectorAll('.daily__weather');
    get_daily_weather.forEach(function (weather, index) {

        let get_weather = localStorage.getItem(`daily-weather-${index}`);
        weather.innerHTML = get_weather;

    });

    let get_daily_humidity = document.querySelectorAll('.daily__humidity');
    get_daily_humidity.forEach(function (humidity, index) {

        let get_humidity = localStorage.getItem(`daily-humidity-${index}`);
        humidity.innerHTML = get_humidity;

    });

    let get_daily_wind = document.querySelectorAll('.daily__wind');
    get_daily_wind.forEach(function (wind, index) {

        let get_wind = localStorage.getItem(`daily-wind-${index}`);
        wind.innerHTML = get_wind;

    });
}

window.onload = function () {
    if (localStorage.getItem('city') === null) {
        load();
    }else {
        displayLocalStorageToScreen();
        fetchCompleted();
    } 
}

//https://api.openweathermap.org/data/2.5/onecall?lat=6.58&lon=3.75&exclude=hourly&units=metric&appid=6a41cf11109a848f1463b2e373b4ff69
//Icons made by <a href="https://www.flaticon.com/authors/xnimrodx" title="xnimrodx">xnimrodx</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>