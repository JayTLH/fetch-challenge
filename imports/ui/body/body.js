import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import Chart from 'chart.js';

import { Data } from '../../api/data.js';

import './body.html';
import './body.scss';

import '../components/navbar/navbar.js';
import '../components/room/room.js';
import '../components/comment/comment.js';

Template.body.onCreated(function overviewOnCreated() {
  // creating state
  this.state = new ReactiveDict();

  // setting inital state to sort the room column from low to high
  this.state.set('sort', 'roomDown')
  // setting state to load only 20 results on startup
  this.state.set('loadRooms', 20)
  // setting state to load only 10 comments on startup
  this.state.set('loadComments', 10)

  // setting subscription to the collection on the server
  Meteor.subscribe('data');
});

Template.body.helpers({
  data() {
    // calling template instance to access state
    const instance = Template.instance()

    // retrieve data from collection
    const rooms = Data.find({ room: { $ne: "null" } }).fetch()
    const filter = rooms.filter(item => item.room != "")

    // ***JASON***
    // tried to filter all rooms using $or but it kept returning every document, could other wise skip a step 
    // const rooms = Data.find({ $or: [{ room: { $ne: "null" } }, { room: { $ne: "" } }] }).fetch()
    // ***JASON***

    const stats = {}
    filter.forEach(item => {
      // creates a unique key for each room if it doesn't already exist
      if (!stats[item.room]) {
        stats[item.room] = {
          room: null,
          rating: [],
          ratingDate: [],
          comments: []
        }
      }

      // put values into respective keys
      stats[item.room].room = item.room
      stats[item.room].rating.push(item.rating)
      stats[item.room].ratingDate.push(item.receivedTime)
      if (item.comments != "") {
        stats[item.room].comments.push(item.comments)
      }
    })

    let objectValues = Object.values(stats)
    instance.state.set('allData', objectValues)

    // calculate for dissatisfaction and average rating, provide last rated date
    objectValues.forEach(value => {
      let badRating = value.rating.filter(index => index < 7).length
      let dissatisfied = Math.floor(badRating / value.rating.length * 100)
      stats[value.room].dissatisfied = dissatisfied

      const sumAvgArray = value.rating.reduce((prev, curr) => Number(prev) + Number(curr), 0)
      let result = Math.floor(sumAvgArray / value.rating.length)
      stats[value.room].average = result

      // applying color to rating
      if (Number(result) <= 6) {
        stats[value.room].red = "red"
      } else if (Number(result) >= 9) {
        stats[value.room].green = "green"
      } else {
        stats[value.room].yellow = "yellow"
      }

      // trimming date information, potentially change to regex
      const trim = value.ratingDate[value.ratingDate.length - 1].slice(4, 15)
      stats[value.room].lastModified = trim
    })

    // sort functions when appropriate elements are clicked
    if (instance.state.get('sort') === "roomDown") {
      objectValues.sort((a, b) => Number(a.room) < Number(b.room) ? -1 : 1)
    } else if (instance.state.get('sort') === "roomUp") {
      objectValues.sort((a, b) => Number(a.room) > Number(b.room) ? -1 : 1)
    } else if (instance.state.get('sort') === "frequencyDown") {
      objectValues.sort((a, b) => a.rating.length > b.rating.length ? -1 : 1)
    } else if (instance.state.get('sort') === "frequencyUp") {
      objectValues.sort((a, b) => a.rating.length < b.rating.length ? -1 : 1)
    } else if (instance.state.get('sort') === "percentageDown") {
      objectValues.sort((a, b) => a.dissatisfied > b.dissatisfied ? -1 : 1)
    } else if (instance.state.get('sort') === "percentageUp") {
      objectValues.sort((a, b) => a.dissatisfied < b.dissatisfied ? -1 : 1)
    } else if (instance.state.get('sort') === "averageDown") {
      objectValues.sort((a, b) => a.average > b.average ? -1 : 1)
    } else if (instance.state.get('sort') === "averageUp") {
      objectValues.sort((a, b) => a.average < b.average ? -1 : 1)
    }

    // search for a specific room number
    const search = objectValues.filter(index => index.room === instance.state.get('search'))

    // limiting amount of results shown until the user decides to load more
    const shown = objectValues.slice(0, Number(instance.state.get('loadRooms')))

    // hides the load more button when all the results are displayed
    if (shown.length === objectValues.length || search.length > 0) {
      instance.state.set('fullRooms', 'full')
    } else {
      instance.state.set('fullRooms', null)
    }

    if (instance.state.get('search')) {
      return search
    } else {
      return shown
    }
  },

  // returns to the class attribute to specify that all results have been displayed
  fullRooms() {
    return Template.instance().state.get('fullRooms')
  },

  comments() {
    const instance = Template.instance()

    // find the comments for the clicked room
    const findComments = instance.state.get('allData').find(index => index.room === instance.state.get('display'))
    instance.state.set('fullComments', 'full')

    if (instance.state.get('display')) {
      const commentArray = []
      findComments.comments.forEach(com => commentArray.push({ comment: com }))

      // display load more comments button if there are more than 10 left in the array
      if (commentArray.length != findComments.comments.length) {
        instance.state.set('fullComments', null)
      }

      if (commentArray.length > 0) {
        return commentArray
      } else {
        return [{ comment: "This room has no comments" }]
      }
    } else {
      return []
    }
  },

  // returns the room number that was clicked
  currentRoomNumber() {
    return Template.instance().state.get('display')
  },

  fullComments() {
    return Template.instance().state.get('fullComments')
  },

  // reveal graphs when room is selected
  showGraphs() {
    if (Template.instance().state.get('display')) {
      return 'show'
    } else {
      return null
    }
  }
});

Template.body.events({
  // setting state to sort columns both ways, high to low and low to high
  'click .sort-room'(event, instance) {
    if (instance.state.get('sort') === 'roomDown') {
      instance.state.set('sort', 'roomUp')
    } else {
      instance.state.set('sort', 'roomDown')
    }
  },
  'click .sort-frequency'(event, instance) {
    if (instance.state.get('sort') === 'frequencyDown') {
      instance.state.set('sort', 'frequencyUp')
    } else {
      instance.state.set('sort', 'frequencyDown')
    }
  },
  'click .sort-percentage'(event, instance) {
    if (instance.state.get('sort') === 'percentageDown') {
      instance.state.set('sort', 'percentageUp')
    } else {
      instance.state.set('sort', 'percentageDown')
    }
  },
  'click .sort-average'(event, instance) {
    if (instance.state.get('sort') === 'averageDown') {
      instance.state.set('sort', 'averageUp')
    } else {
      instance.state.set('sort', 'averageDown')
    }
  },

  // search by room number
  'submit .overview__search'(event, instance) {
    event.preventDefault()
    instance.state.set('search', event.target.search.value)
    instance.state.set('loadRooms', 20)
    event.target.search.value = ''
  },

  // increasing the amount of results shown
  'click .overview__load'(event, instance) {
    instance.state.set('loadRooms', Number(instance.state.get('loadRooms')) + 20)
  },

  // getting more info on a specific room
  'click .room'(event, instance) {
    instance.state.set('display', event.target.id)
    instance.state.set('loadComments', 10)

    const graphData = instance.state.get('allData').find(index => event.target.id === index.room)

    // creating date calculation function
    function calcDate(num) {
      let maxDate = moment()
      let minDate = maxDate.subtract(num, 'months')
      return minDate.format('MMM')
    }

    // creating counters for rating frequency
    const roomActivityData = { [calcDate(5)]: 0, [calcDate(4)]: 0, [calcDate(3)]: 0, [calcDate(2)]: 0, [calcDate(1)]: 0, [calcDate(0)]: 0 }
    // creating counters for each rating
    const satisfactionOverviewData = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
    // creating averages for each month
    const satifactionHistoryData = { [calcDate(5)]: 0, [calcDate(4)]: 0, [calcDate(3)]: 0, [calcDate(2)]: 0, [calcDate(1)]: 0, [calcDate(0)]: 0 }
    const avgArray = []

    graphData.rating.forEach((rating, index) => {
      // formatting date to ISO
      const day = graphData.ratingDate[index].slice(8, 10)
      const strMonth = graphData.ratingDate[index].slice(4, 7)
      const month = new Date(Date.parse(strMonth + " 1, 2012")).getMonth() + 1
      const year = graphData.ratingDate[index].slice(11, 15)
      let formatMonth = null
      if (month < 10) {
        formatMonth = "0" + month
      } else {
        formatMonth = month
      }
      const date = year + "-" + formatMonth + "-" + day

      // condition to check to see if data is within the past 6 months
      if (moment().subtract(6, 'months') < moment(date)) {
        // adding in the rating frequency to the respective key
        roomActivityData[strMonth] += 1

        // adding average rating to the respective key
        avgArray.push(rating)
        const sumAvgArray = avgArray.reduce((prev, curr) => Number(prev) + Number(curr), 0)
        satifactionHistoryData[strMonth] = Math.floor(sumAvgArray / avgArray.length)
      }

      // incrementing counter to respective key
      satisfactionOverviewData[rating] += 1
    })

    // small formatting on satifactionHistoryData
    const formatHistoryKeys = Object.keys(satifactionHistoryData)
    const formatHistoryValues = Object.values(satifactionHistoryData)
    formatHistoryKeys.forEach((key, index) => {
      if (satifactionHistoryData[key] === 0) {
        formatHistoryValues.splice(index, 1, formatHistoryValues[index - 1])
        satifactionHistoryData[key] = formatHistoryValues[index]
      }
    })

    // displaying graphs
    const roomActivity = new Chart(instance.find('#roomActivity'), {
      type: 'line',
      data: {
        labels: [calcDate(5), calcDate(4), calcDate(3), calcDate(2), calcDate(1), calcDate(0)],
        datasets: [{
          label: 'Frequency of Ratings',
          data: Object.values(roomActivityData),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              precision: 0,
            }
          }]
        },
        tooltips: {
          enabled: false
        }
      }
    })

    const satisfactionOverview = new Chart(instance.find('#satisfactionOverview'), {
      type: 'bar',
      data: {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        datasets: [{
          label: '# of Ratings',
          data: Object.values(satisfactionOverviewData),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              precision: 0
            }
          }]
        },
        tooltips: {
          enabled: false
        }
      }
    })

    const satifactionHistory = new Chart(instance.find('#satifactionHistory'), {
      type: 'line',
      data: {
        labels: [calcDate(5), calcDate(4), calcDate(3), calcDate(2), calcDate(1), calcDate(0)],
        datasets: [{
          label: 'Average Rating',
          data: Object.values(satifactionHistoryData),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              precision: 0,
              max: 10
            }
          }]
        },
        tooltips: {
          enabled: false
        }
      }
    })
  },

  // increase the amount of comments shown
  'click .comments__load'(event, instance) {
    instance.state.set('loadComments', Number(instance.state.get('loadComments')) + 10)
  },
});