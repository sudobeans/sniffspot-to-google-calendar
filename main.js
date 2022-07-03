
/**
 * Alerts and logs an error message.
 * @param {String} message the error message to display
 */
function alertLogError(message) {
    message = "Sniffspot to Google Calendar had an error! \n" + message;
    console.error(message);
    alert(message);
}

/**
 * If you're on Sniffspot.com, it will generate a csv file for Google Calendar,
 * and open a Google Calendar tab
 */
function makeCsv() {
    try{
        // This beginning of the code makes the rows of the CSV as an array [][]
        let csvRows = [];
        let reservations = getReservations();
        csvRows.push(["Subject", "Start Date", "Start Time", "End Time", "Description"]);
        for (let res of reservations) {
            // hackishly remove commas so they don't cause trouble later
            csvRows.push([
                `Sniffspot ${res.name}`.replaceAll(",", ""), 
                res.date.toLocaleDateString("en-us").replaceAll(",", ""),
                res.startTime,
                res.endTime,
                `Number of dogs: ${res.dogs}`
            ]);
        }
        console.log("Generated reservation array: ");
        console.log(csvRows);

        // This part of the code turns the rows into a CSV and downloads it.
        // Stolen from https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
        let csvContent = "data:text/csv;charset=utf-8,";
        csvRows.forEach(function(rowArray) {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sniffspot-calendar.csv");
        document.body.appendChild(link); // Required for FF
        link.click(); // This will download the sniffspot-calendar.csv

        // Open Google Calendar tab for easy importing
        window.open("https://calendar.google.com/calendar/u/0/r/settings/export", "_blank");
        
    } catch(e) {
        alertLogError(e);
    }
}

/**
 * Generates an array of visit objects for the webpage.
 * @return {Array} the array of visit objects.
 */
function getReservations() {
    let reservations = [];
    // The dates are stored in an infinite-scroll-component box
    let datesBox = document.querySelector(".infinite-scroll-component");
    // For each day's reservations container:
    for (let i = 0; i < datesBox.childNodes.length; i++) {
        let dateBox = datesBox.childNodes[i];
        // get date
        let date = dateBox.querySelector(".snif-m2").innerHTML.split(", ")[1];
        let reservationElements = dateBox.querySelectorAll(".res-block");
        // For each visit on that day:
        for (let j = 0; j < reservationElements.length; j++) {
            let reservation = new Reservation(reservationElements[j]);
            reservation.date = getNextDate(date);
            reservations.push(reservation);
        }
    }
    return reservations;

}

/**
 * Takes an HTML DOM object and turns it into a visitor object.
 * @param {Element} element an HTML element
 * @returns visitor object
 */
class Reservation {
    constructor(element) {
        this.name = element.querySelector(".snif-p").innerHTML;
        this.date = null;
        let times = element.querySelector(".res-time").querySelector(".snif-s1").innerHTML; // lol
        this.startTime = convertTo24HourTime(times.split(" - ")[0]);
        this.endTime = convertTo24HourTime(times.split(" - ")[1]);
        this.dogs = element.querySelector(".res-qty").querySelector(".snif-s1").innerHTML; // lol

        this.toString = function () {
            return `Visitor name: ${this.name} 
            Time: ${this.startTime} - ${this.endTime} Dogs: ${this.dogs}`;
        };
    }
}


function init() { 
    // add button to website
    let reservationsBox = document.getElementsByClassName("reservation-list-wrapper")[0];
    let makeCsvButton = document.createElement("button");
    makeCsvButton.setAttribute("class", "col-4 mb-2");
    makeCsvButton.innerText = "Click me to convert reservations into CSV file";
    makeCsvButton.addEventListener("click", makeCsv);
    reservationsBox.insertBefore(makeCsvButton, reservationsBox.firstChild);
    // document.unbindArrive();
}

/**
 * Get a Date object representing the next time this day shows up.
 * If it is today, return today.
 * @param {String} datestr string representing a date, like "May 31" (do not include year)
 * @returns {Date} a date object containing the next example of that date
 */
function getNextDate(datestr) {
    let dayBeforeToday = new Date();
    dayBeforeToday.setDate(dayBeforeToday.getDate() - 1);
    let result = new Date(`${datestr} ${dayBeforeToday.getFullYear()}`);

    // Add a year if result was in the past
    if (result < dayBeforeToday) {
        result.setFullYear(result.getFullYear() + 1);
    }

    return result;
}

/**
 * Converts a string to 24 hour time
 * String must be formatted like 3:30pm or 2am
 * I was too lazy to make it throw an exception if it's messed up
 * @param {String} time the time, formatted like 2am
 * @returns {String} the time in 24-hour time formatted like 17:30
 */
function convertTo24HourTime(time) {
    let period = time.substring(time.length - 2);
    let rest = time.substring(0, time.length - 2);
    let hours = rest.split(":")[0];
    if (period == "pm" && hours < 12) {
        hours = String(Number(hours) + 12);
    }
    let minutes = "00"
    if (rest.includes(":")) {
        minutes = rest.split(":")[1];
    }

    return `${hours}:${minutes}`
}

// wait for document to load before init
try {
    document.arrive(".reservation-list-wrapper", init);
    console.log("Sniffspot to Google Calendar loaded successfully")
} catch (e) {
    alertLogError("Error loading Sniffspot to Google Calendar extension. Error:\n" + e);
}