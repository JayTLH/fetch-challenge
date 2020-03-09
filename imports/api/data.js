import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import Papa from 'papaparse';

export const Data = new Mongo.Collection('data');

// code only runs on the server
if (Meteor.isServer) {
  Meteor.publish('data', function dataPublication() {
    return Data.find();
  })

  // On server startup, if the database is empty, import data.
  const sample = Assets.getText('data.csv')
  const parse = Papa.parse(sample).data
  Meteor.startup(() => {
    if (Data.find().count() === 0) {
      for (let i = 1; i < parse.length; i++) {
        Data.insert({
          [parse[0][0]]: parse[i][0],
          [parse[0][1]]: parse[i][1],
          [parse[0][2]]: parse[i][2],
          room: parse[i][3],
          [parse[0][4]]: parse[i][4],
        })
      }
    }
  });
}