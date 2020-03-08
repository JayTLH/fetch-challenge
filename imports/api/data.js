import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import Papa from 'papaparse';

export const Data = new Mongo.Collection('data');

const sample = Assets.getText('data.csv')
const parse = Papa.parse(sample).data

console.log(parse[2822])

// On server startup, if the database is empty, import data.
if (Meteor.isServer) {
  Meteor.startup(() => {
    if (Data.find().count() === 0) {
      for (let i = 1; i < parse.length; i++) {
        Data.insert({
          [parse[0][0]]: parse[i][0],
          [parse[0][1]]: parse[i][1],
          [parse[0][2]]: parse[i][2],
          [parse[0][3]]: parse[i][3],
          [parse[0][4]]: parse[i][4],
        })
      }
    }
  });
}