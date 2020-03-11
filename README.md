# Fetch Tech Challenge

The demo for the project can be found here: (http://jason-fetch-challenge.meteorapp.com/)<br>

This is a coding challenge for Fetch Feedback INC to create an analytics dashboard using sample data.<br>

## Overview
There is an overview of the data which displays...
* The total amount of ratings given to a specific room
* The percentage of ratings below a 7 out of 10
* The average rating of the room
* The date of the last rating received

The data can be sorted from greatest to lowest and vice versa by clicking on their respective columns.<br>
Only 20 rooms will be displayed at once but, more can be displayed by clicking the "Load More" button at the bottom of the results.<br>
When a room is selected from the overview, it will populate the Comments and History section with the relevant information.<br>

### Comment Section
Will only display up to 10 comments that pertain to the selected room until the "Load More" button is clicked.

### History Section
Contains 3 graphs that give a clear overview of the data.<br>
Room Activity
* Displays how many ratings were done within the past 6 months

Satisfaction Overview
* Displays the total number of each rating

Satifaction History
* Displays the total average rating within the past 6 months

## This project makes use of the following extra packages:

chart.js (https://github.com/chartjs/Chart.js)<br>
papaparse (https://github.com/mholt/PapaParse)<br>
fourseven:scss (https://github.com/Meteor-Community-Packages/meteor-scss)<br>
momentjs:moment (https://github.com/moment/moment/)<br>

## To run it on your local machine
Install all dependencies by running the script...

```node
npm run setup
```

Then simply start the app by running...
```node
meteor
```

Enjoy! Many comments are left for you to follow.
