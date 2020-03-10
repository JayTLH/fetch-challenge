import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Data } from '../../../api/data.js';

import './overview.html';
import './overview.scss';

import '../room/room.js';

Template.overview.onCreated(function overviewOnCreated() {
  // creating state
  this.state = new ReactiveDict();

  // setting inital state to sort the room column from low to high
  this.state.set('sort', 'roomDown')
  // setting state to load only 20 results on startup
  this.state.set('loadRooms', 20)

  // setting subscription to the collection on the server
  Meteor.subscribe('data');
});

Template.overview.helpers({
  data() {
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
    // calculate for dissatisfaction and average rating, provide last rated date
    objectValues.forEach(value => {
      let badRating = value.rating.filter(index => index < 7).length
      let dissatisfied = Math.floor(badRating / value.rating.length * 100)
      stats[value.room].dissatisfied = dissatisfied

      let avg = 0
      value.rating.forEach(num => {
        avg += Number(num)
      })
      let result = Math.floor(avg / value.rating.length)
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
      const trim = value.ratingDate[value.ratingDate.length - 1]
        .split('')
        .slice(4, 15)
        .join('')
      stats[value.room].lastModified = trim
    })

    const instance = Template.instance()

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
      instance.state.set('full', 'full')
    } else {
      instance.state.set('full', null)
    }

    if (instance.state.get('search')) {
      return search
    } else {
      return shown
    }
  },

  full() {
    return Template.instance().state.get('full')
  }
});

Template.overview.events({
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
  }
});