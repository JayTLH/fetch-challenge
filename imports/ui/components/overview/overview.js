import { Template } from 'meteor/templating';

import { Data } from '../../../api/data.js';

import './overview.html';
import './overview.scss';

import '../room/room.js';

Template.overview.onCreated(function bodyOnCreated() {
  Meteor.subscribe('data');
});

Template.overview.helpers({
  data() {
    const rooms = Data.find({ room: { $ne: "null" } }).fetch()
    // tried to filter all rooms using $or but it kept returning every document, could other wise skip a step 
    // const rooms = Data.find({ $or: [{ room: { $ne: "null" } }, { room: { $ne: "" } }] }).fetch()
    const filter = rooms.filter(item => item.room != "")

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
      stats[value.room].average = Math.floor(avg / value.rating.length)

      // trimming date information, potentially change to regex
      const trim = value.ratingDate[value.ratingDate.length - 1]
      .split('')
      .slice(4, 15)
      .join('')
      
      stats[value.room].lastModified = trim
    })

    return objectValues
  }
});